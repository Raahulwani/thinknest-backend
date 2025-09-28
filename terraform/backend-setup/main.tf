terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.117"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = "9eca68f5-f843-4354-ae4a-09f793e81955"
}

# Get existing resource group
data "azurerm_resource_group" "rg" {
  name = "thinknest-rg"
}

# Create storage account for Terraform state
resource "azurerm_storage_account" "tfstate" {
  name                     = "thinkneststorage"
  resource_group_name      = data.azurerm_resource_group.rg.name
  location                 = data.azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  # Allow public access for simplicity (in production, use private endpoints)
  allow_nested_items_to_be_public = false
}

# Create container for Terraform state
resource "azurerm_storage_container" "tfstate" {
  name                  = "tfstate"
  storage_account_name  = azurerm_storage_account.tfstate.name
  container_access_type = "private"
}

