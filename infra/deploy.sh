#!/usr/bin/env bash
# Builds + pushes the api/worker images to GHCR and points the Container
# Apps at them, then deploys the frontend to Vercel via its CLI. Run this
# AFTER `terraform apply` has succeeded at least once (it needs the real
# api_url output). Re-run it any time you've changed app code and want to
# ship — it doesn't touch Terraform state at all.
set -euo pipefail

cd "$(dirname "$0")"
REPO_ROOT="$(cd .. && pwd)"

if ! command -v az >/dev/null; then
  echo "error: az CLI not found. Install it: https://learn.microsoft.com/cli/azure/install-azure-cli" >&2
  exit 1
fi

GHCR_USERNAME="$(terraform output -raw ghcr_username 2>/dev/null || true)"
IMAGE_PREFIX="$(terraform output -raw ghcr_image_prefix 2>/dev/null || true)"
GHCR_TOKEN="$(terraform output -raw ghcr_token 2>/dev/null || true)"
API_URL="$(terraform output -raw api_url)"
RESOURCE_GROUP="$(terraform output -raw resource_group)"
API_APP_NAME="$(terraform output -raw api_app_name)"
WORKER_APP_NAME="$(terraform output -raw worker_app_name)"
STRIPE_PUBLISHABLE_KEY="$(terraform output -raw stripe_publishable_key 2>/dev/null || true)"
PAYPAL_CLIENT_ID="$(terraform output -raw paypal_client_id 2>/dev/null || true)"
VERCEL_PROJECT_NAME="$(terraform output -raw project_name 2>/dev/null || true)"

if [ -z "$IMAGE_PREFIX" ]; then
  echo "error: could not read terraform outputs — run 'terraform apply' first." >&2
  exit 1
fi

if ! npx --yes vercel@latest whoami >/dev/null 2>&1; then
  echo "error: not logged in to Vercel CLI. Run 'npx vercel login' first." >&2
  exit 1
fi

TAG="$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || date +%s)"

echo "==> Logging in to ghcr.io as $GHCR_USERNAME"
# Pushing needs write:packages; the GHCR_TOKEN above is the read:packages-only
# classic PAT Azure uses to *pull* the image. Push instead with the local gh
# CLI session, which already carries write:packages.
gh auth token | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin

echo "==> Building api for linux/amd64 ($IMAGE_PREFIX/yakkyofy-api:$TAG)"
# --platform linux/amd64 is required regardless of the machine running this
# script: Azure Container Apps nodes are amd64-only, and a plain `docker
# build` on an Apple Silicon Mac produces an arm64 image that Azure can't
# run (confirmed via system logs: "no match for platform in manifest").
# --push is required alongside --platform because buildx can't `--load` a
# non-native-arch image into the local docker engine.
docker buildx build --platform linux/amd64 -t "$IMAGE_PREFIX/yakkyofy-api:$TAG" -f "$REPO_ROOT/apps/api/Dockerfile" --push "$REPO_ROOT"

echo "==> Building worker for linux/amd64 ($IMAGE_PREFIX/yakkyofy-worker:$TAG)"
docker buildx build --platform linux/amd64 -t "$IMAGE_PREFIX/yakkyofy-worker:$TAG" -f "$REPO_ROOT/apps/worker/Dockerfile" --push "$REPO_ROOT"

echo "==> Pointing Container Apps at the new images"
az containerapp update \
  --name "$API_APP_NAME" --resource-group "$RESOURCE_GROUP" \
  --image "$IMAGE_PREFIX/yakkyofy-api:$TAG"
az containerapp update \
  --name "$WORKER_APP_NAME" --resource-group "$RESOURCE_GROUP" \
  --image "$IMAGE_PREFIX/yakkyofy-worker:$TAG"

echo "==> Deploying frontend to Vercel (project: $VERCEL_PROJECT_NAME)"
cd "$REPO_ROOT"
if [ ! -d .vercel ]; then
  npx --yes vercel@latest link --yes --project="$VERCEL_PROJECT_NAME"
fi
# VITE_API_BASE_URL=/api (relative, same-origin) is forced explicitly here
# rather than left to client.js's own default, because the repo-root .env
# (loaded by apps/web/vite.config.js's envDir, for local docker-compose dev)
# hardcodes VITE_API_BASE_URL=http://localhost:4000/api, and Vite's env file
# value wins whenever this build-arg doesn't override it. vercel.json
# rewrites (proxies) "/api/*" to the Azure API, so a relative path keeps
# every browser request same-origin — a direct cross-origin XHR to the
# Azure host was silently dropping the auth cookie in browsers that block
# third-party cookies (Chrome's default), since SameSite=None cookies still
# count as third-party there. If you ever point this at a *different* live
# api_url, update the destination in vercel.json's rewrite too — it's
# hardcoded, not templated from this script.
DEPLOY_URL="$(npx --yes vercel@latest deploy --prod --yes \
  -b "VITE_API_BASE_URL=/api" \
  -b "VITE_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY" \
  -b "VITE_PAYPAL_CLIENT_ID=$PAYPAL_CLIENT_ID")"

echo
echo "Done. Web: $DEPLOY_URL"
echo "     API: $API_URL/health"
echo
WEB_ORIGIN="$(terraform output -raw web_origin 2>/dev/null || true)"
if [ -n "$WEB_ORIGIN" ] && [ "$WEB_ORIGIN" != "$DEPLOY_URL" ]; then
  echo "NOTE: web_origin in terraform.tfvars ($WEB_ORIGIN) doesn't match the actual"
  echo "      Vercel production URL above. Update it and run 'terraform apply' again"
  echo "      so the API's CORS allowlist matches, or login/checkout will fail."
fi
