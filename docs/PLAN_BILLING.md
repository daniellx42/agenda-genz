# Plano de Implementação — Feature de Planos e Pagamento PIX

## Visão Geral

O usuário tem **3 meses de trial gratuito**. Ao expirar, o app exibe a tela de planos
(paywall). Planos disponíveis: 1 mês, 3 meses, 6 meses e 1 ano. Pagamento exclusivamente
por PIX via MercadoPago. Sem pagamento recorrente — ao expirar o plano, o usuário é
redirecionado para o paywall novamente.

---

## Decisão Arquitetural — Validação de Plano sem Custo de DB

### Problema
Como verificar se o plano está válido sem bater no banco em cada requisição?

### Solução Adotada: `planExpiresAt` no modelo `User`

Armazenar `planExpiresAt: DateTime?` diretamente no modelo `User` (auth.prisma).
O motivo é simples: o Better Auth **já faz um SELECT na tabela `user` em todo request**
autenticado ao chamar `auth.api.getSession()`. Isso retorna o objeto `user` completo —
incluindo `planExpiresAt`. Logo, a verificação do plano é **zero custo adicional**.

```
Request → authMiddleware.getSession() → user.planExpiresAt → comparar com Date.now()
                    ↑
              1 query (já obrigatória para auth)
              nenhuma query extra
```

**No mobile**: `planExpiresAt` é cacheado no Zustand com persistência MMKV. Na abertura
do app, a verificação é local (sem rede). Sincroniza ao:
1. Login/reload de sessão
2. Receber evento WebSocket de ativação de plano
3. App voltar ao foreground após 30 min de inatividade

### Comparativo de Abordagens

| Abordagem | Custo por request | Latência de update | Complexidade |
|---|---|---|---|
| `planExpiresAt` no User (escolhida) | 0 extra (piggyback no getSession) | WebSocket imediato | Baixa |
| JWT com claims de plano | 0 (stateless) | Ruim — precisa esperar token expirar | Média |
| Redis cache | ~1ms (Redis) | Médio — invalidação manual | Alta |
| Query direta em cada request | +1 DB query | Imediato | Baixa |

**Por que não JWT stateless?** O plano pode ser atualizado (stacking) a qualquer momento.
Com JWT de 15min você teria até 15 min de estado desatualizado. Com sessão em DB (Better Auth),
a atualização em `user.planExpiresAt` é imediatamente visível no próximo `getSession()`.

### Plan Stacking (acúmulo de planos)

Quando o usuário compra um novo plano enquanto ainda tem tempo restante:

```
novoVencimento = max(user.planExpiresAt ?? agora, agora) + mesesDoNovoPLano
```

Exemplo:
- Usuário comprou 1 mês → `planExpiresAt = 2026-04-11`
- No mesmo dia compra 6 meses → `planExpiresAt = 2026-10-11` (acumula)
- Após update no DB: emitir evento WebSocket → mobile atualiza Zustand na hora

---

## Decisão Arquitetural — WebSocket para Confirmação de Pagamento

### Fluxo PIX + WebSocket

```
Mobile                    Backend                    MercadoPago
  |                          |                            |
  |-- POST /checkout ------->|                            |
  |<- { qrCode, paymentId } -|                            |
  |                          |                            |
  |-- WS connect (auth) ---->|                            |
  |   (aguarda evento)       |                            |
  |                          |<-- webhook POST -----------|
  |                          |  (valida HMAC)             |
  |                          |  update DB                 |
  |                          |  user.planExpiresAt        |
  |<-- WS: plan_activated ---|                            |
  |   (atualiza Zustand)     |                            |
  |   (navega do paywall)    |                            |
```

### Por que WebSocket e não SSE ou polling?

- **Polling a cada 2s por 60s** = ~30 requests por pagamento. Caro e desnecessário.
- **SSE**: unidirecional, limite de 6 conexões por domínio no browser (menos crítico no
  native, mas WebSocket é mais natural para mobile com autenticação via cookie).
- **WebSocket**: Elysia tem suporte nativo, bidirecional (permite heartbeat para detectar
  desconexão), autenticado via cookie (mesma sessão Better Auth).

---

## Banco de Dados — `packages/db/prisma/schema/billing.prisma` (novo arquivo)

