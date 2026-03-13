# Plano de Implementacao: Planos Mobile-First com PIX + Mercado Pago

## Objetivo

Construir a feature de planos do app com dominio compartilhavel entre mobile e web, mas implementando primeiro no mobile.

Regras de negocio iniciais:

- Todo usuario comeca com 3 meses gratis.
- Quando o acesso vencer, o usuario deve cair na tela de planos ao abrir o app.
- Os planos pagos serao: 1 mes, 3 meses, 6 meses e 1 ano.
- Nao existira cartao nem recorrencia automatica.
- O pagamento sera apenas via PIX com Mercado Pago.
- Quando um plano vencer, o usuario perde acesso ao app e volta para a tela de planos.
- Se o usuario comprar mais tempo antes de vencer, o prazo deve acumular.
  Exemplo: restam 20 dias do plano atual, compra mais 6 meses, o novo vencimento parte do `max(agora, accessEndsAtAtual)`.

## Recomendacao Executiva

O fluxo mais profissional para esse caso e:

1. Tratar o plano como um `entitlement` interno do sistema, com fonte de verdade no banco.
2. Usar o Mercado Pago apenas como gateway de cobranca e confirmacao de pagamento.
3. Usar webhook como mecanismo oficial de confirmacao do pagamento.
4. Usar WebSocket autenticado apenas para atualizar a UX em tempo real, nunca como fonte de verdade.
5. Mostrar o estado do plano no mobile via sessao + refresh dirigido por evento, sem polling global.
6. Bloquear acesso no backend com middleware proprio de billing, porque a UI sozinha nao protege a API.

Resumo da decisao principal:

- Nao recomendo guardar a validade do plano apenas no token.
- Recomendo guardar um snapshot na sessao para renderizacao e roteamento.
- Recomendo validar o entitlement real no backend a cada request protegida, mas com cache de baixa latencia para nao virar custo alto de banco.

Esse e o padrao que empresas maiores costumam seguir: `billing ledger/eventos -> projection atual -> enforcement no backend -> refresh de sessao no cliente`.

## Por Que Nao Confiar So No Token

Se a validade do plano ficar somente no token/sessao local:

- a mudanca nao reflete imediatamente quando o webhook aprovar o pagamento;
- a expiracao pode ficar stale se o token durar mais do que o entitlement;
- o usuario pode ficar com acesso indevido ate o proximo refresh;
- a troca de plano e o acumulo de meses ficam mais chatos para sincronizar.

Para este projeto, o token/sessao deve ser somente um snapshot de leitura rapida para a UI, nao a regra final de autorizacao.

## Arquitetura Recomendada

### 1. Fonte de verdade

Criar um dominio de billing proprio no banco com:

- um historico de compras/pagamentos;
- uma projecao atual de acesso por usuario;
- uma trilha de eventos de webhook para idempotencia e auditoria.

### 2. Enforcement

Separar em dois niveis:

- `client gate`: impede navegar para telas protegidas no mobile.
- `server gate`: impede usar a API mesmo se o cliente tentar burlar a UI.

### 3. Atualizacao de estado

Atualizar o estado do plano por 3 caminhos:

- ao abrir o app;
- ao voltar o app para foreground;
- quando chegar evento em tempo real apos confirmacao do webhook.

## Modelo de Dados Proposto

Adicionar um novo arquivo de schema: `packages/db/prisma/schema/billing.prisma`

### Tabelas principais

`PlanCatalog`

- `id`
- `code` (`TRIAL_3M`, `MONTH_1`, `MONTH_3`, `MONTH_6`, `YEAR_1`)
- `name`
- `durationMonths`
- `priceCents`
- `discountPercent`
- `active`

Observacao:

- Como o catalogo inicial e pequeno, ele tambem pode nascer em constante de servidor.
- Mesmo assim, eu prefiro manter a modelagem pronta para tabela ou ao menos DTO compartilhado, porque web e mobile vao consumir o mesmo contrato depois.

`UserBilling`

- `userId` unique
- `status` (`TRIALING`, `ACTIVE`, `EXPIRED`, `PENDING_PAYMENT`, `BLOCKED`)
- `trialStartedAt`
- `trialEndsAt`
- `accessStartsAt`
- `accessEndsAt`
- `entitlementVersion` inteiro
- `lastPaymentAt`
- `lastWebhookAt`
- `createdAt`
- `updatedAt`

