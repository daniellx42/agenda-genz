# Auditoria do Projeto — Agenda GenZ

> Gerado em: 2026-03-12
> Status: Pré-publicação no GitHub

---

## Resumo Executivo

O projeto está bem estruturado e a arquitetura faz sentido em geral. Os fluxos principais (auth, billing PIX, agendamentos, uploads) estão coesos entre cliente e servidor. Os problemas encontrados são majoritariamente de inconsistência de branding, type safety e alguns detalhes que precisam ser corrigidos antes de ir para produção.

---

## 1. Problemas Críticos

### 1.1 `crypto` não importado em `upload.service.ts`

**Arquivo:** `apps/server/src/modules/uploads/upload.service.ts:36`

```typescript
// Linha 36 — sem import de crypto no topo do arquivo
const randomId = crypto.randomUUID();
```

`billing.service.ts` importa explicitamente com `import crypto from "node:crypto"` na linha 3, mas `upload.service.ts` usa `crypto.randomUUID()` sem nenhum import. O Bun expõe `crypto` globalmente (Web Crypto API), então provavelmente funciona em runtime, mas é inconsistente e pode quebrar em ambientes diferentes.

**Fix:** Adicionar `import crypto from "node:crypto";` no topo do arquivo.

---

## 2. Problemas de Alta Prioridade

### 2.1 Branding completamente inconsistente (4 conflitos)

O projeto tem 4 nomes/identidades diferentes convivendo no código:

| Local | Valor incorreto | Deveria ser |
|---|---|---|
| `apps/server/src/modules/billing/billing.service.ts:69` | `"GlowBook - Plano ${plan.name}"` | `"Agenda GenZ - Plano ${plan.name}"` |
| `apps/web/src/components/header.tsx:40` | `"Agendar Facil"` | `"Agenda GenZ"` |
| `apps/web/src/app/layout.tsx:24` | `"https://agendapro.app"` (fallback URL) | URL real do projeto |
| `apps/web/src/app/layout.tsx:77` | `creator: "@agendapro"` (Twitter) | Handle correto do projeto |

O impacto mais visível é o billing: o cliente vai ver "GlowBook" na descrição do PIX ao pagar — isso quebra a confiança.

### 2.2 `user.email` acessado via `as any` no checkout

**Arquivo:** `apps/server/src/modules/billing/billing.controller.ts:40`

```typescript
BillingService.createPixPayment(userId, (user as any).email, body.planId)
```

`user.email` faz parte do tipo base do Better Auth e **deveria estar tipado corretamente**. O cast `as any` está escondendo um problema de tipagem. Se o tipo de `user` retornado pelo middleware estiver errado, `email` pode chegar como `undefined` no MercadoPago, causando falha silenciosa no pagamento.

### 2.3 `authMiddleware` sem semicolon final

**Arquivo:** `apps/server/src/shared/middleware/auth.ts:52`

O arquivo termina com `.macro({...})` sem ponto-e-vírgula e sem `.as('plugin')`. Embora o Elysia funcione sem o semicolon, falta o encerramento adequado. Em algumas versões do Elysia, macros de plugins precisam de `.as('plugin')` para propagar corretamente os tipos para controllers que usam `.use(authMiddleware)`. Isso pode causar que TypeScript não reconheça `{ auth: true }` e `{ planGuard: true }` nas rotas.

---

## 3. Problemas de Média Prioridade

### 3.1 `process.env` direto em `next.config.ts` (bypass da validação)

**Arquivo:** `apps/web/next.config.ts:13`

```typescript
const authServerUrl = process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "");
```

Usa `process.env` diretamente ao invés do pacote `@agenda-genz/env/web` com validação Zod. Se a variável não estiver definida, a reescrita `/api/auth/*` retorna `[]` silenciosamente — o app vai parecer que funciona mas auth estará completamente quebrado em produção.

