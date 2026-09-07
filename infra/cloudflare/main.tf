locals {
  access_policies = [
    {
      id         = cloudflare_zero_trust_access_policy.tally_allowed_users.id
      precedence = 1
    }
  ]
}

resource "cloudflare_zone" "provider" {
  account = {
    id = var.cloudflare_account_id
  }
  name = var.zone_name
  type = "full"
}

resource "cloudflare_dns_record" "worker_fallback_origin" {
  zone_id = cloudflare_zone.provider.id
  name    = var.provider_hostname
  type    = "AAAA"
  content = "100::"
  proxied = true
  ttl     = 1
}

resource "cloudflare_workers_route" "saas_hostnames" {
  zone_id = cloudflare_zone.provider.id
  pattern = "*/*"
  script  = var.worker_script_name
}

resource "cloudflare_custom_hostname_fallback_origin" "worker" {
  zone_id = cloudflare_zone.provider.id
  origin  = var.provider_hostname
}

resource "cloudflare_custom_hostname" "tally_showerproject" {
  zone_id  = cloudflare_zone.provider.id
  hostname = var.customer_hostname

  ssl = {
    bundle_method       = "ubiquitous"
    cloudflare_branding = false
    method              = "txt"
    settings = {
      http2           = "on"
      min_tls_version = "1.2"
      tls_1_3         = "on"
    }
    type     = "dv"
    wildcard = false
  }

  depends_on = [
    cloudflare_custom_hostname_fallback_origin.worker,
    cloudflare_workers_route.saas_hostnames,
  ]
}

data "cloudflare_custom_hostname" "tally_showerproject" {
  zone_id            = cloudflare_zone.provider.id
  custom_hostname_id = cloudflare_custom_hostname.tally_showerproject.id
}

resource "cloudflare_zero_trust_access_policy" "tally_allowed_users" {
  account_id = var.cloudflare_account_id
  name       = "Tally allowed users"
  decision   = "allow"

  include = [
    for email in sort(tolist(var.access_allowed_emails)) : {
      email = {
        email = email
      }
    }
  ]
}

resource "cloudflare_zero_trust_access_application" "provider_hostname" {
  account_id       = var.cloudflare_account_id
  name             = "Tally provider hostname"
  domain           = var.provider_hostname
  type             = "self_hosted"
  session_duration = var.access_session_duration
  policies         = local.access_policies
}

resource "cloudflare_zero_trust_access_application" "customer_hostname" {
  account_id       = var.cloudflare_account_id
  name             = "Tally Shower Project"
  domain           = var.customer_hostname
  type             = "self_hosted"
  session_duration = var.access_session_duration
  policies         = local.access_policies
}
