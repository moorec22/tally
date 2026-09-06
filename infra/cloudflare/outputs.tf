output "zone_nameservers" {
  description = "Authoritative Cloudflare nameservers to set for connormo.org at the current registrar."
  value       = cloudflare_zone.provider.name_servers
}

output "name_com_cname_name" {
  description = "External DNS record name to create at Name.com for showerproject.org."
  value       = "tally"
}

output "name_com_cname_target" {
  description = "External DNS record target to create at Name.com for tally.showerproject.org."
  value       = var.provider_hostname
}

output "custom_hostname_ownership_verification" {
  description = "TXT ownership verification record for tally.showerproject.org when Cloudflare returns one."
  value       = cloudflare_custom_hostname.tally_showerproject.ownership_verification
}

output "custom_hostname_ssl_validation_records" {
  description = "Certificate validation records for tally.showerproject.org."
  value       = data.cloudflare_custom_hostname.tally_showerproject.ssl.validation_records
}

output "provider_access_aud" {
  description = "Cloudflare Access audience for tally.connormo.org."
  value       = cloudflare_zero_trust_access_application.provider_hostname.aud
}

output "customer_access_aud" {
  description = "Cloudflare Access audience for tally.showerproject.org."
  value       = cloudflare_zero_trust_access_application.customer_hostname.aud
}

output "access_audiences_csv" {
  description = "Comma-separated Cloudflare Access audiences for the Worker CF_ACCESS_AUD secret."
  value = join(",", [
    cloudflare_zero_trust_access_application.provider_hostname.aud,
    cloudflare_zero_trust_access_application.customer_hostname.aud,
  ])
}