`BillingPurchase`

- `id`
- `userId`
- `planCode`
- `durationMonths`
- `amountCents`
- `status` (`PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`, `CANCELLED`)
- `gateway` (`MERCADO_PAGO`)
- `gatewayPaymentId`
- `gatewayMerchantOrderId`
- `externalReference`
- `pixQrCode`
- `pixCopyPaste`
- `pixExpiresAt`
- `approvedAt`
- `createdAt`
- `updatedAt`

`BillingWebhookEvent`

- `id`
- `provider`
- `topic`
- `resourceId`
- `action`
- `externalReference`
- `payload`
- `signatureValid`
- `processedAt`
- `processingError`
- `createdAt`

### Regra de acumulacao de meses

Quando um pagamento for aprovado:

```text
baseDate = max(agora, userBilling.accessEndsAt ?? agora)
novoAccessEndsAt = adicionarMeses(baseDate, plano.durationMonths)
```

Isso resolve corretamente:

- trial ainda ativo + compra antecipada;
- plano ativo + compra adicional;
- plano vencido + reativacao.

## Fluxo de Vida do Usuario

### 1. Cadastro

No onboarding/login bem-sucedido:

- criar `UserBilling` se nao existir;
- definir `trialStartedAt = agora`;
- definir `trialEndsAt = agora + 3 meses`;
- definir `accessStartsAt = agora`;
- definir `accessEndsAt = trialEndsAt`;
- definir `status = TRIALING`;
- definir `entitlementVersion = 1`.

### 2. App boot

No `apps/app/src/app/_layout.tsx`:

- continuar usando `authClient.useSession()`;
- adicionar um `BillingGateProvider` ou `useBillingGate`;
- se houver sessao mas `planGateRequired = true`, renderizar a stack de billing em vez da stack `(app)`.

### 3. Expiracao

Quando `accessEndsAt < agora`:

- UI manda para a tela de planos;
- API responde `402` ou `403` padronizado para rotas que exigem plano ativo;
- limpar ou invalidar queries do React Query relacionadas a dados protegidos.

### 4. Compra

Ao escolher um plano:

- app chama `POST /api/billing/purchases`;
- backend cria a cobranca PIX no Mercado Pago;
- backend salva `BillingPurchase` em `PENDING`;
- backend devolve QR Code, copia e cola e expiracao do PIX.

### 5. Confirmacao

Quando o Mercado Pago enviar webhook:

- validar assinatura;
- responder rapido `200`/`201`;
- consultar o pagamento no proprio Mercado Pago para confirmar o status real;
- atualizar `BillingPurchase`;
- recalcular `UserBilling`;
- incrementar `entitlementVersion`;
- publicar evento em tempo real para o usuario conectado.

## Integracao Mercado Pago

### Abordagem recomendada

Usar Checkout API / Payments API com PIX criado no backend.

Por que:

- combina com a estrategia sem cartao e sem recorrencia;
- permite controlar `external_reference`, expiracao, valor e idempotencia;
- encaixa melhor com webhook + reconciliacao interna.

### Regras importantes

- Criar pagamento sempre no backend.
- Enviar `X-Idempotency-Key` nas criacoes para evitar cobranca duplicada.
- Salvar `externalReference` com `userId`, `planCode` e `purchaseId`.
- Nunca confiar apenas no payload do webhook; buscar o pagamento na API do Mercado Pago antes de conceder acesso.
- Processar webhook com idempotencia.

### Estados minimos de pagamento

- `PENDING`
- `APPROVED`
- `REJECTED`
- `EXPIRED`
- `CANCELLED`

## Webhook + Tempo Real

### Minha opiniao sobre WebSocket autenticado

A ideia e boa, com uma ressalva importante:

- WebSocket autenticado deve melhorar a experiencia do usuario.
- WebSocket nao deve ser o mecanismo que garante consistencia do billing.

Fluxo ideal:

1. Mercado Pago confirma por webhook.
2. Seu backend atualiza banco e cache.
3. Seu backend publica `billing.updated` no canal do usuario.
4. O app recebe o evento.
5. O app executa `authClient.getSession({ query: { disableCookieCache: true } })` e invalida queries.

### Quando eu usaria WebSocket neste projeto

