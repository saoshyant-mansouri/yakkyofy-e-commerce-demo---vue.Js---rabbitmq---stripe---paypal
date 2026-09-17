terraform {
  required_version = ">= 1.9.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 5.4"
    }
    cloudamqp = {
      source  = "cloudamqp/cloudamqp"
      version = "~> 1.48"
    }
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "~> 2.17"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.9"
    }
  }

  # Local state on purpose — this is a solo demo project, not a team one.
  # A remote backend (azurerm storage) is the natural upgrade if that changes,
  # but it adds a bootstrap step (need a storage account to store state,
  # before Terraform can create one) that isn't worth it here.
}

provider "azurerm" {
  features {}
}

# Free CloudAMQP account API key — see infra/README.md for where to get one.
provider "cloudamqp" {
  apikey = var.cloudamqp_customer_api_key
}

# Free MongoDB Atlas account API key — see infra/README.md for where to get one.
provider "mongodbatlas" {
  public_key  = var.mongodbatlas_public_key
  private_key = var.mongodbatlas_private_key
}
