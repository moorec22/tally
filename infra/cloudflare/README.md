# Cloudflare Infrastructure

This directory manages the Cloudflare resources that route Tally from
`tally.showerproject.org` to the existing `tally` Worker through Cloudflare for
SaaS.

Wrangler remains the source of truth for the Worker script, static assets, D1
migrations, local development, and Worker secrets. Terraform owns the provider
zone, DNS record, Worker routes, Cloudflare for SaaS hostname, and Cloudflare
Access applications.

## Hostnames

| Purpose | Hostname |
| --- | --- |
| Provider zone | `connormo.org` |
| Provider target | `tally.connormo.org` |
| Customer hostname | `tally.showerproject.org` |
| Fallback Worker URL | `tally.moorec104.workers.dev` |

Traffic flow:

```text
Browser
  -> tally.showerproject.org
  -> Name.com CNAME
  -> tally.connormo.org
  -> Cloudflare for SaaS custom hostname
  -> Worker route in connormo.org zone
  -> tally Worker
```

## One-Time Bootstrap

1. Create the remote state bucket:

```bash
mise exec -- yarn wrangler r2 bucket create tally-terraform-state
```

2. Create R2 API credentials scoped to the `tally-terraform-state` bucket with
   Object Read & Write permission.

3. Set these GitHub environment or repository secrets:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Zone:Read, Zone:Edit, DNS:Edit, Workers Routes:Edit, Workers Scripts:Edit, Access: Apps and Policies:Edit, and SSL and Certificates:Edit permissions. |
| `CLOUDFLARE_ACCOUNT_ID` | `0bbf389854d5395f69c518b74e156f40` |
| `AWS_ACCESS_KEY_ID` | R2 Access Key ID for the state bucket. |
| `AWS_SECRET_ACCESS_KEY` | R2 Secret Access Key for the state bucket. |
| `TF_VAR_ACCESS_ALLOWED_EMAILS` | HCL list of allowed emails, for example `["connor@example.com"]`. |
| `CF_ACCESS_TEAM_DOMAIN` | Existing Cloudflare Access team domain, for example `team.cloudflareaccess.com`. |
| `CF_ACCESS_AUD_EXTRA` | Existing `workers.dev` Access audience, when keeping the old Access app active during rollout. |

4. Enable Cloudflare for SaaS for the `connormo.org` zone in the Cloudflare
   dashboard after Terraform creates the zone. Cloudflare documents Cloudflare
   for SaaS as bundled with non-Enterprise plans, but the zone-level feature must
   be enabled before custom hostnames can be created.

5. Initialize Terraform locally when running it outside GitHub Actions. Export
   the R2 state credentials into the shell as `AWS_ACCESS_KEY_ID` and
   `AWS_SECRET_ACCESS_KEY` before running the command:

```bash
mise exec -- terraform -chdir=infra/cloudflare init \
  -backend-config='endpoints={s3="https://0bbf389854d5395f69c518b74e156f40.r2.cloudflarestorage.com"}'
```

6. Apply Terraform once to create the `connormo.org` Cloudflare zone. Export
   the Cloudflare token into the shell as `TF_VAR_cloudflare_api_token` before
   running the command:

```bash
TF_VAR_cloudflare_account_id=0bbf389854d5395f69c518b74e156f40 \
TF_VAR_access_allowed_emails='["connor@example.com"]' \
mise exec -- terraform -chdir=infra/cloudflare apply
```

7. Read the assigned nameservers:

```bash
mise exec -- terraform -chdir=infra/cloudflare output zone_nameservers
```

8. Update `connormo.org` at its current registrar or DNS authority to use the
   two Cloudflare nameservers from `zone_nameservers`.

9. Wait until Cloudflare marks `connormo.org` active.

10. At Name.com, create or update this DNS record for `showerproject.org`:

```text
Host: tally
Type: CNAME
Answer: tally.connormo.org
TTL: 300
```

11. If Terraform outputs TXT validation values in
    `custom_hostname_ownership_verification` or
    `custom_hostname_ssl_validation_records`, create those TXT records in
    Name.com for `showerproject.org`.

## Pull Request Checks

```bash
mise exec -- yarn typecheck
mise exec -- yarn test
mise exec -- yarn build
mise exec -- terraform -chdir=infra/cloudflare fmt -check
TF_VAR_cloudflare_api_token=dummy-token \
TF_VAR_cloudflare_account_id=0bbf389854d5395f69c518b74e156f40 \
TF_VAR_access_allowed_emails='["connor@example.com"]' \
mise exec -- terraform -chdir=infra/cloudflare validate
```

## Production Deploy

Merges to `main` run `.github/workflows/deploy.yml`.

The deploy job:

1. Installs mise tools.
2. Runs TypeScript, tests, and the static export build.
3. Initializes Terraform against the R2 backend.
4. Applies Terraform.
5. Reads `access_audiences_csv` from Terraform output.
6. Writes `CF_ACCESS_AUD` and `CF_ACCESS_TEAM_DOMAIN` to Worker secrets.
7. Applies D1 migrations.
8. Deploys the Worker and static assets with Wrangler.

## Validation

After Name.com DNS is updated and Cloudflare hostname validation is active:

```bash
dig +short tally.showerproject.org
curl -I https://tally.showerproject.org/
curl -I https://tally.connormo.org/
curl -I https://tally.moorec104.workers.dev/
```

Expected results:

- `dig` includes `tally.connormo.org`.
- `tally.showerproject.org` reaches Cloudflare Access or the Tally Worker.
- `tally.connormo.org` reaches Cloudflare Access or the Tally Worker.
- `tally.moorec104.workers.dev` remains available during rollout.
