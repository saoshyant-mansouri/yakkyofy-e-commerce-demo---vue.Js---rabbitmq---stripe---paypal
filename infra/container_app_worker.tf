# No ingress — this only ever consumes from RabbitMQ, nothing calls it over
# HTTP. min_replicas = 0 plus the RabbitMQ scale rules below means it costs
# ~$0 except for the brief moments it's actually settling an order.
resource "azurerm_container_app" "worker" {
  name                         = "ca-${var.project}-worker"
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

  template {
    min_replicas = 0
    max_replicas = 1

    container {
      name   = "worker"
      image  = local.placeholder_image
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name        = "MONGODB_URI"
        secret_name = "mongodb-uri"
      }
      env {
        name        = "RABBITMQ_URL"
        secret_name = "rabbitmq-url"
      }
    }

    # Two rules — one per queue the worker consumes from (apps/worker/src/index.js).
    # Container Apps scales up if *either* indicates a message waiting.
    custom_scale_rule {
      name             = "order-process-queue"
      custom_rule_type = "rabbitmq"
      metadata = {
        queueName = "order.process"
        mode      = "QueueLength"
        value     = "1"
      }
      authentication {
        secret_name       = "rabbitmq-url"
        trigger_parameter = "connection"
      }
    }

    custom_scale_rule {
      name             = "order-fulfill-queue"
      custom_rule_type = "rabbitmq"
      metadata = {
        queueName = "order.fulfill"
        mode      = "QueueLength"
        value     = "1"
      }
      authentication {
        secret_name       = "rabbitmq-url"
        trigger_parameter = "connection"
      }
    }
  }

  # See container_app_api.tf — deploy.sh manages the real image out-of-band.
  lifecycle {
    ignore_changes = [template[0].container[0].image]
  }
}