- na tela de pagamento PIX para mudar automaticamente de "aguardando pagamento" para "pagamento aprovado";
- para refletir upgrade de plano sem o usuario fechar e abrir o app;
- para sincronizar troca de plano comprada em outro dispositivo.

### Quando eu nao dependeria dele

- na checagem de acesso ao abrir o app;
- na seguranca da API;
- na reconciliacao final do pagamento.

### SSE vs WebSocket

Se fosse web-only e unidirecional, SSE seria mais simples.
Como o foco agora e Expo/React Native, WebSocket autenticado tende a ser mais pratico.

Conclusao:

- para mobile-first, WebSocket autenticado e uma boa escolha;
- manter o socket escopado ao app foreground ou a tela de pagamento;
- nao manter uma conexao permanente atoa se o unico objetivo for confirmar um pagamento eventual.

## Estrategia Profissional de Checagem de Plano

Essa e a parte mais importante do desenho.

### O que eu recomendo

#### Camada 1: sessao para UI

Expor na sessao do Better Auth:

- `billingStatus`
- `accessEndsAt`
- `planGateRequired`
- `entitlementVersion`

Isso permite:

- decidir rapidamente se o mobile mostra a stack de planos;
- evitar chamar endpoint de billing em toda navegacao.

No `packages/auth/src/index.ts`, a extensao deve usar `customSession` e/ou campos adicionais.

#### Camada 2: cache para autorizacao no backend

Toda rota protegida deve passar por um novo middleware, por exemplo:

- `authMiddleware`
- `billingMiddleware`

O `billingMiddleware`:

- recebe `userId` da sessao;
- consulta um cache de entitlement por usuario;
- em cache miss, consulta `UserBilling` no banco;
- se estiver expirado, bloqueia a rota;
- se estiver valido, segue.

### Cache recomendado

Se houver Redis disponivel, usar:

- chave `billing:entitlement:{userId}`
- TTL curto, algo entre 60 e 300 segundos

Se ainda nao houver Redis:

- começar com banco + invalidacao dirigida;
- se o trafego crescer, migrar para Redis sem mudar o contrato.

### Por que isso e melhor que guardar tudo no token

- mudanca por webhook reflete sem esperar expiracao longa do token;
- expiracao pode ser invalidada imediatamente;
- upgrade acumulado de meses fica correto;
- a API continua segura mesmo se o app estiver com snapshot antigo.

## Como Refletir Mudanca de Plano Rapidamente

Quando o usuario pagar ou extender o plano:

1. webhook atualiza `UserBilling`;
2. `entitlementVersion` sobe;
3. cache do usuario e invalidado;
4. evento em tempo real e emitido;
5. app faz refetch da sessao;
6. app invalida queries e libera a navegacao.

Mesmo sem WebSocket:

- no retorno da tela de pagamento, fazer refetch da sessao;
- ao voltar o app para foreground, fazer refetch da sessao;
- isso ja cobre a maior parte dos casos sem polling continuo.

## Como Integrar com a Stack Atual

### Backend

Criar modulo novo em `apps/server/src/modules/billing/` com:

- `billing.controller.ts`
- `billing.service.ts`
- `billing.repository.ts`
- `billing.model.ts`
- `billing.webhook.controller.ts`
- `billing.realtime.ts` se houver socket

Rotas iniciais:

- `GET /api/billing/plans`
- `GET /api/billing/me`
- `POST /api/billing/purchases`
- `POST /api/billing/webhooks/mercado-pago`

Middleware:

- `apps/server/src/shared/middleware/billing.ts`

Aplicar o middleware nas rotas que exigem plano ativo.

### Mobile

Criar feature em `apps/app/src/features/billing/` com:

- `screens/plans-screen.tsx`
- `screens/payment-pix-screen.tsx`
- `api/billing-query-options.ts`
- `api/billing-mutations.ts`
- `lib/billing-gate.ts`
- `components/plan-card.tsx`
- `components/payment-status-card.tsx`

Fluxo de navegacao:

- stack publica para login;
- stack protegida por sessao;
- dentro da sessao, gate de billing antes do `(app)`.

### Auth

Em `packages/auth/src/index.ts`:

- adicionar campos de billing no `customSession`;
- configurar refresh dirigido quando necessario;
- manter cuidado com cache de cookie se for habilitado no futuro.

### Banco

Criar `packages/db/prisma/schema/billing.prisma` e rodar:

```bash
bun run db:migrate --name add_billing
```