```prisma
enum PlanType {
  MONTHLY    // 1 mês
  QUARTERLY  // 3 meses
  BIANNUAL   // 6 meses
  ANNUAL     // 12 meses
}

enum SubscriptionStatus {
  TRIAL
  ACTIVE
  EXPIRED
}

enum PixPaymentStatus {
  PENDING    // aguardando pagamento
  PAID       // confirmado pelo webhook
  FAILED     // falhou ou expirou
  CANCELLED
}

model Plan {
  id               String         @id @default(cuid())
  type             PlanType       @unique
  durationMonths   Int
  priceInCents     Int            // preço total em centavos
  discountPercent  Int            @default(0)
  isActive         Boolean        @default(true)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  pixPayments PixPayment[]

  @@map("plan")
}

model PixPayment {
  id                   String           @id @default(cuid())
  userId               String
  planId               String
  mercadopagoPaymentId String?          @unique
  status               PixPaymentStatus @default(PENDING)
  amountInCents        Int
  pixQrCode            String?          // texto copia-e-cola
  pixQrCodeBase64      String?          // imagem base64 do QR
  paidAt               DateTime?
  expiresAt            DateTime         // PIX expira em 30 min

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  plan Plan @relation(fields: [planId], references: [id])
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@map("pix_payment")
}
```

### Alterações em `auth.prisma`

Adicionar ao modelo `User`:
```prisma
  trialStartedAt DateTime?
  planExpiresAt  DateTime?
  pixPayments    PixPayment[]
```

> **Nota**: `planExpiresAt` unifica trial + plano pago. No trial, é setado para
> `createdAt + 90 dias`. Ao comprar plano, é recalculado com stacking.

---

## Tabela de Planos e Preços (seed)

| Tipo | Duração | Preço | Desconto vs mensal |
|---|---|---|---|
| MONTHLY | 1 mês | R$ 39,90 | — |
| QUARTERLY | 3 meses | R$ 99,90 | ~17% (R$ 33,30/mês) |
| BIANNUAL | 6 meses | R$ 179,90 | ~25% (R$ 29,98/mês) |
| ANNUAL | 12 meses | R$ 299,90 | ~37% (R$ 24,99/mês) |

---

## Backend — `apps/server/src/modules/billing/`

### Arquivos

```
billing.model.ts       — TypeBox schemas (body, responses, erros)
billing.repository.ts  — queries Prisma
billing.service.ts     — lógica de negócio (stacking, MercadoPago, HMAC)
billing.controller.ts  — rotas REST
billing.ws.ts          — WebSocket handler + mapa userId→ws
```

### Rotas REST

```
GET  /api/billing/plans              — lista planos ativos (público)
GET  /api/billing/subscription       — plano atual do usuário logado
POST /api/billing/checkout           — body: { planId } → cria pagamento PIX
GET  /api/billing/payments/:id       — status do pagamento (fallback polling)
POST /api/billing/webhook            — MercadoPago webhook (sem auth, valida HMAC)
```

### WebSocket

```
WS   /api/billing/ws                 — autenticado via cookie Better Auth
```

Eventos emitidos pelo servidor:
```ts
{ type: "plan_activated";  planExpiresAt: string }  // pagamento confirmado
{ type: "payment_failed";  paymentId: string }      // pagamento expirou/falhou
{ type: "ping" }                                    // heartbeat 30s
```

### Lógica de Checkout

```ts
// billing.service.ts
async createCheckout(userId: string, planId: string) {
  const plan = await repo.findPlan(planId);

  // 1. Criar preferência no MercadoPago
  const mpPayment = await mercadopago.payment.create({
    transaction_amount: plan.priceInCents / 100,
    payment_method_id: "pix",
    payer: { email: user.email },
    notification_url: `${env.SERVER_URL}/api/billing/webhook`,
  });

  // 2. Salvar no banco
  await repo.createPixPayment({
    userId,
    planId,
    mercadopagoPaymentId: String(mpPayment.id),
    amountInCents: plan.priceInCents,
    pixQrCode: mpPayment.point_of_interaction.transaction_data.qr_code,
    pixQrCodeBase64: mpPayment.point_of_interaction.transaction_data.qr_code_base64,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
  });

  return { pixQrCode, pixQrCodeBase64, paymentId, expiresAt };
}
```

### Lógica do Webhook (MercadoPago → confirma pagamento)