Mesmo problema em:
- `apps/web/src/app/layout.tsx:24` — `NEXT_PUBLIC_FRONTEND_URL`
- `apps/web/src/app/layout.tsx:96` — `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- `apps/web/src/app/sitemap.ts:3`
- `apps/web/src/app/robots.ts:3`

### 3.2 Dados falsos no JSON-LD da landing page

**Arquivo:** `apps/web/src/app/page.tsx:75-79`

```javascript
aggregateRating: {
  "@type": "AggregateRating",
  ratingValue: "4.9",
  reviewCount: "1200",   // <-- fabricado
},
screenshot: "/screenshots/app-screenshot.png",  // <-- arquivo provavelmente não existe
```

O Google pode penalizar ou remover rich snippets por dados falsos de `AggregateRating`. O arquivo de screenshot provavelmente não existe em `apps/web/public/screenshots/`.

### 3.3 FAQ da landing page afirma suporte offline (falso)

**Arquivo:** `apps/web/src/app/page.tsx:47`

```
"O app funciona offline para a maioria das funções."
```

O app é 100% dependente de API calls para o servidor Elysia — não há nenhuma implementação de cache offline, service worker ou sync local no `apps/app/`. Isso é uma promessa falsa para o usuário.

### 3.4 Admin page não redireciona usuário não autenticado

**Arquivo:** `apps/web/src/app/admin/page.tsx:14-18`

```typescript
if (!session) {
  return (
    <main className="grid w-full gap-6">
      <p>Usuário não autenticado.</p>
    </main>
  );
}
```

Exibe texto puro ao invés de redirecionar para `/login`. Usuário sem autenticação cai numa página em branco com texto simples.

### 3.5 WebSocket de billing não escala horizontalmente

**Arquivo:** `apps/server/src/modules/billing/billing.ws.ts:5`

```typescript
const connectedClients = new Map<string, Set<any>>();
```

O mapa de conexões ativas é **in-memory**. Em produção com múltiplas instâncias do servidor (Docker, Railway, etc.), o webhook do MercadoPago pode chegar na instância A enquanto o usuário está conectado na instância B — a notificação em tempo real nunca vai chegar. O polling via `useQuery` no checkout-screen serve como fallback, mas vale documentar esse limite.

### 3.6 `as any` em múltiplos pontos para campos customizados do usuário

Os campos `role`, `planExpiresAt`, `trialStartedAt` estão definidos como `additionalFields` no Better Auth mas acessados via `as any` em vários lugares:

- `apps/server/src/shared/middleware/auth.ts:38-39`
- `apps/server/src/modules/billing/billing.controller.ts:40`
- `apps/server/src/modules/billing/billing.ws.ts:33, 42, 58`
- `apps/app/src/app/_layout.tsx:49-51`

No cliente web (`apps/web/src/lib/auth-client.ts`), `inferAdditionalFields` já está configurado corretamente. No servidor, os tipos do `customSession` deveriam ser inferidos automaticamente.

---

## 4. Observações / Baixa Prioridade

### 4.1 Login page sem tratamento de erro de rede

**Arquivo:** `apps/web/src/app/login/page.tsx:10`

```typescript
const session = await authClient.getSession({
  fetchOptions: { headers: await headers(), throw: true },
});
```

`throw: true` vai lançar uma exceção se o servidor estiver down. Sem `try/catch` ou error boundary, a página vai quebrar com uma tela de erro genérica do Next.js.

### 4.2 Dupla chamada `getSession` por request protegida

Os macros `auth` e `planGuard` em `auth.ts` são independentes e ambos chamam `auth.api.getSession()`. Por design atual, cada rota usa apenas um deles — nenhuma rota usa os dois simultaneamente — portanto não há dupla chamada hoje. Mas se isso mudar no futuro, será um bug de performance.

### 4.3 Posição do `authMiddleware` no `app.ts`

**Arquivo:** `apps/server/src/app.ts`

O `billingWs` está registrado **fora** do grupo `/api`, direto na raiz:

```typescript
.use(billingWs)         // rota: /ws/billing
.group("/api", ...)     // rotas: /api/*
```

Isso é intencional (WebSocket não pode ter prefixo `/api`), mas vale confirmar que a autenticação do WS via cookies funciona corretamente quando o client faz o upgrade da conexão.

### 4.4 `client/[id]/appointments` na Stack mas sem arquivo correspondente

**Arquivo:** `apps/app/src/app/_layout.tsx:83`

```typescript
<Stack.Screen name="client/[id]/appointments" />
```

Esse screen está declarado mas o arquivo `apps/app/src/app/client/[id]/appointments.tsx` precisa existir para a rota funcionar.

---

## 5. O que está bem ✅

- **Estrutura do monorepo** — Turborepo, workspaces e packages bem separados
- **Schema do Prisma** — Dividido por domínio corretamente, relacionamentos e índices adequados
- **Fluxo de auth** — Better Auth com customSession, cookie seguro, Google OAuth, expo client — tudo coerente
- **Tipagem das APIs** — Elysia models com TypeBox bem definidos, `packages/api-types` expondo o tipo do App para o Eden client
- **Validação de env** — `@t3-oss/env-core` + Zod nos 3 ambientes (server, web, native)
- **Segurança de uploads** — Validação de tipo MIME, sanitização de filename, prefixos por userId, geração de signed URLs
- **Webhook do MercadoPago** — HMAC validado corretamente, lógica idempotente, stacking de expiração correto
- **Plano trial automático** — `databaseHooks.user.create` seta 90 dias de trial para novos usuários
- **CORS configurado** — Origins explícitos, credentials habilitado, suporte a Expo dev (`exp://`)
- **Formatters e utilitários** — Bem organizados em `src/lib/formatters/`

---

## 6. Checklist antes do GitHub

- [ ] Corrigir `crypto` import em `upload.service.ts`
- [ ] Corrigir branding: "GlowBook" → "Agenda GenZ" em `billing.service.ts`
- [ ] Corrigir branding: "Agendar Facil" → "Agenda GenZ" em `header.tsx`
- [ ] Corrigir fallback URL e Twitter handle em `layout.tsx`
- [ ] Remover ou corrigir `aggregateRating` falso do JSON-LD
- [ ] Verificar se `/public/screenshots/app-screenshot.png` existe
- [ ] Corrigir texto de offline no FAQ ou remover a claim
- [ ] Adicionar redirect para `/login` na `admin/page.tsx` para usuário não autenticado
- [ ] Validar que `user.email` está corretamente tipado no billing controller (remover `as any`)
- [ ] Verificar se `client/[id]/appointments.tsx` existe no app
- [ ] Adicionar `.env.example` com todas as variáveis necessárias (para o repo público fazer sentido)
- [ ] Garantir que `.env` files **não** estão sendo commitados (verificar `.gitignore`)

---

## 7. Variáveis de Ambiente Necessárias

### Server (`apps/server/.env`)
```
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CLOUDFLARE_ENDPOINT=
CLOUDFLARE_ACCESS_KEY_ID=
CLOUDFLARE_SECRET_ACCESS_KEY=
CLOUDFLARE_BUCKET=
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_PUBLIC_KEY=
MERCADO_PAGO_WEBHOOK_SECRET=
SERVER_URL=
FRONTEND_URL=
NODE_ENV=
```

### Web (`apps/web/.env`)
```
NEXT_PUBLIC_SERVER_URL=
NEXT_PUBLIC_FRONTEND_URL=
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
```

### Native (`apps/app/.env`)
```
EXPO_PUBLIC_SERVER_URL=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
```
