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
# Resource Group
# -------------------------------
resource "azurerm_resource_group" "rg" {
  name     = "${var.resource_prefix}-rg"
  location = var.location
}

# -------------------------------
# App Service Plan
# -------------------------------
resource "azurerm_service_plan" "asp" {
  name                = "${var.resource_prefix}-plan"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  os_type             = "Linux"
  sku_name            = "F1"
}

# -------------------------------
# Web App
# -------------------------------
resource "azurerm_linux_web_app" "app" {
  name                = "${var.resource_prefix}-app"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  service_plan_id     = azurerm_service_plan.asp.id

  site_config {
    always_on = false
    application_stack {
      docker_image     = var.docker_image_name
      docker_image_tag = var.docker_image_tag
    }
  }

  app_settings = {
    DATABASE_URL = "postgres://${var.postgres_admin_username}:${var.postgres_password}@${azurerm_postgresql_flexible_server.db.fqdn}:5432/${var.resource_prefix}"
    WEBSITES_PORT = "3000"
  }
}

# -------------------------------
# PostgreSQL Flexible Server
# -------------------------------
resource "azurerm_postgresql_flexible_server" "db" {
  name                   = "${var.resource_prefix}-pg-${random_string.pg_suffix.result}"
  resource_group_name    = azurerm_resource_group.rg.name
  location               = azurerm_resource_group.rg.location
  administrator_login    = var.postgres_admin_username
  administrator_password = var.postgres_password
  version                = "14"
  sku_name               = "B_Standard_B1ms"

  storage_mb                  = 32768
  backup_retention_days        = 7
  geo_redundant_backup_enabled = false
}

# Create a default database matching the resource prefix
resource "azurerm_postgresql_flexible_server_database" "appdb" {
  name      = var.resource_prefix
  server_id = azurerm_postgresql_flexible_server.db.id
  collation = "en_US.utf8"
  charset   = "UTF8"
}

# Allow access from Azure services and App Service outbound IPs (simplified)
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure" {
  name             = "allow-azure"
  server_id        = azurerm_postgresql_flexible_server.db.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# -------------------------------
# Outputs
# -------------------------------
output "resource_group_name" {
  value = azurerm_resource_group.rg.name
}

output "webapp_url" {
  value = azurerm_linux_web_app.app.default_hostname
}

output "postgres_server" {
  value = azurerm_postgresql_flexible_server.db.fqdn
}
