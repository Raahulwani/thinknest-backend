terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.117"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
  }
}

provider "azurerm" {
  features {}
}

# Random suffix to avoid name collisions with existing resources and zone immutability issues
resource "random_string" "pg_suffix" {
  length  = 4
  lower   = true
  upper   = false
  numeric = true
  special = false
}

# -------------------------------
# Existing Resource Group (data source)
# -------------------------------
data "azurerm_resource_group" "rg" {
  name = "${var.resource_prefix}-rg"
}

# -------------------------------
# App Service Plan (new, in a region with likely quota)
# -------------------------------
resource "azurerm_service_plan" "asp" {
  name                = "${var.resource_prefix}-plan"
  location            = var.app_service_location
  resource_group_name = data.azurerm_resource_group.rg.name
  os_type             = "Linux"
  sku_name            = "B1"
}

# -------------------------------
# Web App
# -------------------------------

resource "azurerm_linux_web_app" "app" {
  name                = "${var.resource_prefix}-app"
  location            = var.app_service_location
  resource_group_name = data.azurerm_resource_group.rg.name
  service_plan_id     = azurerm_service_plan.asp.id

  site_config {
    always_on = false
    application_stack {
      docker_image_name = "${var.docker_image_name}:${var.docker_image_tag}"
    }
  }

  app_settings = merge(local.app_settings_base, local.db_settings)
}

# -------------------------------
# PostgreSQL Flexible Server
# -------------------------------

data "azurerm_postgresql_flexible_server" "db" {
  count               = var.postgres_server_name != "" ? 1 : 0
  name                = var.postgres_server_name
  resource_group_name = data.azurerm_resource_group.rg.name
}

# Database lookup not supported as data source in provider; assuming exists

# Allow access from Azure services and App Service outbound IPs (simplified)
// Firewall left unmanaged to avoid drift

# -------------------------------
# Outputs
# -------------------------------
output "resource_group_name" {
  value = data.azurerm_resource_group.rg.name
}

output "webapp_url" {
  value = azurerm_linux_web_app.app.default_hostname
}

locals {
  db_fqdn        = var.postgres_server_name != "" ? data.azurerm_postgresql_flexible_server.db[0].fqdn : ""
  database_url   = local.db_fqdn != "" ? "postgres://${var.postgres_admin_username}:${var.postgres_password}@${local.db_fqdn}:5432/${var.resource_prefix}" : ""
  app_settings_base = {
    WEBSITES_PORT = "3000"
  }
  db_settings = local.database_url != "" ? { DATABASE_URL = local.database_url } : {}
}

output "postgres_server" {
  value = local.db_fqdn
}
