# Cloudflare SaaS Custom Hostname Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route `https://tally.showerproject.org/` to the Tally Worker through Cloudflare for SaaS, using `tally.connormo.org` as the Cloudflare-managed provider target and keeping the configuration in this repository as code.

**Architecture:** Terraform under `infra/cloudflare/` owns the `connormo.org` Cloudflare zone, the originless fallback DNS record, Cloudflare for SaaS custom hostname, Worker routes, and Cloudflare Access applications. Wrangler remains responsible for the Worker script, static assets, D1 migrations, Worker secrets, and the `workers.dev` fallback route.

**Tech Stack:** Cloudflare Workers, Cloudflare for SaaS custom hostnames, Cloudflare DNS, Cloudflare Access, Cloudflare D1, Wrangler 4.x, Terraform 1.13.5, Cloudflare Terraform provider 5.24.x, GitHub Actions, mise, TypeScript, Vitest.

## Global Constraints

Read `docs/architecture.md` before changing D1 data model, Worker API contracts, frontend data flow, or folder structure. This plan changes Worker auth behavior and deployment configuration, so keep `docs/architecture.md` in mind and update it only if the app architecture changes beyond auth audience parsing.

Use `mise` for project tooling so commands run with the versions defined in `mise.toml`.

Use Vitest for frontend and Worker tests.

Keep JSON API handlers under the `/api/v1/` path prefix.

The browser must never connect directly to D1 or contain Cloudflare API credentials.

No API tokens, Access secrets, R2 credentials, registrar credentials, local Terraform variables, or Terraform state files may be committed.

Terraform owns Cloudflare account and zone infrastructure resources in this plan. Wrangler owns the Worker script, static assets, D1 migrations, Worker secrets, and local development workflow.

Keep `workers_dev = true` in `wrangler.toml` so `https://tally.moorec104.workers.dev/` remains available during rollout.

Do not add a direct Worker custom-domain route for `tally.showerproject.org`; that hostname is owned by the Cloudflare for SaaS custom hostname resource.

Use `tally.connormo.org` as the provider target and `tally.showerproject.org` as the customer hostname.

The one-time external DNS action at Name.com is `tally.showerproject.org CNAME tally.connormo.org`.

When changing TypeScript, React, Next.js, Cloudflare Worker, or D1 code, run `mise exec -- yarn typecheck` and `mise exec -- yarn test`.

When changing frontend build configuration, Worker static asset handling, or deployment configuration, also run `mise exec -- yarn build`.

---

## File Structure

- Modify `src/worker/auth.ts`: expose a small audience parsing helper and pass a string array to `jwtVerify` so one Worker can accept multiple Cloudflare Access applications during the migration.
- Modify `tests/worker/index.test.ts`: add focused tests for comma-separated Access audience parsing without introducing network-dependent JWT tests.
- Modify `mise.toml`: add Terraform to the repository-managed toolchain.
- Modify `.gitignore`: ignore local Terraform working directories, local variable files, logs, and state files while allowing example variable files to be committed.
- Create `infra/cloudflare/versions.tf`: declare Terraform, the Cloudflare provider, and the R2-backed S3 remote state backend.
- Create `infra/cloudflare/variables.tf`: define all Cloudflare, hostname, Worker, and Access inputs used by the infrastructure module.
- Create `infra/cloudflare/main.tf`: define the Cloudflare zone, originless fallback DNS record, Worker routes, Cloudflare for SaaS fallback origin, custom hostname, and Access applications.
- Create `infra/cloudflare/outputs.tf`: print assigned Cloudflare nameservers, external DNS records, hostname validation records, SSL validation records, and Access audience values.
- Create `infra/cloudflare/backend.hcl.example`: document the exact non-secret R2 backend settings that need secret values from CI or the shell.
- Create `infra/cloudflare/terraform.tfvars.example`: document non-secret defaults and the required allowed email list shape.
- Create `infra/cloudflare/README.md`: document bootstrap, GitHub secrets, manual DNS steps, Terraform commands, validation commands, and rollout order.
- Modify `.github/workflows/ci.yml`: use mise consistently and validate Terraform formatting/configuration on pull requests.
- Modify `.github/workflows/deploy.yml`: run Terraform after test/build, update Worker Access secrets from Terraform outputs and GitHub secrets, then apply D1 migrations and deploy the Worker.