```ts
// billing.service.ts
async handleWebhook(headers, body) {
  // 1. Validar assinatura HMAC (código fornecido pelo usuário)
  const { isValid, paymentId } = validateWebhook(headers, body);
  if (!isValid) throw status(400, "Webhook inválido");

  // 2. Buscar pagamento no banco
  const payment = await repo.findByMercadopagoId(paymentId);
  if (!payment || payment.status !== "PENDING") return;

  // 3. Confirmar com MercadoPago (evitar fraude)
  const mpPayment = await mercadopago.payment.get(paymentId);
  if (mpPayment.status !== "approved") return;

  // 4. Calcular novo planExpiresAt (com stacking)
  const user = await repo.findUser(payment.userId);
  const newExpiry = calcNewExpiry(user.planExpiresAt, payment.plan.durationMonths);

  // 5. Atualizar banco em transação
  await prisma.$transaction([
    prisma.pixPayment.update({ where: { id: payment.id }, data: { status: "PAID", paidAt: new Date() } }),
    prisma.user.update({ where: { id: payment.userId }, data: { planExpiresAt: newExpiry } }),
  ]);

  // 6. Notificar mobile via WebSocket
  billingWs.notifyUser(payment.userId, {
    type: "plan_activated",
    planExpiresAt: newExpiry.toISOString(),
  });
}

function calcNewExpiry(currentExpiry: Date | null, durationMonths: number): Date {
  const base = currentExpiry && currentExpiry > new Date() ? currentExpiry : new Date();
  const result = new Date(base);
  result.setMonth(result.getMonth() + durationMonths);
  return result;
}
```

### Plan Guard Middleware

Adicionar ao `authMiddleware` em `apps/server/src/shared/middleware/auth.ts`:

```ts
planGuard: {
  async resolve({ status, request: { headers } }) {
    const session = await auth.api.getSession({ headers });
    if (!session?.user?.id) throw status(401, Errors.AUTH.UNAUTHORIZED.message);

    const now = new Date();
    const planExpiresAt = (session.user as UserWithPlan).planExpiresAt;
    if (!planExpiresAt || planExpiresAt < now) {
      throw status(402, Errors.BILLING.PLAN_EXPIRED.message);
    }

    return { userId: session.user.id, user: session.user };
  }
}
```

Aplicar `planGuard` (em vez de `auth`) em todos os controllers de negócio:
`clientController`, `serviceController`, `timeSlotController`, `appointmentController`, `uploadController`.

### Better Auth — Hook de Criação de Usuário

Em `packages/auth/src/index.ts`, adicionar `databaseHooks`:

```ts
databaseHooks: {
  user: {
    create: {
      before: async (user) => {
        return {
          data: {
            ...user,
            trialStartedAt: new Date(),
            planExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 dias
          },
        };
      },
    },
  },
},
```

### Variáveis de Ambiente Novas (`packages/env/src/server.ts`)

```ts
MERCADOPAGO_ACCESS_TOKEN: z.string().min(1),
MERCADOPAGO_WEBHOOK_SECRET: z.string().min(1),
MERCADOPAGO_PUBLIC_KEY: z.string().min(1),   // usado no mobile (env/native)
SERVER_URL: z.url(),                          // para notification_url do webhook
```

---

## Mobile — `apps/app/src/`

### Store de Assinatura — `stores/subscription-store.ts`

```ts
// Zustand + MMKV persist
interface SubscriptionStore {
  planExpiresAt: string | null;  // ISO string
  setPlanExpiresAt: (date: string | null) => void;
  isPlanActive: () => boolean;   // computed: planExpiresAt > now
  syncFromSession: (session: Session) => void;
}
```

### Estrutura de Rotas (Expo Router)

```
app/
  _layout.tsx             — guard: se !isPlanActive → redirect para /paywall/plans
  (auth)/                 — login (sem guard)
  (app)/                  — telas principais (requer plano ativo)
  (paywall)/
    _layout.tsx           — Stack sem tabs
    plans.tsx             — cards de planos + preços
    checkout.tsx          — QR code PIX + countdown + WebSocket listener
    success.tsx           — animação de sucesso + botão "Começar a usar"
  appointment/[id].tsx
  client/[id].tsx
```

### Guard no `_layout.tsx` Raiz

```tsx
// apps/app/src/app/_layout.tsx
const isPlanActive = useSubscriptionStore((s) => s.isPlanActive());

// Rotas protegidas por plano:
<Stack.Protected guard={!!session && isPlanActive}>
  <Stack.Screen name="(app)" />
  <Stack.Screen name="appointment/[id]" />
  <Stack.Screen name="client/[id]" />
</Stack.Protected>

// Paywall — acessível quando logado mas sem plano:
<Stack.Protected guard={!!session && !isPlanActive}>
  <Stack.Screen name="(paywall)" />
</Stack.Protected>
```

