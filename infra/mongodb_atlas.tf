# MongoDB Atlas M0 — genuinely free forever, no credit card, real MongoDB
# (not a compatibility layer). Chosen over Azure Cosmos DB for MongoDB
# vCore's own free tier specifically to avoid that tier's undocumented,
# region-gated availability (Azure exposes no read-only way to check which
# regions support it — confirmed via `az cosmosdb mongocluster` having no
# list-skus command, and the ARM provider's operations metadata having
# nothing SKU-related either).
#
# backing_provider_name is AWS, not Azure, on purpose: M0 on Azure as the
# backing cloud has a history of provider-level friction (see
# https://github.com/mongodb/terraform-provider-mongodbatlas/issues/675).
# This doesn't matter functionally — Atlas is a cross-cloud SaaS regardless,
# same as CloudAMQP already being AWS-hosted while the app itself runs on
# Azure Container Apps.
resource "mongodbatlas_project" "main" {
  name   = var.project
  org_id = var.mongodbatlas_org_id
}

resource "mongodbatlas_project_ip_access_list" "allow_all" {
  project_id = mongodbatlas_project.main.id
  cidr_block = "0.0.0.0/0"
  comment    = "Azure Container Apps has no fixed outbound IP to scope this tighter."
}

resource "random_password" "mongo_app_user" {
  length      = 24
  special     = false # some symbols break unescaped in connection-string passwords
  min_upper   = 1
  min_lower   = 1
  min_numeric = 1
}

resource "mongodbatlas_database_user" "app" {
  project_id         = mongodbatlas_project.main.id
  username           = "yakkyofyapp"
  password           = random_password.mongo_app_user.result
  auth_database_name = "admin"

  roles {
    role_name     = "readWrite"
    database_name = "yakkyofy"
  }
}

resource "mongodbatlas_advanced_cluster" "main" {
  project_id   = mongodbatlas_project.main.id
  name         = "yakkyofy-demo"
  cluster_type = "REPLICASET"

  replication_specs = [
    {
      region_configs = [
        {
          electable_specs = {
            instance_size = "M0"
          }
          provider_name         = "TENANT"
          backing_provider_name = "AWS"
          region_name           = var.mongodbatlas_region
          priority              = 7
        }
      ]
    }
  ]
}

locals {
  # standard_srv comes back as just "mongodb+srv://host" — no trailing
  # slash, no query string, no credentials. An earlier regex-splice approach
  # (matching a literal "/" before "?" or end-of-string) silently no-op'd
  # against this exact shape: with no "/" anywhere to anchor on, replace()
  # left the string untouched, so the driver fell back to Mongoose/MongoDB's
  # default "test" database — which the app user has no permissions on.
  # Splitting and rebuilding explicitly instead of pattern-matching avoids
  # depending on a query-string shape that may or may not be present.
  mongo_srv_no_scheme = replace(mongodbatlas_advanced_cluster.main.connection_strings.standard_srv, "mongodb+srv://", "")
  mongo_srv_parts     = split("?", local.mongo_srv_no_scheme)
  mongo_srv_host      = trimsuffix(local.mongo_srv_parts[0], "/")
  mongo_srv_query     = length(local.mongo_srv_parts) > 1 ? "?${local.mongo_srv_parts[1]}" : ""
  mongodb_uri         = "mongodb+srv://${mongodbatlas_database_user.app.username}:${random_password.mongo_app_user.result}@${local.mongo_srv_host}/yakkyofy${local.mongo_srv_query}"
}
