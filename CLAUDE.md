# CAT-STORE — Contexto do Projeto

## Visão Geral
Loja de e-commerce de calçados (tênis Force One / linha Caterpillar). Next.js 14 App Router, TypeScript, Prisma ORM, PostgreSQL (Neon), deploy no Vercel.

**Repositório da loja:** `https://github.com/caterinc/Caterinc`
**URL da loja:** `https://loja-caterpillar.com` (NUNCA expor este domínio ao Meta)
**URL da VSL:** `https://forces-one.com` (repositório: `https://github.com/caterinc/force-one`)

---

## Regras Críticas

### 🔴 Loja INVISÍVEL para o Meta — SEMPRE
- O domínio `loja-caterpillar.com` nunca pode aparecer em nenhum evento enviado ao Meta
- `event_source_url` nos eventos CAPI é SEMPRE `https://forces-one.com`
- Nenhum pixel Meta na loja — só CAPI server-side
- O link da loja na VSL está ofuscado com `atob()` para esconder de bots
- Verificar isso em QUALQUER alteração que envolva Meta/pixel/CAPI

### Banco de dados
- Usar `npx prisma db push` (NUNCA `migrate dev`)
- Parar o servidor Node antes de rodar `prisma generate`

---

## Stack

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **ORM:** Prisma
- **Banco:** PostgreSQL — Neon (`DATABASE_URL` no Vercel)
- **Auth:** NextAuth.js (credenciais + JWT)
- **Pagamento:** Mercado Pago (PIX + cartão)
- **Deploy:** Vercel
- **CSS:** Tailwind CSS

---

## Meta CAPI

- **Pixel ID atual:** `1002744542493838`
- **Token:** variável de ambiente `META_CAPI_TOKEN` no Vercel
- **Arquivo principal:** `src/lib/meta-capi.ts`
- `event_source_url` hardcoded como `https://forces-one.com`
- PII (email, phone, nome) são hasheados com SHA-256 antes de enviar

### Eventos disparados
| Evento | Onde |
|---|---|
| PageView | VSL `forces-one.com` (pixel browser) |
| AddToCart | `src/app/api/payments/add-to-cart/route.ts` |
| InitiateCheckout | `src/app/api/payments/initiate/route.ts` |
| AddPaymentInfo | `src/app/api/payments/create/route.ts` (ao gerar PIX) |
| Purchase (PIX) | `src/app/api/payments/webhook/route.ts` + `src/app/api/cron/check-payments/route.ts` |
| Purchase (cartão) | `src/app/api/payments/create/route.ts` |

### Atribuição fbclid
1. Anúncio → `forces-one.com?fbclid=XYZ`
2. VSL captura fbclid e `_fbp` cookie, passa via URL params no botão
3. Checkout lê fbclid/fbp da URL, salva em localStorage
4. Ao criar pedido, fbc/fbp são salvos em `order.utmData.fbc` e `order.utmData.fbp`
5. Webhook/cron lê fbc/fbp do utmData ao disparar Purchase

---

## VSL — forces-one.com

- Página de demonstração do produto (não é página de venda agressiva)
- Pixel Meta dispara `PageView` ao carregar
- Botão "Acessar a loja oficial" usa `atob()` para montar a URL da loja — invisível para bots
- fbclid e fbp são passados como query params ao clicar no botão
- **NÃO colocar o domínio `loja-caterpillar.com` em texto claro em nenhum lugar da VSL**

---

## Variáveis de Ambiente (Vercel)

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL |
| `NEXTAUTH_SECRET` | Segredo do NextAuth |
| `NEXTAUTH_URL` | `https://loja-caterpillar.com` |
| `MP_ACCESS_TOKEN` | Mercado Pago (conta pode estar suspensa) |
| `MP_PUBLIC_KEY` | Mercado Pago público |
| `META_CAPI_TOKEN` | Token da API de Conversões do Meta |
| `CRON_SECRET` | Header Bearer para o cron-job.org (ver Vercel) |
| `ADMIN_GATE_SECRET` | Segredo para desbloquear /admin (ver Vercel) |

---

## Arquivos-chave

```
src/
├── app/
│   ├── (store)/produtos/[slug]/AddToCartButton.tsx  — dispara AddToCart CAPI
│   ├── (checkout)/checkout/page.tsx                 — checkout completo, sessionStorage PIX
│   ├── (admin)/admin/pedidos/                       — listagem + bulk status
│   ├── (admin)/admin/pedidos/[id]/page.tsx          — detalhe + link WhatsApp
│   └── api/
│       ├── payments/create/route.ts                 — cria pedido + AddPaymentInfo
│       ├── payments/webhook/route.ts                — confirma PIX + Purchase
│       ├── payments/initiate/route.ts               — InitiateCheckout
│       ├── payments/add-to-cart/route.ts            — AddToCart
│       ├── cron/check-payments/route.ts             — fallback cron para PIX
│       └── admin/orders/bulk-status/route.ts        — atualização em massa de pedidos
├── lib/
│   ├── meta-capi.ts     — CAPI (PIXEL_ID + VSL_URL hardcoded aqui)
│   ├── utmify.ts        — UTMify integration
│   └── prisma.ts        — singleton PrismaClient
```

---

## Cron — check-payments

Configurado no cron-job.org para checar pagamentos PIX pendentes:
- **URL:** `https://loja-caterpillar.com/api/cron/check-payments`
- **Método:** GET
- **Intervalo:** 1 minuto
- **Header:** `Authorization: Bearer <CRON_SECRET do Vercel>`

---

## Admin

- **URL:** `https://loja-caterpillar.com/admin`
- Para desbloquear: acessar `/gate?s=ADMIN_GATE_SECRET` primeiro (valor no Vercel)

---

## Pagamento — Mercado Pago

- Conta pode estar suspensa — verificar status antes de testar
- PIX: webhook em `https://loja-caterpillar.com/api/payments/webhook`
- Fallback: cron a cada 1 min verifica pedidos PENDING dos últimos 3 dias
- Após aprovação: status → CONFIRMED, paymentStatus → PAID

---

## Notas importantes

- Pedido tem campo `utmData` (JSON) que armazena UTMs + fbc + fbp
- PIX page usa sessionStorage para persistir estado entre refreshes
- Bulk status update na listagem de pedidos (checkboxes + barra de ação)
- Link WhatsApp no detalhe do pedido admin (número do endereço de entrega)
- `order.total` é Decimal no Prisma — sempre converter com `Number()` no frontend
