variable "cloudflare_api_token" {
  description = "Cloudflare API token with permissions to manage zones, DNS, Workers routes, custom hostnames, and Access applications."
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID that owns the Tally Worker and the connormo.org zone."
  type        = string
}

variable "zone_name" {
  description = "Cloudflare for SaaS provider zone."
  type        = string
  default     = "connormo.org"
}

variable "provider_hostname" {
  description = "Provider-owned target hostname that external customer DNS records point at."
  type        = string
  default     = "tally.connormo.org"
}

variable "customer_hostname" {
  description = "Customer-owned hostname routed through Cloudflare for SaaS."
  type        = string
  default     = "tally.showerproject.org"
}

variable "worker_script_name" {
  description = "Name of the existing Cloudflare Worker script."
  type        = string
  default     = "tally"
}

variable "access_allowed_emails" {
  description = "Exact email addresses allowed to sign in through Cloudflare Access for Tally."
  type        = set(string)

  validation {
    condition     = length(var.access_allowed_emails) > 0
    error_message = "Set at least one allowed email address for Cloudflare Access."
  }
}

variable "access_session_duration" {
  description = "Cloudflare Access session duration for Tally applications."
  type        = string
  default     = "24h"
}