## Ordem de Implementacao

### Fase 1: dominio e schema

- criar schema de billing;
- gerar migration;
- criar repository/service;
- criar funcao central `computeBillingAccess`.

### Fase 2: sessao e enforcement

- expor billing no session payload;
- criar `billingMiddleware`;
- aplicar middleware nas rotas protegidas;
- retornar erro padronizado de plano expirado.

### Fase 3: planos e UX mobile

- tela de planos;
- cards dos 4 planos;
- tela de pagamento PIX;
- gate no root layout.

### Fase 4: Mercado Pago

- endpoint de criacao de compra;
- integracao PIX;
- webhook com assinatura + idempotencia + reconciliacao.

### Fase 5: realtime

- WebSocket autenticado por usuario;
- evento `billing.updated`;
- refetch de sessao e invalidacao de cache no app.

### Fase 6: observabilidade

- logs estruturados em criacao de cobranca;
- logs estruturados em webhook;
- metrica de pagamentos aprovados;
- metrica de usuarios bloqueados por expiracao.

## Regras de Negocio e Edge Cases

- compra aprovada durante trial: soma em cima de `accessEndsAt` atual, nao joga fora o trial restante;
- compra aprovada depois do vencimento: reativa a partir de `agora`;
- webhook duplicado: nao pode gerar meses em dobro;
- pagamento expirado: manter `BillingPurchase` como `EXPIRED`, sem alterar `UserBilling`;
- falha temporaria do webhook: permitir reprocessamento idempotente;
- pagamento aprovado em outro device: app atual deve refletir apos evento ou proximo refresh;
- usuario autenticado mas sem plano ativo: pode acessar apenas rotas de billing, perfil basico e logout;
- admin/ferramenta interna futura: permitir ajuste manual de acesso sem editar pagamento.

## Testes Necessarios

### Backend

- `computeBillingAccess` com trial, ativo, expirado e acumulacao;
- aprovacao de pagamento somando meses corretamente;
- idempotencia de webhook;
- bloqueio de middleware quando expirado;
- liberacao de middleware quando ativo.

### Mobile

- gate redireciona para planos quando `planGateRequired = true`;
- apos aprovar pagamento e refetch da sessao, usuario entra no app;
- expiracao limpa queries e bloqueia navegacao.

### Integracao

- criar compra PIX;
- receber webhook `approved`;
- atualizar `UserBilling`;
- refletir no app sem relogin manual.

## Decisoes Recomendadas

- Sim para Mercado Pago + PIX + webhook.
- Sim para WebSocket autenticado, mas somente como complemento de UX.
- Nao para guardar autorizacao final somente no token.
- Sim para `UserBilling` como projecao atual de acesso.
- Sim para `BillingPurchase` + `BillingWebhookEvent` por auditoria e idempotencia.
- Sim para middleware de billing no backend.
- Sim para refresh de sessao no app ao abrir, ao foreground e apos evento de billing.

## Fontes e Referencias

- Better Auth session management: https://www.better-auth.com/docs/concepts/session-management
- Better Auth options reference: https://www.better-auth.com/docs/reference/options
- Mercado Pago webhooks: https://www.mercadopago.com.br/developers/en/docs/checkout-pro/payment-notifications
- Mercado Pago webhook signature validation: https://www.mercadopago.com.br/developers/en/docs/your-integrations/notifications/webhooks
- Mercado Pago PIX checkout API: https://www.mercadopago.com.br/developers/en/docs/checkout-api-payments/integration-configuration/integrate-pix
- Firebase custom claims propagation: https://firebase.google.com/docs/auth/admin/custom-claims
- Auth0 token best practices: https://auth0.com/docs/secure/tokens/token-best-practices
- MDN Server-Sent Events: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
- MDN WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
- Stripe entitlements overview: https://docs.stripe.com/billing/entitlements

## Conclusao

Se eu fosse implementar hoje neste repositorio, eu faria assim:

1. billing como dominio proprio no banco;
2. sessao com snapshot de billing para a UI;
3. middleware de billing na API com cache;
4. webhook Mercado Pago como mecanismo oficial de concessao de acesso;
5. WebSocket autenticado apenas para remover friccao na UX.

Esse desenho atende o mobile agora, reaproveita quase tudo no web depois e evita os dois extremos ruins:

- polling o tempo inteiro;
- confiar demais em token stale.
