output "api_url" {
  description = "Used by infra/deploy.sh to build the Vercel deployment with the right VITE_API_BASE_URL / CSP origin."
  value       = "https://${azurerm_container_app.api.ingress[0].fqdn}"
}

output "resource_group" {
  value = azurerm_resource_group.main.name
}

# Read by infra/deploy.sh so GHCR credentials only need to live in
# terraform.tfvars, not also duplicated into shell env vars.
output "ghcr_username" {
  value = var.ghcr_username
}

output "ghcr_image_prefix" {
  value = var.ghcr_image_prefix
}

output "ghcr_token" {
  value     = var.ghcr_token
  sensitive = true
}

output "api_app_name" {
  value = azurerm_container_app.api.name
}

output "worker_app_name" {
  value = azurerm_container_app.worker.name
}

# Public keys (not secret) — read by infra/deploy.sh so they only need to
# live in terraform.tfvars, not also duplicated into shell env vars.
output "stripe_publishable_key" {
  value = var.stripe_publishable_key
}

output "paypal_client_id" {
  value = var.paypal_client_id
}

output "mongodb_uri" {
  value     = local.mongodb_uri
  sensitive = true
}

output "rabbitmq_url" {
  value     = cloudamqp_instance.main.url
  sensitive = true
}

output "project_name" {
  value = var.project
}

output "web_origin" {
  value = var.web_origin
}
