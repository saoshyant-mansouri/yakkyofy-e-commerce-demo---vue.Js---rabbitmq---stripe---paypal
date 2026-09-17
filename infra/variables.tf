variable "project" {
  description = "Short name prefix used in every resource name."
  type        = string
  default     = "yakkyofy-demo"
}

variable "location" {
  description = "Azure region for the resource group holding the api/worker Container Apps. Must match the existing Container Apps Environment's region (see container_apps_environment.tf) — Azure for Students subscriptions cap Container App Environments at 1 per subscription (not per region), so this deployment reuses an existing one rather than creating its own."
  type        = string
  default     = "francecentral"
}

variable "existing_container_app_environment_name" {
  description = "Name of the pre-existing Container Apps Environment to deploy into (see container_apps_environment.tf for why)."
  type        = string
}

variable "existing_container_app_environment_resource_group" {
  description = "Resource group of the pre-existing Container Apps Environment."
  type        = string
}

variable "web_origin" {
  description = "The frontend's deployed origin (Vercel), used for the API's CORS allowlist — e.g. \"https://yakkyofy-demo.vercel.app\". Vercel usually grants <project-name>.vercel.app if that name is free; confirm the actual URL after your first `vercel deploy` and update this (then `terraform apply` again) if it differs."
  type        = string
}

# --- MongoDB Atlas ---

variable "mongodbatlas_public_key" {
  description = "Atlas API public key (Organization Access Manager → API Keys). Used only to let Terraform manage the free M0 cluster."
  type        = string
  sensitive   = true
}

variable "mongodbatlas_private_key" {
  type      = string
  sensitive = true
}

variable "mongodbatlas_org_id" {
  description = "Your Atlas Organization ID (Organization Settings page)."
  type        = string
}

variable "mongodbatlas_region" {
  description = "Atlas region code for the free M0 cluster (AWS-backed), e.g. \"EU_WEST_1\". Must be one of the regions Atlas offers for M0 — see infra/README.md."
  type        = string
  default     = "EU_WEST_1"
}

# --- CloudAMQP (RabbitMQ) ---

variable "cloudamqp_customer_api_key" {
  description = "Your CloudAMQP account-level API key (cloudamqp.com → account icon → API access), NOT a per-instance key. Used only to let Terraform create the free instance."
  type        = string
  sensitive   = true
}

variable "cloudamqp_region" {
  description = "CloudAMQP region for the free 'lemming' (LavinMQ) instance, e.g. \"amazon-web-services::eu-west-1\". Pick one geographically close to `location` — verify it's offered for the free plan at signup, since CloudAMQP restricts free-tier region choice separately from paid plans."
  type        = string
  default     = "amazon-web-services::eu-west-1"
}

# --- Container registry (GHCR) ---

variable "ghcr_username" {
  description = "GitHub username used to authenticate Container Apps to pull images from ghcr.io."
  type        = string
}

variable "ghcr_token" {
  description = "GitHub Personal Access Token with `read:packages` scope, for pulling private GHCR images."
  type        = string
  sensitive   = true
}

variable "ghcr_image_prefix" {
  description = "GHCR image path prefix, typically ghcr.io/<your-github-username>. Images pushed by infra/deploy.sh must match this."
  type        = string
}

# --- App secrets (mirrors .env.example) ---

variable "jwt_access_secret" {
  description = "Generate with: openssl rand -hex 32"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "Generate with: openssl rand -hex 32"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  type      = string
  sensitive = true
}

variable "stripe_webhook_secret" {
  type      = string
  sensitive = true
  default   = ""
}

variable "stripe_publishable_key" {
  description = "Public key, baked into the web build — not sensitive, but kept alongside its secret counterpart."
  type        = string
  default     = ""
}

variable "paypal_client_id" {
  type    = string
  default = ""
}

variable "paypal_client_secret" {
  type      = string
  sensitive = true
  default   = ""
}

variable "paypal_env" {
  type    = string
  default = "sandbox"
}

variable "fx_api_url" {
  type    = string
  default = "https://open.er-api.com/v6/latest/EUR"
}