### Tela de Planos — `(paywall)/plans.tsx`

- Cards para cada plano com preço e economia destacada
- Badge "MAIS POPULAR" no plano de 6 meses
- Badge "MELHOR VALOR" no plano anual
- Botão "Selecionar" → navega para `/paywall/checkout?planId=...`

### Tela de Checkout — `(paywall)/checkout.tsx`

```
┌─────────────────────────────────────┐
│  Plano Semestral — R$ 179,90        │
│                                     │
│  [QR CODE PIX]                      │
│                                     │
│  [📋 Copiar código PIX]             │
│                                     │
│  ⏱ Expira em 28:43                 │
│                                     │
│  Aguardando pagamento...            │
│  (spinner animado)                  │
└─────────────────────────────────────┘
```

- Conecta ao WebSocket ao montar
- Recebe `plan_activated` → navega para `/paywall/success`
- Countdown do PIX (30 min)
- Se expirar: botão "Gerar novo PIX"

### Hook WebSocket — `hooks/use-billing-ws.ts`

```ts
export function useBillingWs(onPlanActivated: (planExpiresAt: string) => void) {
  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE_URL}/api/billing/ws`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "plan_activated") {
        onPlanActivated(data.planExpiresAt);
      }
    };

    // heartbeat para manter conexão viva
    const ping = setInterval(() => ws.readyState === 1 && ws.send("ping"), 25000);

    return () => { clearInterval(ping); ws.close(); };
  }, []);
}
```

### Sincronização de `planExpiresAt` no Mobile

| Evento | Ação |
|---|---|
| Login / carregamento de sessão | `syncFromSession(session.user.planExpiresAt)` |
| Receber `plan_activated` via WS | `setPlanExpiresAt(event.planExpiresAt)` |
| App volta ao foreground após 30 min | Re-fetch de sessão → `syncFromSession(...)` |
| Logout | `setPlanExpiresAt(null)` |

---

## Proteção na API — Resumo do Fluxo

```
Mobile request → authMiddleware (planGuard)
                    ↓
            getSession() — 1 query (obrigatória)
                    ↓
            user.planExpiresAt > now ?
              SIM → deixa passar
              NÃO → 402 Payment Required
```

O cliente mobile recebe 402 → limpa Zustand → exibe paywall.
(Camada extra de segurança: mesmo que o cache local do mobile diga "ativo",
o servidor sempre valida via session.)

---

## Ordem de Implementação (Tasks)

### Fase 1 — Backend

**Task 1 — Schema DB + Migration**
- Criar `packages/db/prisma/schema/billing.prisma` com `Plan`, `PixPayment`, `PlanType`, `PixPaymentStatus`
- Adicionar `trialStartedAt`, `planExpiresAt`, `pixPayments` ao `User` em `auth.prisma`
- Rodar `bun run db:migrate --name add_billing`

**Task 2 — Seed de Planos**
- Script `packages/db/prisma/seed-plans.ts` inserindo os 4 planos (upsert por type)
- Adicionar script `db:seed-plans` no `package.json` do db

**Task 3 — Better Auth — Trial no Cadastro**
- Adicionar `databaseHooks.user.create.before` em `packages/auth/src/index.ts`
- Setar `trialStartedAt` e `planExpiresAt = now + 90 dias`

**Task 4 — Env vars**
- Adicionar `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `SERVER_URL` em `packages/env/src/server.ts`
- Adicionar `EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY` em `packages/env/src/native.ts`

**Task 5 — Módulo Billing (model + repository + service)**
- `billing.model.ts` — TypeBox schemas
- `billing.repository.ts` — findPlans, findActivePayment, createPixPayment, updatePaymentStatus, updateUserPlanExpiry
- `billing.service.ts` — createCheckout, handleWebhook, validateWebhook (HMAC fornecido), calcNewExpiry

**Task 6 — Controller REST**
- `billing.controller.ts` — GET plans, GET subscription, POST checkout, GET payment/:id, POST webhook

**Task 7 — WebSocket Handler**
- `billing.ws.ts` — Map de userId → ws, auth via cookie, notifyUser()
- Integrar ao `createApp()` em `app.ts`

**Task 8 — Plan Guard Middleware**
- Adicionar macro `planGuard` ao `authMiddleware`
- Adicionar erro `BILLING.PLAN_EXPIRED` em `errors.ts`
- Substituir `auth` por `planGuard` nos controllers de negócio

