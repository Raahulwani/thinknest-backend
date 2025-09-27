terraform {
  backend "azurerm" {
    resource_group_name  = "thinknest-rg"
    storage_account_name = "thinkneststorage"
    container_name       = "tfstate"
    key                  = "terraform.tfstate"
  }
}