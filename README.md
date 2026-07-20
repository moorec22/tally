# Tally

Tally is a small inventory tracking app. It is built as a static Next.js site
with a Cloudflare Worker API and Cloudflare D1 for persistence.

## Architecture

The browser never connects to D1 directly. All database reads and writes go
through the Worker:

```text
Browser -> Cloudflare Access -> Worker API -> D1 binding
```

Cloudflare Access protects the app and API at the edge. The Worker also
validates the Access JWT before serving `/api/*`, so D1 is only reachable from
trusted server-side Worker code.

## Local Setup

Install tool versions:

```sh
mise install
```

Install JavaScript dependencies:

```sh
mise exec -- yarn install
```

Create a local D1 database and apply migrations:

```sh
mise exec -- yarn wrangler d1 create tally
mise exec -- yarn wrangler d1 migrations apply tally --local
```

For local development, create `.dev.vars` with a bypass email:

```sh
AUTH_BYPASS_EMAIL=owner@example.com
```

Build the static site and run the Worker locally:

```sh
mise exec -- yarn build
mise exec -- yarn dev
```

The app will be available from Wrangler's local URL, usually
<http://localhost:8787>.

For pure frontend iteration, run:

```sh
mise exec -- yarn next:dev
```

The API is not served by `next dev`; use `yarn dev` when testing D1-backed
behavior.

## Cloudflare Setup

1. Create a D1 database named `tally`.
2. Keep the `DB` binding name, `tally` database name, and `database_id` in
   `wrangler.toml` in sync with Cloudflare.
3. Apply the D1 migrations once during initial setup:

   ```sh
   mise exec -- yarn wrangler d1 migrations apply tally --remote
   ```

4. Create a Cloudflare Access self-hosted application for the production domain.
5. Restrict the Access policy to exact approved emails or a small Access group.
6. Set Worker secrets for the Access values:

   ```sh
   mise exec -- yarn wrangler secret put CF_ACCESS_TEAM_DOMAIN
   mise exec -- yarn wrangler secret put CF_ACCESS_AUD
   ```

   `CF_ACCESS_TEAM_DOMAIN` is the Access team domain, such as
   `team-name.cloudflareaccess.com`. `CF_ACCESS_AUD` is the Access application
   audience tag.

7. Do not put Cloudflare API tokens, D1 REST credentials, or database secrets in
   frontend code.

Deploy:

```sh
mise exec -- yarn build
mise exec -- yarn deploy
```

## GitHub Actions Deployment

Pushes to the `main` branch deploy to Cloudflare through
`.github/workflows/deploy.yml`. The workflow typechecks, runs tests, builds the
static Next.js export, applies any unapplied remote D1 migrations, then runs
`wrangler deploy` to publish the Worker and `out/` static assets.

Before the workflow can deploy, configure a GitHub `production` environment or
repository secrets with:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Create the Cloudflare API token from the `Edit Cloudflare Workers` template,
add D1 edit permission if the template does not include it, and scope it to only
the Cloudflare account and zone used by Tally.

## Data Migration From Rails

Export the Rails/Postgres data to SQL or CSV with preserved `id`, `created_at`,
and `updated_at` values for:

- `items`
- `inventory_snapshots`

Load the data into D1 after applying `migrations/0001_initial.sql`. Preserve
item IDs so existing `/items/:id` URLs continue to work.

The old Rails `users` and `sessions` tables are not migrated. Authentication is
handled by Cloudflare Access.

## Development

Run checks:

```sh
mise exec -- yarn typecheck
mise exec -- yarn test
mise exec -- yarn build
```

The public API remains:

- `GET /api/v1/session`
- `GET /api/v1/items`
- `GET /api/v1/items/:id`
- `POST /api/v1/items`
- `PATCH /api/v1/items/:id`
- `POST /api/v1/inventory_snapshots/bulk`
