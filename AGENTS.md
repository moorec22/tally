# AGENTS.md

## Project Overview

Tally is a simple inventory management app built as a static Next.js site with a
Cloudflare Worker API and Cloudflare D1 persistence.

Keep the product practical and easy to maintain: focused React components,
straightforward Worker handlers, explicit D1 queries, and focused tests.

## Development Guidelines

- Use `mise` for project tooling so commands run with the versions defined in
  `mise.toml`.
- Use Vitest for frontend and Worker tests.
- Keep inventory workflows explicit and understandable.
- Route JSON API handlers under the `/api/v1/` path prefix.
- The frontend is a static Next.js app written in TypeScript.
- Use Material UI for frontend components, layout primitives, icons, and theming
  before adding custom UI patterns.
- Keep React components practical and small. Avoid introducing global
  client-side state or routing until the product needs it.
- Decompose frontend UI into focused React components. Keep page-level
  components responsible for data loading and orchestration.
- The browser must never connect directly to D1 or contain Cloudflare API
  credentials.
- Put all database access behind the Cloudflare Worker D1 binding.
- Validate all Worker inputs server-side even when the frontend already
  validates them for UX.

## Product Direction

The application is intended to be a small inventory tool, not a complex ERP
system. Build toward core inventory tasks first:

- Managing inventory items
- Tracking stock counts
- Recording basic stock adjustments
- Organizing items by location or category when useful
- Keeping interfaces simple enough for repeated daily use

## Verification

When changing TypeScript, React, Next.js, Cloudflare Worker, or D1 code, run:

```sh
mise exec -- yarn typecheck
mise exec -- yarn test
```

When changing frontend build configuration, Worker static asset handling, or
deployment configuration, also verify the production static export:

```sh
mise exec -- yarn build
```
