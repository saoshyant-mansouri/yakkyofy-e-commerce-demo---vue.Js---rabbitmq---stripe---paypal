# Deploying to Azure + Vercel

Terraform provisions the Azure/Atlas/CloudAMQP infrastructure; `deploy.sh` builds and ships the
api/worker images and deploys the frontend to Vercel. Neither step runs itself — you run both,
with your own credentials. Nothing here provisions or charges anything until you run `terraform
apply` yourself.

## What this costs

| Component | Where | Cost |
|---|---|---|
| Vue SPA | **Vercel** (Hobby tier) | $0 |
| Express API | Azure Container App, scales to zero | ~$0 |
| RabbitMQ worker | Azure Container App, scales to zero (wakes on queue depth via KEDA) | ~$0 |
| MongoDB | **MongoDB Atlas M0** (free forever, no credit card, real MongoDB, 512MB) | $0 |
| RabbitMQ broker | CloudAMQP "lemming" plan (free forever; runs LavinMQ, not literal RabbitMQ, but same wire protocol) | $0 |
| Container images | GHCR (ghcr.io) | $0 |
| Logs | Log Analytics, PerGB2018, 30-day retention | low cents/month |

Realistic total: a few cents a month from log ingestion, unless real traffic exceeds Container
Apps' free monthly compute grant (180,000 vCPU-seconds / 360,000 GiB-seconds / 2M requests,
shared between the api and worker apps) or Vercel's 100GB/month Hobby bandwidth cap — won't
happen at demo/portfolio-viewer volume.

The frontend went to Vercel instead of a third Container App because it's a better fit for a
static SPA (CDN-backed, no cold start) and it's what was asked for. Vercel's Hobby tier ToS
restricts it to personal/non-commercial use — fine here since Stripe/PayPal only ever run in
sandbox mode.

MongoDB Atlas was chosen over Azure Cosmos DB for MongoDB vCore's own free tier specifically to
avoid that tier's undocumented, region-gated availability — there's no read-only Azure CLI/API
call that tells you which regions support it (checked: `az cosmosdb mongocluster` has no
`list-skus` command, and the ARM provider's operations metadata has nothing SKU-related either).
Atlas M0 has no such ambiguity and needs no credit card. The one Atlas-specific limitation: an M0
cluster can be **created** via Terraform but not **updated in place** afterward (any config change
needs destroy + recreate) — irrelevant here since this config never resizes it.

## Prerequisites

- An Azure subscription, and the [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) installed
- [Terraform](https://developer.hashicorp.com/terraform/install) ≥ 1.9
- [Docker](https://docs.docker.com/get-docker/), for `deploy.sh`
- A free [MongoDB Atlas](https://cloud.mongodb.com/) account (org + API key — no credit card needed)
- A free [CloudAMQP](https://www.cloudamqp.com/) account (for the RabbitMQ instance + its API key)
- A free [Vercel](https://vercel.com/) account, logged in locally via `npx vercel login`
- A GitHub account + a Personal Access Token with `read:packages` + `write:packages` — either a
  classic PAT from [github.com/settings/tokens](https://github.com/settings/tokens), or if you're
  already logged into `gh` CLI: `gh auth refresh --scopes read:packages,write:packages` then
  `gh auth token`. Note this is unrelated to any SSH key you use for `git push`/`git clone` — SSH
  keys authenticate the git protocol; container registries (GHCR included) only accept
  HTTPS token auth, there's no SSH equivalent.

## 1. Authenticate

```bash
az login
npx vercel login
```

Terraform's `azurerm` provider uses the `az` CLI session automatically — no service principal
needed for a personal deployment. `deploy.sh` uses the local Vercel CLI session the same way, via
`npx vercel whoami` — no token stored anywhere.

## 2. Configure

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
```

Fill in `terraform.tfvars` — MongoDB Atlas keys, CloudAMQP key, GHCR username/token, JWT secrets
(`openssl rand -hex 32` each), Stripe test keys, PayPal sandbox keys. It's gitignored — this is
the one file with real secrets in it. Also set `web_origin` to
`https://<your-chosen-vercel-project-name>.vercel.app` (Vercel usually grants exactly that if the
name is free — `deploy.sh` will warn you at the end if the real one comes back different).

## 3. Provision the infrastructure

```bash
terraform init
terraform plan    # review what it's about to create
terraform apply
```

This creates the Azure/Atlas/CloudAMQP resources, with the api/worker Container Apps pointed at a
tiny public placeholder image — Terraform isn't a build tool, so it can't build your app images
itself, and the frontend needs to know the API's real URL (assigned by Azure) before it can even
be built. That's what step 4 is for.

## 4. Build and ship

```bash
./deploy.sh
```

Builds `api`/`worker`, pushes them to GHCR, updates the Container Apps to use the new images, then
runs `vercel deploy --prod` for the frontend with the real API URL baked in as a build-time env
var. Re-run this alone (skip `terraform apply`) any time you change app code — it doesn't touch
Terraform state.

## 5. Seed the database and smoke-test

The API's seed script needs to run once, from wherever it can reach the Atlas connection string —
simplest is a one-off local run against the deployed database:

```bash
MONGODB_URI="$(terraform output -raw mongodb_uri)" node ../apps/api/src/scripts/seed.js
```

Then check it's all wired up:

```bash
curl "$(terraform output -raw api_url)/health"    # {"status":"ok"}
```

Open the Vercel URL `deploy.sh` printed at the end, register, browse, and run a Stripe test-card
checkout. This specifically exercises the cross-domain HttpOnly-cookie fix (API and web are on
different domains entirely in this deployment) — if login/cart/checkout don't persist across page
loads, check that `web_origin` in `terraform.tfvars` actually matches the Vercel URL, and
`terraform apply` again if you had to change it.

## Updating

Code change → `./deploy.sh`. Infra change → edit the `.tf` files, `terraform plan`, `terraform
apply`.

## Tearing down

```bash
terraform destroy
```

Deletes the Azure resource group and everything in it, the Atlas project/cluster/user, and the
CloudAMQP instance — all three are Terraform-managed. It does **not** delete the Vercel project
(not Terraform-managed — remove it from the Vercel dashboard) or your GHCR images/PAT (yours to
clean up separately; they cost nothing to leave).
