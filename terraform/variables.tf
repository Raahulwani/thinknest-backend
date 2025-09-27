variable "location" {
  type    = string
  default = "centralus"
}

variable "resource_prefix" {
  type    = string
  default = "thinknest"
}

variable "docker_image_name" {
  type    = string
  default = "raahulwani/thinknest-app"
}

variable "docker_image_tag" {
  type    = string
  default = "latest"
}

variable "postgres_admin_username" {
  type    = string
  default = "pgadmin"
}

variable "postgres_password" {
  description = "PostgreSQL admin password (do not commit in code; pass via TF_VAR or CI secrets)"
  type        = string
  sensitive   = true
}

variable "postgres_server_name" {
  description = "Name of an existing PostgreSQL Flexible Server to use"
  type        = string
  default     = "thinknest-pg-knrf"
}

variable "app_service_location" {
  description = "Azure region to create the App Service Plan/Web App in"
  type        = string
  default     = "eastus"
}

variable "subscription_id" {
  type        = string
  default     = ""
  description = "Optionally set subscription id via var or env; prefer not to hardcode"
}