## Task 1: Worker Auth Accepts Multiple Access Audiences

**Files:**
- Modify: `src/worker/auth.ts`
- Modify: `tests/worker/index.test.ts`

**Interfaces:**
- Consumes: existing `Env.CF_ACCESS_AUD?: string`
- Produces: `parseAccessAudiences(accessAud: string): string[]`
- Produces: `authenticateRequest(request: Request, env: Env): Promise<Account>` continues to return the authenticated account or throw a `Response`

- [ ] **Step 1: Read architecture and auth code**

Run:

```bash
sed -n '1,220p' docs/architecture.md
sed -n '1,220p' src/worker/auth.ts
sed -n '1,380p' tests/worker/index.test.ts
```

Expected: confirm the Worker is the only code path that talks to D1 and that `CF_ACCESS_AUD` is currently treated as a single string.

- [ ] **Step 2: Write failing audience parser tests**

In `tests/worker/index.test.ts`, change the imports at the top to:

```ts
import { describe, expect, it } from "vitest"

import { parseAccessAudiences } from "../../src/worker/auth"
import worker from "../../src/worker/index"
```

Add this block before `describe("worker API", () => {`:

```ts
describe("parseAccessAudiences", () => {
  it("parses a single Cloudflare Access audience", () => {
    expect(parseAccessAudiences("existing-workers-dev-aud")).toEqual([
      "existing-workers-dev-aud",
    ])
  })

  it("parses comma-separated Cloudflare Access audiences", () => {
    expect(
      parseAccessAudiences(
        "existing-workers-dev-aud, tally-connormo-aud, tally-showerproject-aud",
      ),
    ).toEqual([
      "existing-workers-dev-aud",
      "tally-connormo-aud",
      "tally-showerproject-aud",
    ])
  })

  it("ignores blank audience entries created by extra commas", () => {
    expect(parseAccessAudiences(" existing-workers-dev-aud, ,tally-aud, ")).toEqual([
      "existing-workers-dev-aud",
      "tally-aud",
    ])
  })
})
```

- [ ] **Step 3: Run focused test to verify it fails**

Run:

```bash
mise exec -- yarn vitest run --config vitest.config.ts tests/worker/index.test.ts
```

Expected: FAIL because `parseAccessAudiences` is not exported from `src/worker/auth.ts`.

- [ ] **Step 4: Implement audience parsing**

In `src/worker/auth.ts`, add this exported helper after `accessJwks`:

```ts
export function parseAccessAudiences(accessAud: string) {
  return accessAud
    .split(",")
    .map((audience) => audience.trim())
    .filter(Boolean)
}
```

Then change the existing configuration guard:

```ts
  if (!env.CF_ACCESS_AUD || !env.CF_ACCESS_TEAM_DOMAIN) {
    throw new Response("Cloudflare Access is not configured.", { status: 500 })
  }
```

to:

```ts
  const audiences = env.CF_ACCESS_AUD
    ? parseAccessAudiences(env.CF_ACCESS_AUD)
    : []

  if (audiences.length === 0 || !env.CF_ACCESS_TEAM_DOMAIN) {
    throw new Response("Cloudflare Access is not configured.", { status: 500 })
  }
```

Then change the `jwtVerify` call from:

```ts
      audience: env.CF_ACCESS_AUD,
```

to:

```ts
      audience: audiences,
```

- [ ] **Step 5: Run focused test to verify it passes**

Run:

```bash
mise exec -- yarn vitest run --config vitest.config.ts tests/worker/index.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run required TypeScript and test verification**

Run:

```bash
mise exec -- yarn typecheck
mise exec -- yarn test
```

Expected: both commands PASS.

- [ ] **Step 7: Commit Worker auth change**

Run:

```bash
git add src/worker/auth.ts tests/worker/index.test.ts
git commit -m "feat: accept multiple Cloudflare Access audiences"
```

Expected: commit succeeds with only the auth and test files included.

## Task 2: Terraform Cloudflare Infrastructure Module

**Files:**
- Modify: `mise.toml`
- Modify: `.gitignore`
- Create: `infra/cloudflare/versions.tf`
- Create: `infra/cloudflare/variables.tf`
- Create: `infra/cloudflare/main.tf`
- Create: `infra/cloudflare/outputs.tf`
- Create: `infra/cloudflare/backend.hcl.example`
- Create: `infra/cloudflare/terraform.tfvars.example`

**Interfaces:**
- Consumes: Worker script name `tally`
- Consumes: provider zone name `connormo.org`
- Consumes: provider target hostname `tally.connormo.org`
- Consumes: customer hostname `tally.showerproject.org`
- Produces: Terraform output `zone_nameservers`
- Produces: Terraform output `name_com_cname_name`
- Produces: Terraform output `name_com_cname_target`
- Produces: Terraform output `custom_hostname_ownership_verification`
- Produces: Terraform output `custom_hostname_ssl_validation_records`
- Produces: Terraform output `access_audiences_csv`

- [ ] **Step 1: Add Terraform to mise**

Modify `mise.toml` to:

```toml
[tools]
node = "24"
terraform = "1.13.5"
yarn = "1.22.22"
```

- [ ] **Step 2: Ignore local Terraform files**

Append this block to `.gitignore`:

```gitignore

