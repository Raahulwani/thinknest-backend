terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
  subscription_id = "9eca68f5-f843-4354-ae4a-09f793e81955"
}

# Variables
variable "postgres_password" {
  description = "PostgreSQL admin password"
  type        = string
  sensitive   = true
}

# Create random suffix for unique names
resource "random_id" "suffix" {
  byte_length = 4
}

locals {
  name_rg   = "thinknest-rg-${random_id.suffix.hex}"
  name_plan = "thinknest-plan-${random_id.suffix.hex}"
  name_app  = "thinknest-app-${random_id.suffix.hex}"
  name_pg   = "thinknest-pg-${random_id.suffix.hex}"
}

resource "azurerm_resource_group" "rg" {
  name     = local.name_rg
  location = "centralus"
}

resource "azurerm_service_plan" "plan" {
  name                = local.name_plan
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  os_type             = "Linux"
  sku_name            = "F1"  # Free tier
}

resource "azurerm_linux_web_app" "app" {
  name                = local.name_app
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  service_plan_id     = azurerm_service_plan.plan.id

  site_config {
    always_on = false
    
    application_stack {
      # Use your Docker Hub image
      docker_image = "raahulwani/thinknest-app"
      docker_image_tag = "latest"
    }
  }

  app_settings = {
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
    # Add any other environment variables your app needs
    "DATABASE_URL" = "postgresql://pgadmin:${var.postgres_password}@${azurerm_postgresql_flexible_server.pg.fqdn}/postgres"
  }
}

resource "azurerm_postgresql_flexible_server" "pg" {
  name                   = local.name_pg
  resource_group_name    = azurerm_resource_group.rg.name
  location               = azurerm_resource_group.rg.location
  administrator_login    = "pgadmin"
  administrator_password = var.postgres_password
  version                = "13"
  storage_mb             = 32768
  sku_name               = "B_Standard_B1ms"  # Burstable tier
  zone                   = "1"
  public_network_access_enabled = true
}

# Outputs
output "resource_group_name" {
  value = azurerm_resource_group.rg.name
}

output "web_app_url" {
  value = azurerm_linux_web_app.app.default_hostname
}

output "postgres_fqdn" {
  value = azurerm_postgresql_flexible_server.pg.fqdn
}

output "web_app_name" {
  value = azurerm_linux_web_app.app.name
}

output "postgres_server_name" {
  value = azurerm_postgresql_flexible_server.pg.name
}