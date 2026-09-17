# Points at a public placeholder image until infra/deploy.sh pushes the real
# one and runs `az containerapp update` — see infra/README.md. Terraform
# only needs *a* valid image to create the resource and hand out a FQDN.
locals {
  placeholder_image = "mcr.microsoft.com/k8se/quickstart:latest"
}

resource "azurerm_container_app" "api" {
  name                         = "ca-${var.project}-api"
  resource_group_name          = azurerm_resource_group.main.name
  container_app_environment_id = data.azurerm_container_app_environment.main.id
  revision_mode                = "Single"

  registry {
    server               = "ghcr.io"
    username             = var.ghcr_username
    password_secret_name = "ghcr-token"
  }

  secret {
    name  = "ghcr-token"
    value = var.ghcr_token
  }
  secret {
    name  = "mongodb-uri"
    value = local.mongodb_uri
  }
  secret {
    name  = "rabbitmq-url"
    value = cloudamqp_instance.main.url
  }
  secret {
    name  = "jwt-access-secret"
    value = var.jwt_access_secret
  }
  secret {
    name  = "jwt-refresh-secret"
    value = var.jwt_refresh_secret
  }
  secret {
    name  = "stripe-secret-key"
    value = var.stripe_secret_key
  }
  secret {
    name  = "stripe-webhook-secret"
    value = var.stripe_webhook_secret
  }
  secret {
    name  = "paypal-client-secret"
    value = var.paypal_client_secret
  }

  ingress {
    external_enabled = true
    target_port      = 4000
    transport        = "http"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    min_replicas = 0
    max_replicas = 1

    container {
      name   = "api"
      image  = local.placeholder_image
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "API_PORT"
        value = "4000"
      }
      env {
        name  = "WEB_ORIGIN"
        value = var.web_origin
      }
      env {
        name        = "MONGODB_URI"
        secret_name = "mongodb-uri"
      }
      env {
        name        = "RABBITMQ_URL"
        secret_name = "rabbitmq-url"
      }
      env {
        name        = "JWT_ACCESS_SECRET"
        secret_name = "jwt-access-secret"
      }
      env {
        name        = "JWT_REFRESH_SECRET"
        secret_name = "jwt-refresh-secret"
      }
      env {
        name        = "STRIPE_SECRET_KEY"
        secret_name = "stripe-secret-key"
      }
      env {
        name        = "STRIPE_WEBHOOK_SECRET"
        secret_name = "stripe-webhook-secret"
      }
      env {
        name  = "PAYPAL_CLIENT_ID"
        value = var.paypal_client_id
      }
      env {
        name        = "PAYPAL_CLIENT_SECRET"
        secret_name = "paypal-client-secret"
      }
      env {
        name  = "PAYPAL_ENV"
        value = var.paypal_env
      }
      env {
        name  = "FX_API_URL"
        value = var.fx_api_url
      }
    }
  }

  # deploy.sh manages the real image out-of-band via `az containerapp
  # update` — without this, any `terraform apply` after that would silently
  # revert production back to the placeholder image (confirmed the hard way:
  # a routine secret-value apply did exactly this).
  lifecycle {
    ignore_changes = [template[0].container[0].image]
  }
}