**Task 9 — Testes Backend**
- Testes unitários para `calcNewExpiry` (stacking, trial expirado, trial vigente)
- Testes unitários para `validateWebhook` (HMAC válido e inválido)
- Testes de integração para webhook flow

### Fase 2 — Mobile

**Task 10 — Zustand Store**
- `stores/subscription-store.ts` com MMKV persist
- `isPlanActive()` (computed), `setPlanExpiresAt()`, `syncFromSession()`

**Task 11 — Guard no _layout.tsx**
- Integrar `useSubscriptionStore`
- Adicionar rotas `(paywall)` e ajustar `Stack.Protected`
- `syncFromSession` no useEffect que observa mudança de sessão

**Task 12 — Tela de Planos**
- `app/(paywall)/plans.tsx`
- Cards de plano com design (price breakdown por mês, desconto %, badges)
- `useQuery` para buscar planos da API

**Task 13 — Tela de Checkout + WebSocket**
- `app/(paywall)/checkout.tsx`
- QR code (expo-modules ou `<Image source={{ uri: \`data:image/png;base64,${qrBase64}\` }}`)
- Hook `useBillingWs` com listener para `plan_activated`
- Countdown 30 min com Reanimated
- Botão copiar código PIX (`expo-clipboard`)

**Task 14 — Tela de Sucesso**
- `app/(paywall)/success.tsx`
- Animação Reanimated (check mark + partículas ou Lottie)
- Botão "Começar a usar" → `router.replace("/(app)/appointments")`

**Task 15 — Sincronização de Sessão no Foreground**
- `AppState` listener em `_layout.tsx` — se inativo > 30 min, re-fetch sessão

---

## Estrutura Final de Arquivos

```
packages/db/prisma/schema/
  billing.prisma                  ← NOVO
  auth.prisma                     ← alterado (planExpiresAt, trialStartedAt)

packages/env/src/
  server.ts                       ← alterado (+MERCADOPAGO_*, +SERVER_URL)
  native.ts                       ← alterado (+EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY)

packages/auth/src/
  index.ts                        ← alterado (databaseHooks trial)

apps/server/src/
  modules/billing/
    billing.model.ts              ← NOVO
    billing.repository.ts         ← NOVO
    billing.service.ts            ← NOVO (inclui validateWebhook HMAC)
    billing.controller.ts         ← NOVO
    billing.ws.ts                 ← NOVO
  shared/
    constants/errors.ts           ← alterado (+BILLING.PLAN_EXPIRED)
    middleware/auth.ts            ← alterado (+planGuard macro)
  app.ts                          ← alterado (billingController + billingWs)

apps/app/src/
  stores/
    subscription-store.ts         ← NOVO
  hooks/
    use-billing-ws.ts             ← NOVO
  features/billing/
    components/
      plan-card.tsx               ← NOVO
      pix-qr-display.tsx          ← NOVO
  app/
    _layout.tsx                   ← alterado (guard por plano)
    (paywall)/
      _layout.tsx                 ← NOVO
      plans.tsx                   ← NOVO
      checkout.tsx                ← NOVO
      success.tsx                 ← NOVO
```

---

## Pontos de Atenção

1. **Webhook sem auth**: A rota `POST /api/billing/webhook` não usa `planGuard` nem `authMiddleware`.
   A autenticação é feita exclusivamente pelo HMAC do MercadoPago.

2. **Double-spend protection**: Antes de atualizar o plano no webhook, confirmar o status
   com a API do MercadoPago (`GET /v1/payments/{id}`) para evitar fraude com webhooks forjados.

3. **Idempotência do webhook**: MercadoPago pode enviar o mesmo webhook mais de uma vez.
   Verificar `payment.status === "PENDING"` antes de processar (já contemplado no serviço).

4. **WebSocket no mobile**: Usar o cookie da sessão Better Auth nos headers do WebSocket
   (`Cookie: better-auth.session_token=...`) via `authClient.getCookie()`.

5. **PIX expiração**: O QR code do PIX expira em 30 minutos. Se o usuário não pagar,
   mostrar botão "Gerar novo PIX" que chama `POST /checkout` novamente.

6. **Fallback de polling**: O hook `useBillingWs` deve ter um fallback: se o WebSocket
   não conectar em 5s, fazer polling a cada 5s em `GET /billing/payments/:id`.

7. **Desconexão do WS**: Se o usuário fechar o app e reabrir após pagar (sem ver o WS),
   a próxima chamada de sessão (`authClient.useSession`) já trará o `planExpiresAt` atualizado —
   o guard se resolverá automaticamente sem precisar do WS.
