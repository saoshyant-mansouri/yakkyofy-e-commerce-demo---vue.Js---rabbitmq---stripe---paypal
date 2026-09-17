# Yakkyofy-style Demo

A minimal, self-hostable clone of the shape of [Yakkyofy](https://yakkyofy.com)'s architecture
— a Vue SPA, a Node/Express + MongoDB API, an async RabbitMQ order pipeline, and three payment
providers (Stripe, PayPal, Mangopay) with multi-currency support. Mock catalogue data only; no
real charges. Design system is derived from [mhdmansouri.com](https://www.mhdmansouri.com/).

> This is a learning/demo project, not a production store. See **Security posture** below for
> what was deliberately changed vs. the real-world app it's modeled on.

## Stack & pinned versions

| Layer | Package | Version |
|---|---|---|
| Frontend | vue | 2.7.16 |
| | vuex | 3.6.2 |
| | vue-router | 3.6.5 |
| | vue-i18n | 8.28.2 |
| | vite | 7.3.6 |
| | @vitejs/plugin-vue2 | 2.3.4 |
| | tailwindcss / @tailwindcss/vite | 4.3.3 |
| | axios | 1.20.0 |
| | @stripe/stripe-js | 9.15.0 |
| | @paypal/paypal-js | 11.0.0 |
| | gsap (+ ScrollTrigger) | 3.15.0 |
| Backend | express | 5.2.1 |
| | mongoose | 9.9.4 |
| | amqplib | 2.0.1 |
| | jsonwebtoken | 9.0.3 |
| | bcryptjs | 3.0.3 |
| | stripe | 22.6.1 |
| | mangopay4-nodejs-sdk | 2.4.0 |
| | zod | 3.23.8 |
| Infra | MongoDB | 7 |
| | RabbitMQ | 3 (management) |
| | Node.js | ≥22.12 (Docker images use `node:22-alpine`, always current-patch) |

PayPal is integrated against the **official REST v2 Orders API directly** (`api-m.sandbox.paypal.com`)
rather than the `@paypal/paypal-server-sdk` npm wrapper, which as of this writing only covers a
handful of endpoints — the REST API is the stable, fully-documented surface every PayPal SDK
calls under the hood.

⚠️ **Local Node note**: Vite 7.x requires Node `20.19+` or `22.12+`. If your local Node is `22.11.x`
or older, `npm run dev:web` will print an engine warning (it still works) — upgrade with `nvm install 22`
if you want it silenced. Docker builds are unaffected (they use a current `node:22-alpine`).

## Repository layout

```
yakkyofy/
  docker-compose.yml
  .env.example
  apps/
    api/     Express REST API — auth, catalog, cart, checkout, webhooks
    worker/  RabbitMQ consumer — async order settlement + mock fulfillment
    web/     Vue 2 SPA — Vite + Tailwind v4
```

## Run locally with Docker (recommended)

```bash
cp .env.example .env
```

Edit `.env` and fill in your **sandbox** keys for Stripe / PayPal / Mangopay (see below for where
to get each). Then:

```bash
docker compose up --build
```

Seed the mock catalogue + demo user (first run only):

```bash
docker compose exec api npm run seed
```

- Web app: http://localhost:8080
- API: http://localhost:4000/api
- RabbitMQ management UI: http://localhost:15672 (guest/guest)

Demo login: `demo@yakkyofy-clone.test` / `DemoPass123!`

## Run locally without Docker (dev mode, hot reload)

Requires a local MongoDB and RabbitMQ (e.g. `brew install mongodb-community rabbitmq` or run just
those two services via `docker compose up mongo rabbitmq`).

```bash
npm install
cp .env.example .env   # edit MONGODB_URI/RABBITMQ_URL to point at localhost if not using docker
npm run seed
npm run dev:api      # terminal 1 — http://localhost:4000
npm run dev:worker   # terminal 2
npm run dev:web      # terminal 3 — http://localhost:5173
```

## Sandbox payment credentials

| Provider | Where to get sandbox keys | Test credentials |
|---|---|---|
| Stripe | https://dashboard.stripe.com/test/apikeys | Card `4242 4242 4242 4242`, any future expiry, any CVC |
| PayPal | https://developer.paypal.com/dashboard/applications/sandbox | Log in with a sandbox personal (buyer) account from the same dashboard |
| Mangopay | https://dashboard.sandbox.mangopay.com | Card `4970 1000 0000 0000`, any future MMYY, CVC `123` |

Mangopay's Card Direct flow is the most involved of the three (natural user → wallet → card
tokenization → pay-in) — it's implemented against the classic, long-documented CardRegistration
REST contract. If Mangopay has changed field names on their tokenization endpoint since this was
written, check your sandbox dashboard's current API reference and adjust
`apps/web/src/components/payment/MangopayPayForm.vue` accordingly.

## Deploying to Coolify (self-hosted)

1. Push this repo to a Git provider Coolify can reach (GitHub/GitLab/Bitbucket, or a private Gitea).
2. In Coolify: **New Resource → Docker Compose**, point it at this repo, and select `docker-compose.yml`.
3. Set the same variables from `.env.example` as Coolify environment variables for the resource
   (Coolify injects them at deploy time; you don't need to commit a real `.env`).
4. Coolify provisions Traefik + auto-SSL for the `web` service automatically once you attach a
   domain to it in the resource's Domains tab. Point the API's `WEB_ORIGIN` env var at that
   domain so CORS keeps working.
5. Deploy. Coolify will build all four images (api, worker, web, plus pulling mongo/rabbitmq) and
   start them together.

For a single-server "Heroku-style" alternative, the same Dockerfiles work under Dokku — create one
Dokku app per service (`api`, `worker`, `web`) and push each `apps/<service>` directory, or use
Dokku's `dokku git:from-image` / multi-Dockerfile support against this monorepo.

## Deploying to Azure + Vercel (Terraform, no/low-cost)

`infra/` has a full Terraform config tuned to run at effectively $0/month: the Vue SPA on
**Vercel**, the API/worker on Azure Container Apps (scale-to-zero), MongoDB Atlas's free M0 tier,
and CloudAMQP's free RabbitMQ-compatible plan instead of a self-hosted broker. See
**[infra/README.md](infra/README.md)** for the full walkthrough — `terraform apply` provisions the
Azure/Atlas/CloudAMQP infrastructure, `infra/deploy.sh` builds/ships the api and worker images and
then runs `vercel deploy` for the frontend (in that order, since Vite bakes the API's URL into the
frontend bundle at build time, which only exists once the API is provisioned).

## Security posture (fixes applied vs. the real-world app this is modeled on)

An earlier reverse-engineering review of the real Yakkyofy app found three chained issues. This
demo deliberately does the opposite in each case:

- **Auth cookies are `HttpOnly`** (+ `Secure` and `SameSite=None` in prod, `SameSite=Lax` in local
  dev where API and web share a site) — no client-side JS can ever read the session token, unlike
  the real app's `js-cookie`-readable tokens.
- **CORS is an explicit origin allowlist** (`cors({ origin: env.webOrigin, credentials: true })`),
  not a wildcard.
- **`passwordHash` uses Mongoose `select: false`** and a `toJSON` transform strips it and the
  Mangopay sub-document from every response, precluding the kind of over-fetching-via-populate
  leak found in the real app. Password hashing uses bcrypt cost factor **12** (real app used 8).
- **CSP + security headers are set on the actual HTML-serving origin** (`nginx.conf`), not just
  the JSON API — the real app had strict headers on the API host and none on the page host,
  which is the host that actually matters for XSS mitigation.

## UI

Layout mirrors a typical Yakkyofy-style dashboard: a fixed left sidebar for primary navigation
(Products / Orders) that collapses into an off-canvas drawer on mobile, and a slim top bar for
currency, cart, theme, and account controls. Light/dark mode is a real toggle (top bar, sun/moon
icon) backed by CSS custom properties in `apps/web/src/assets/main.css` — it defaults to the
browser's `prefers-color-scheme`, persists to `localStorage`, and applies before first paint (an
inline script in `index.html`) so there's no flash of the wrong theme.

The catalogue and everything past it (`/products`, `/cart`, `/checkout`, `/orders`) requires a
signed-in session, enforced both by the frontend route guard and — the one that actually
matters — `requireAuth` on the API's `/api/products*` routes. Two public pages sit in front of
that: a landing page at `/` (pitches the project, links out to
[mhdmansouri.com](https://www.mhdmansouri.com/)) and a `/system-design` showcase with hand-drawn
SVG architecture/database diagrams animated on scroll with GSAP + ScrollTrigger. Both use a
separate `PublicLayout` (no dashboard sidebar) from the authenticated app's `DashboardLayout` —
`App.vue` switches between them per-route via `meta.layout`.

## What's mocked / simplified

- Catalogue: 48 hand-curated products across 6 categories (`apps/api/src/scripts/seed.js`) — no
  real supplier integration, and no stock photos. Each product renders through
  `ProductImageTile.vue`, a small hand-drawn icon set matched per-product (not per-category) with
  a category-tinted gradient, so what you see always matches what the product actually is.
- FX rates: fetched from a free public API with a static fallback table so the app works fully
  offline.
- RabbitMQ pipeline: two stages (`order.process` verifies/decrements stock and marks paid/failed,
  `order.fulfill` records a mock "handed to carrier" event) with a dead-letter queue for failures
  — mirrors the shape of the real app's multi-stage async jobs without any real fulfillment.
