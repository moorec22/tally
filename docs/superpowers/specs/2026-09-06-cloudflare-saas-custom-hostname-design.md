# Cloudflare SaaS Custom Hostname Design

## Goal

Route `https://tally.showerproject.org/` to the Tally Cloudflare Worker without
moving `showerproject.org` away from Name.com DNS, while keeping Cloudflare
infrastructure configuration in this repository as code.

## Context

Tally is deployed as a Cloudflare Worker named `tally` with static assets served
from the Next.js `out/` directory and D1 bound as `DB`. The current public
fallback URL is `https://tally.moorec104.workers.dev/`.

The `showerproject.org` domain is not managed by the Cloudflare account that
owns the Worker. A direct CNAME from `tally.showerproject.org` to
`tally.moorec104.workers.dev` resolves to Cloudflare, but Cloudflare cannot
serve TLS for `tally.showerproject.org` until that hostname is explicitly
configured and validated in Cloudflare.

The user owns `connormo.org` outside Cloudflare and approved using it as the
Cloudflare-managed provider zone for the low-cost Cloudflare for SaaS path.
The registrar can remain outside Cloudflare; only authoritative DNS for
`connormo.org` needs to move to Cloudflare.

## Decision

Use Cloudflare for SaaS with `connormo.org` as the provider zone.

The target architecture is:

```text
Browser
  -> tally.showerproject.org
  -> Name.com CNAME
  -> customers.connormo.org
  -> Cloudflare for SaaS custom hostname
  -> Tally Worker
  -> D1 binding
```

`connormo.org` will be added to Cloudflare as a Free zone and activated by
changing its nameservers at the current registrar or DNS authority. After the
zone is active, repository-managed Terraform will configure the Cloudflare for
SaaS resources needed by Tally.

## Scope

The implementation will add repo-owned infrastructure code for Cloudflare
configuration around the existing Worker deployment. It will not move the
`showerproject.org` zone, and it will not require Business or Enterprise
partial/CNAME setup.

The implementation will keep `wrangler.toml` as the source of truth for Worker
code, static asset, D1 binding, and local development deployment behavior. It
will add Terraform for account/zone resources that Wrangler does not manage
well as repeatable infrastructure:

- `connormo.org` zone creation and output of the assigned Cloudflare
  nameservers.
- DNS record for the Cloudflare for SaaS provider target, using
  `customers.connormo.org`.
- Cloudflare for SaaS custom hostname for `tally.showerproject.org`.
- Cloudflare Access application configuration for `tally.showerproject.org`
  with the same allowed-user intent as the current Tally Access protection.
- Outputs or documentation for the exact Name.com DNS records required.

The implementation will not manage Name.com DNS automatically unless Name.com
automation is added in a separate task. The operator will add or update the
external CNAME in Name.com:

```text
tally.showerproject.org CNAME customers.connormo.org
```

If Cloudflare returns TXT validation requirements for the custom hostname, the
operator will also add the generated TXT records at Name.com.

## Infrastructure As Code

Terraform will live under `infra/cloudflare/` and be designed for GitHub
Actions. Pull requests should run `terraform fmt` and `terraform validate`.
Merges to `main` should apply Terraform before the existing Worker deploy.

Terraform state must use a remote backend for repeatable CI. The backend will
be a bootstrapped Cloudflare R2 bucket named `tally-terraform-state`, configured
before the Terraform root module is applied. The backend setup and required
GitHub secrets will be documented in `infra/cloudflare/README.md`.

Cloudflare credentials for Terraform and Wrangler will come from GitHub
environment or repository secrets. No API tokens, Access secrets, or registrar
credentials will be committed.

## Deployment Flow

Initial one-time manual prerequisites:

1. Create the `tally-terraform-state` R2 bucket and R2 API credentials for the
   Terraform backend.
2. Run Terraform once to create the `connormo.org` Cloudflare zone and print
   the assigned nameservers.
3. Update `connormo.org` nameservers at the current DNS authority to the
   assigned Cloudflare nameservers.
4. Wait for `connormo.org` to become active in Cloudflare.
5. Ensure GitHub Actions has the required Cloudflare token, R2 backend, and
   variables.

Normal merge-to-main flow:

1. GitHub Actions installs project tooling.
2. GitHub Actions runs TypeScript checks and tests.
3. GitHub Actions builds the static Next.js export.
4. GitHub Actions runs Terraform to apply Cloudflare configuration.
5. GitHub Actions applies D1 migrations.
6. GitHub Actions deploys the Worker and static assets with Wrangler.

## Validation

The implementation is acceptable when:

- `connormo.org` is active in Cloudflare.
- Terraform validation passes in CI.
- Terraform apply can create or reconcile the Cloudflare for SaaS custom
  hostname configuration.
- Name.com DNS for `tally.showerproject.org` points to
  `customers.connormo.org`.
- Cloudflare reports the custom hostname and SSL status as active.
- `curl -I https://tally.showerproject.org/` reaches Cloudflare Access or the
  Tally Worker instead of failing the TLS handshake.
- The existing fallback URL `https://tally.moorec104.workers.dev/` remains
  available until a separate approved change removes it.

## Risks And Constraints

Cloudflare for SaaS can validate hostnames only after the customer hostname has
the required DNS records. If automatic HTTP validation is used, there may be a
short activation window after the Name.com CNAME is changed. TXT validation can
reduce cutover risk when Cloudflare provides a TXT validation value.

Cloudflare Access may need to be updated for `tally.showerproject.org`. The
Worker verifies `CF_ACCESS_AUD`, so the implementation will allow that secret
to contain a comma-separated list of accepted audience values. This keeps the
existing `workers.dev` Access application and the new `tally.showerproject.org`
Access application usable during rollout.

Terraform must not manage the same Worker deployment artifact that Wrangler
manages. Terraform owns Cloudflare infrastructure resources; Wrangler owns the
Worker script, static assets, D1 migrations, and local development workflow.

## Alternatives Rejected

Direct CNAME from `tally.showerproject.org` to `tally.moorec104.workers.dev` was
rejected because it does not create a Cloudflare hostname binding or TLS
certificate for `tally.showerproject.org`.

Cloudflare partial/CNAME setup for `showerproject.org` was rejected because it
keeps Name.com authoritative but requires Cloudflare Business or Enterprise.

Delegating `tally.showerproject.org` as a standalone Cloudflare child zone was
rejected because Cloudflare documents subdomain setup as Enterprise-only.

Moving `showerproject.org` nameservers to Cloudflare was rejected because the
domain must remain under Name.com DNS control.