# Ignore local Terraform state, variables, and provider cache.
**/.terraform/
*.tfstate
*.tfstate.*
*.tfvars
!*.tfvars.example
crash.log
crash.*.log
```

- [ ] **Step 3: Create Terraform version and backend configuration**

Create `infra/cloudflare/versions.tf` with:

```hcl
terraform {
  required_version = ">= 1.13.5"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.24"
    }
  }

  backend "s3" {
    bucket                      = "tally-terraform-state"
    key                         = "cloudflare/production.tfstate"
    region                      = "auto"
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true
    use_lockfile                = true
    use_path_style              = true
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
```

- [ ] **Step 4: Create Terraform variables**

Create `infra/cloudflare/variables.tf` with:

```hcl
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
```

- [ ] **Step 5: Create Terraform resources**

Create `infra/cloudflare/main.tf` with:

```hcl
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

resource "cloudflare_workers_route" "provider_hostname" {
  zone_id = cloudflare_zone.provider.id
  pattern = "${var.provider_hostname}/*"
  script  = var.worker_script_name
}

resource "cloudflare_workers_route" "customer_hostname" {
  zone_id = cloudflare_zone.provider.id
  pattern = "${var.customer_hostname}/*"
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
    cloudflare_workers_route.customer_hostname,
  ]
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
```

- [ ] **Step 6: Create Terraform outputs**

Create `infra/cloudflare/outputs.tf` with:

```hcl
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
  value       = cloudflare_custom_hostname.tally_showerproject.ssl.validation_records
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
```

- [ ] **Step 7: Create backend example file**

Create `infra/cloudflare/backend.hcl.example` with:

```hcl
access_key = "set-with-AWS_ACCESS_KEY_ID-in-ci"
secret_key = "set-with-AWS_SECRET_ACCESS_KEY-in-ci"

endpoints = {
  s3 = "https://0bbf389854d5395f69c518b74e156f40.r2.cloudflarestorage.com"
}
```

- [ ] **Step 8: Create tfvars example file**

Create `infra/cloudflare/terraform.tfvars.example` with:

```hcl
cloudflare_account_id = "0bbf389854d5395f69c518b74e156f40"

access_allowed_emails = [
  "connor@example.com",
]
```

- [ ] **Step 9: Install tools and initialize Terraform locally**

Run:

```bash
mise install
mise exec -- yarn install --frozen-lockfile
```

Then initialize Terraform without committing credentials:

```bash
AWS_ACCESS_KEY_ID=not-used-for-validate \
AWS_SECRET_ACCESS_KEY=not-used-for-validate \
mise exec -- terraform -chdir=infra/cloudflare init \
  -backend=false
```

Expected: Terraform initializes providers into `infra/cloudflare/.terraform/`.

- [ ] **Step 10: Verify Terraform formatting**

Run:

```bash
mise exec -- terraform -chdir=infra/cloudflare fmt -check
```

Expected: PASS. If it prints file names, run `mise exec -- terraform -chdir=infra/cloudflare fmt` and repeat the check.

- [ ] **Step 11: Verify Terraform configuration**

Run:

```bash
TF_VAR_cloudflare_api_token=dummy-token \
TF_VAR_cloudflare_account_id=0bbf389854d5395f69c518b74e156f40 \
TF_VAR_access_allowed_emails='["connor@example.com"]' \
mise exec -- terraform -chdir=infra/cloudflare validate
```

Expected: PASS. If provider schema rejects any Zero Trust `include` or `policies` shape, run `mise exec -- terraform -chdir=infra/cloudflare providers schema -json > .context/cloudflare-provider-schema.json`, inspect only the relevant `cloudflare_zero_trust_access_policy` and `cloudflare_zero_trust_access_application` schemas, update the HCL to the provider-supported shape, then repeat `fmt -check` and `validate`.

- [ ] **Step 12: Commit Terraform module**

Run:

```bash
git add mise.toml .gitignore infra/cloudflare/versions.tf infra/cloudflare/variables.tf infra/cloudflare/main.tf infra/cloudflare/outputs.tf infra/cloudflare/backend.hcl.example infra/cloudflare/terraform.tfvars.example
git commit -m "feat: add Cloudflare SaaS Terraform config"
```

Expected: commit succeeds with only Terraform/tooling files included.

## Task 3: Infrastructure Documentation And GitHub Actions

**Files:**
- Create: `infra/cloudflare/README.md`
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: Terraform module and outputs from Task 2
- Consumes: GitHub secret `CLOUDFLARE_API_TOKEN`
- Consumes: GitHub secret `CLOUDFLARE_ACCOUNT_ID`
- Consumes: GitHub secret `AWS_ACCESS_KEY_ID`
- Consumes: GitHub secret `AWS_SECRET_ACCESS_KEY`
- Consumes: GitHub secret `TF_VAR_ACCESS_ALLOWED_EMAILS`
- Consumes: GitHub secret `CF_ACCESS_TEAM_DOMAIN`
- Consumes: optional GitHub secret `CF_ACCESS_AUD_EXTRA`
- Produces: CI Terraform `fmt` and `validate` checks
- Produces: production deploy flow that applies Terraform, updates Worker Access secrets, applies D1 migrations, and deploys the Worker

- [ ] **Step 1: Create Cloudflare infrastructure README**

Create `infra/cloudflare/README.md` with:

```markdown
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
```

- [ ] **Step 2: Update CI workflow to use mise and validate Terraform**

Replace `.github/workflows/ci.yml` with:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    env:
      NEXT_TELEMETRY_DISABLED: 1

    steps:
      - name: Checkout code
        uses: actions/checkout@v7

      - name: Set up mise
        uses: jdx/mise-action@v4.2.3
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Install JavaScript dependencies
        run: mise exec -- yarn install --frozen-lockfile

      - name: Typecheck
        run: mise exec -- yarn typecheck

      - name: Run tests
        run: mise exec -- yarn test

      - name: Restore Next.js build cache
        uses: actions/cache@v6
        with:
          path: .next/cache
          key: ${{ runner.os }}-nextjs-${{ hashFiles('yarn.lock') }}-${{ hashFiles('app/**/*', 'src/**/*', 'public/**/*', 'next.config.ts', 'tsconfig.json') }}
          restore-keys: |
            ${{ runner.os }}-nextjs-${{ hashFiles('yarn.lock') }}-
            ${{ runner.os }}-nextjs-

      - name: Prepare Next.js build cache directory
        run: mkdir -p .next/cache

      - name: Build static site
        run: mise exec -- yarn build

      - name: Initialize Terraform without backend
        run: mise exec -- terraform -chdir=infra/cloudflare init -backend=false

      - name: Check Terraform formatting
        run: mise exec -- terraform -chdir=infra/cloudflare fmt -check

      - name: Validate Terraform
        run: mise exec -- terraform -chdir=infra/cloudflare validate
        env:
          TF_VAR_cloudflare_api_token: dummy-token
          TF_VAR_cloudflare_account_id: 0bbf389854d5395f69c518b74e156f40
          TF_VAR_access_allowed_emails: '["connor@example.com"]'
```

- [ ] **Step 3: Update deploy workflow to apply Terraform and sync Worker secrets**

Replace `.github/workflows/deploy.yml` with:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [ main ]
  workflow_dispatch:

concurrency:
  group: cloudflare-production
  cancel-in-progress: false

permissions:
  contents: read

jobs:
  deploy:
    name: Deploy production
    runs-on: ubuntu-latest
    timeout-minutes: 30
    environment: production

    steps:
      - name: Checkout code
        uses: actions/checkout@v7

      - name: Set up mise
        uses: jdx/mise-action@v4.2.3
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Install JavaScript dependencies
        run: mise exec -- yarn install --frozen-lockfile

      - name: Typecheck
        run: mise exec -- yarn typecheck

      - name: Run tests
        run: mise exec -- yarn test

      - name: Build static site
        run: mise exec -- yarn build

      - name: Verify deployment credentials
        run: |
          if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
            echo "::error::Missing required GitHub secret: CLOUDFLARE_API_TOKEN"
            exit 1
          fi
          if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
            echo "::error::Missing required GitHub secret: CLOUDFLARE_ACCOUNT_ID"
            exit 1
          fi
          if [ -z "$AWS_ACCESS_KEY_ID" ]; then
            echo "::error::Missing required GitHub secret: AWS_ACCESS_KEY_ID"
            exit 1
          fi
          if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
            echo "::error::Missing required GitHub secret: AWS_SECRET_ACCESS_KEY"
            exit 1
          fi
          if [ -z "$TF_VAR_ACCESS_ALLOWED_EMAILS" ]; then
            echo "::error::Missing required GitHub secret: TF_VAR_ACCESS_ALLOWED_EMAILS"
            exit 1
          fi
          if [ -z "$CF_ACCESS_TEAM_DOMAIN" ]; then
            echo "::error::Missing required GitHub secret: CF_ACCESS_TEAM_DOMAIN"
            exit 1
          fi
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          CF_ACCESS_TEAM_DOMAIN: ${{ secrets.CF_ACCESS_TEAM_DOMAIN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          TF_VAR_ACCESS_ALLOWED_EMAILS: ${{ secrets.TF_VAR_ACCESS_ALLOWED_EMAILS }}

      - name: Initialize Terraform
        run: |
          mise exec -- terraform -chdir=infra/cloudflare init \
            -backend-config='endpoints={s3="https://${{ secrets.CLOUDFLARE_ACCOUNT_ID }}.r2.cloudflarestorage.com"}'
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

      - name: Apply Terraform
        run: mise exec -- terraform -chdir=infra/cloudflare apply -auto-approve
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          TF_VAR_cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          TF_VAR_cloudflare_account_id: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          TF_VAR_access_allowed_emails: ${{ secrets.TF_VAR_ACCESS_ALLOWED_EMAILS }}

      - name: Update Cloudflare Access Worker secrets
        run: |
          terraform_auds="$(mise exec -- terraform -chdir=infra/cloudflare output -raw access_audiences_csv)"
          if [ -n "$CF_ACCESS_AUD_EXTRA" ]; then
            cf_access_aud="${CF_ACCESS_AUD_EXTRA},${terraform_auds}"
          else
            cf_access_aud="${terraform_auds}"
          fi
          printf '%s' "$cf_access_aud" | mise exec -- yarn wrangler secret put CF_ACCESS_AUD
          printf '%s' "$CF_ACCESS_TEAM_DOMAIN" | mise exec -- yarn wrangler secret put CF_ACCESS_TEAM_DOMAIN
        env:
          CF_ACCESS_AUD_EXTRA: ${{ secrets.CF_ACCESS_AUD_EXTRA }}
          CF_ACCESS_TEAM_DOMAIN: ${{ secrets.CF_ACCESS_TEAM_DOMAIN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

      - name: Apply D1 migrations
        run: mise exec -- yarn wrangler d1 migrations apply tally --remote
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Deploy Worker and static assets
        run: mise exec -- yarn wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

- [ ] **Step 4: Verify YAML and Terraform syntax locally**

Run:

```bash
mise exec -- terraform -chdir=infra/cloudflare fmt -check
TF_VAR_cloudflare_api_token=dummy-token \
TF_VAR_cloudflare_account_id=0bbf389854d5395f69c518b74e156f40 \
TF_VAR_access_allowed_emails='["connor@example.com"]' \
mise exec -- terraform -chdir=infra/cloudflare validate
mise exec -- yarn typecheck
mise exec -- yarn test
mise exec -- yarn build
```

Expected: all commands PASS.

- [ ] **Step 5: Commit docs and workflow changes**

Run:

```bash
git add infra/cloudflare/README.md .github/workflows/ci.yml .github/workflows/deploy.yml
git commit -m "ci: apply Cloudflare infrastructure on deploy"
```

Expected: commit succeeds with only README and workflow files included.

## Task 4: Bootstrap And Live Cloudflare Deployment

**Files:**
- No repository files are modified in this task unless Terraform provider validation forces a schema fix in `infra/cloudflare/*.tf`.

**Interfaces:**
- Consumes: committed Terraform module from Task 2
- Consumes: committed GitHub Actions changes from Task 3
- Consumes: Cloudflare account ID `0bbf389854d5395f69c518b74e156f40`
- Consumes: external Name.com record `tally.showerproject.org CNAME tally.connormo.org`
- Produces: active `connormo.org` Cloudflare zone
- Produces: active Cloudflare for SaaS custom hostname for `tally.showerproject.org`
- Produces: reachable `https://tally.showerproject.org/`

- [ ] **Step 1: Check current branch and pending changes**

Run:

```bash
git status --short
git branch --show-current
```

Expected: branch is not renamed, and only planned changes are present.

- [ ] **Step 2: Create the R2 Terraform state bucket**

Run:

```bash
mise exec -- yarn wrangler r2 bucket create tally-terraform-state
```

Expected: Wrangler reports the bucket exists or was created. If it already exists, continue.

- [ ] **Step 3: Initialize Terraform against R2**

Run with R2 credentials exported in the shell:

```bash
mise exec -- terraform -chdir=infra/cloudflare init \
  -backend-config='endpoints={s3="https://0bbf389854d5395f69c518b74e156f40.r2.cloudflarestorage.com"}'
```

Expected: Terraform initializes with the S3 backend.

- [ ] **Step 4: Apply Terraform to create or reconcile Cloudflare resources**

Run with real Cloudflare token and allowed emails exported in the shell:

```bash
mise exec -- terraform -chdir=infra/cloudflare apply
```

Expected: Terraform creates the `connormo.org` zone if it does not exist, creates the `tally.connormo.org` originless DNS record, creates Worker routes, creates the fallback origin, creates Access applications, and attempts to create the `tally.showerproject.org` custom hostname.

- [ ] **Step 5: Set connormo.org nameservers outside Cloudflare**

Run:

```bash
mise exec -- terraform -chdir=infra/cloudflare output zone_nameservers
```

Expected: output prints two Cloudflare nameservers.

At the current registrar or DNS authority for `connormo.org`, replace the existing nameservers with the two nameservers printed by Terraform.

- [ ] **Step 6: Wait for connormo.org activation**

Run:

```bash
dig +short NS connormo.org
```

Expected: the result contains the two Cloudflare nameservers printed by Terraform. In Cloudflare dashboard, `connormo.org` is active.

- [ ] **Step 7: Re-run Terraform after zone activation**

Run:

```bash
mise exec -- terraform -chdir=infra/cloudflare apply
```

Expected: Terraform reconciles without zone-pending failures. If Cloudflare for SaaS must be enabled manually for the zone, enable it in the dashboard and re-run this command.

- [ ] **Step 8: Update the external showerproject.org CNAME**

At Name.com, set:

```text
Host: tally
Type: CNAME
Answer: tally.connormo.org
TTL: 300
```

Then run:

```bash
dig +short tally.showerproject.org
```

Expected: the result includes `tally.connormo.org`.

- [ ] **Step 9: Add external validation TXT records if Cloudflare requires them**

Run:

```bash
mise exec -- terraform -chdir=infra/cloudflare output custom_hostname_ownership_verification
mise exec -- terraform -chdir=infra/cloudflare output custom_hostname_ssl_validation_records
```

Expected: if Cloudflare prints non-empty TXT validation records, create those exact records in Name.com for `showerproject.org`, then re-run:

```bash
mise exec -- terraform -chdir=infra/cloudflare apply
```

- [ ] **Step 10: Update Worker Access secrets from Terraform outputs**

Run with `CF_ACCESS_TEAM_DOMAIN` set in the shell and `CF_ACCESS_AUD_EXTRA` set only if preserving the existing `workers.dev` Access audience:

```bash
terraform_auds="$(mise exec -- terraform -chdir=infra/cloudflare output -raw access_audiences_csv)"
if [ -n "$CF_ACCESS_AUD_EXTRA" ]; then
  cf_access_aud="${CF_ACCESS_AUD_EXTRA},${terraform_auds}"
else
  cf_access_aud="${terraform_auds}"
fi
printf '%s' "$cf_access_aud" | mise exec -- yarn wrangler secret put CF_ACCESS_AUD
printf '%s' "$CF_ACCESS_TEAM_DOMAIN" | mise exec -- yarn wrangler secret put CF_ACCESS_TEAM_DOMAIN
```

Expected: Wrangler reports both Worker secrets updated.

- [ ] **Step 11: Deploy the Worker with the current config**

Run:

```bash
mise exec -- yarn build
mise exec -- yarn wrangler d1 migrations apply tally --remote
mise exec -- yarn wrangler deploy
```

Expected: build passes, migrations apply, and Wrangler reports the Worker deployed with the `workers.dev` trigger retained.

- [ ] **Step 12: Verify live routes**

Run:

```bash
curl -I https://tally.connormo.org/
curl -I https://tally.showerproject.org/
curl -I https://tally.moorec104.workers.dev/
```

Expected: each hostname reaches Cloudflare Access or the Tally Worker. `https://tally.showerproject.org/` no longer fails during TLS handshake.

- [ ] **Step 13: Commit any schema corrections discovered during live apply**

If Task 4 required changes to `infra/cloudflare/*.tf`, run the full verification sequence:

```bash
mise exec -- terraform -chdir=infra/cloudflare fmt -check
TF_VAR_cloudflare_api_token=dummy-token \
TF_VAR_cloudflare_account_id=0bbf389854d5395f69c518b74e156f40 \
TF_VAR_access_allowed_emails='["connor@example.com"]' \
mise exec -- terraform -chdir=infra/cloudflare validate
mise exec -- yarn typecheck
mise exec -- yarn test
mise exec -- yarn build
```

Then commit:

```bash
git add infra/cloudflare
git commit -m "fix: align Cloudflare Terraform schema"
```

Expected: the commit contains only Terraform schema corrections required by the provider.

## Task 5: Final Verification And PR Notes

**Files:**
- No repository files are modified in this task unless validation reveals a defect.

**Interfaces:**
- Consumes: committed changes from Tasks 1 through 4
- Produces: final verification evidence and PR-ready summary

- [ ] **Step 1: Run full local verification**

Run:

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

Expected: all commands PASS.

- [ ] **Step 2: Inspect repository diff against main**

Run:

```bash
git diff --stat origin/main...
git diff --name-only origin/main...
```

Expected: changed files are limited to Worker auth/tests, Cloudflare Terraform files, workflow files, docs, `mise.toml`, `.gitignore`, and the previously accepted `wrangler.toml` `workers_dev = true` retention.

- [ ] **Step 3: Verify live DNS and TLS after external DNS has propagated**

Run:

```bash
dig +short tally.showerproject.org
curl -I https://tally.showerproject.org/
curl -I https://tally.connormo.org/
curl -I https://tally.moorec104.workers.dev/
```

Expected: `dig` includes `tally.connormo.org`, and all three HTTPS checks return Cloudflare Access or Tally responses instead of TLS handshake errors.

- [ ] **Step 4: Prepare PR summary**

Use this PR summary:

```markdown
## Summary

- add Terraform-managed Cloudflare for SaaS infrastructure for `tally.showerproject.org`
- route SaaS hostname traffic through `tally.connormo.org` to the existing `tally` Worker
- let the Worker accept comma-separated Cloudflare Access audiences during rollout
- add CI validation and production Terraform apply before Worker deployment

## Verification

- `mise exec -- yarn typecheck`
- `mise exec -- yarn test`
- `mise exec -- yarn build`
- `mise exec -- terraform -chdir=infra/cloudflare fmt -check`
- `terraform validate` with dummy Cloudflare inputs
- live `curl -I https://tally.showerproject.org/` after Name.com DNS and Cloudflare hostname validation

## Manual rollout notes

- create the `tally-terraform-state` R2 bucket and R2 state credentials
- activate `connormo.org` on Cloudflare nameservers
- enable Cloudflare for SaaS for `connormo.org`
- set `tally.showerproject.org CNAME tally.connormo.org` at Name.com
- add Cloudflare-provided TXT validation records at Name.com when Terraform outputs them
```

Expected: PR notes clearly separate repository changes from the required external DNS and Cloudflare activation actions.
