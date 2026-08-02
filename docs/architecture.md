# Architecture

Tally is a small inventory tracking app built as a static Next.js frontend, a
Cloudflare Worker JSON API, and Cloudflare D1 persistence.

The browser never connects to D1 directly. Runtime access flows through the
Worker:

```text
Browser -> Cloudflare Access -> Worker API -> D1 binding
```

The Worker serves both `/api/*` JSON requests and the static frontend assets.
API routes live under `/api/v1/`, authenticate the Cloudflare Access identity,
validate mutation requests, and execute explicit D1 queries through the `DB`
binding.

## Folder Structure

The repo keeps application code under `src/`, framework entrypoints at the
root-level framework directories, and deployment/database configuration close to
the files that use it.

| Path | Purpose |
| --- | --- |
| `app/` | Next.js App Router entrypoints. These files mount the React app into the static export. |
| `docs/` | Human- and agent-facing architecture notes. Keep cross-cutting design context here instead of scattering it through implementation files. |
| `migrations/` | Cloudflare D1 schema migrations applied by Wrangler. |
| `public/` | Static assets and fallback error pages copied into the exported site. |
| `src/api/` | Frontend API helpers shared by screens and components. |
| `src/components/` | Reusable React UI components. Domain-specific inventory components live under `src/components/items/`. |
| `src/screens/` | Page-level React views responsible for data loading, orchestration, and composing smaller components. |
| `src/types/` | Shared TypeScript shapes for frontend data contracts. These should stay aligned with Worker API responses. |
| `src/utils/` | Small frontend utility functions that are not React components. |
| `src/worker/` | Cloudflare Worker entrypoint, API routing, authentication checks, input validation, and D1 queries. |
| `tests/frontend/` | Vitest tests for React components, screens, and frontend support utilities. |
| `tests/worker/` | Vitest tests for Worker API behavior. |
| `.github/workflows/` | CI and deployment automation. |
| `.storybook/` | Storybook configuration for isolated component development. |

Top-level configuration files define the toolchain and deployment behavior:

| File | Purpose |
| --- | --- |
| `mise.toml` | Pins project tooling used by local commands and agents. |
| `package.json` | JavaScript scripts and dependencies. |
| `next.config.ts` | Static Next.js export configuration. |
| `wrangler.toml` | Cloudflare Worker, D1 binding, and static asset deployment configuration. |
| `vitest.config.ts` | Vitest configuration for frontend and Worker tests. |

When adding code, prefer the narrowest existing home. Shared UI belongs in
`src/components/`, page orchestration belongs in `src/screens/`, API persistence
belongs in `src/worker/`, and database shape changes belong in `migrations/`.

## API Endpoints

The Worker owns the JSON API in [`src/worker/index.ts`](../src/worker/index.ts).
All product API routes use the `/api/v1/` prefix.

Shared API behavior:

- Every `/api/*` request is authenticated by `authenticateRequest`.
- Local development may bypass Cloudflare Access with `AUTH_BYPASS_EMAIL`.
- Production authentication requires a valid `Cf-Access-Jwt-Assertion` checked
  against `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD`.
- Mutation requests (`POST`, `PATCH`, `PUT`, and `DELETE`) must be same-origin,
  must send JSON, and must include `X-Requested-With: XMLHttpRequest`.
- JSON responses include `Cache-Control: no-store`.
- Unknown API routes return `404` with `{ "error": "Not found" }`.

Current endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/session` | Returns the authenticated account. |
| `GET` | `/api/v1/items` | Lists inventory items with each item's latest count. |
| `GET` | `/api/v1/items/:id` | Returns one inventory item with its latest count. |
| `POST` | `/api/v1/items` | Creates an inventory item. |
| `PATCH` | `/api/v1/items/:id` | Updates inventory item metadata. |
| `POST` | `/api/v1/inventory_snapshots/bulk` | Creates one or more stock count snapshots. |

### `GET /api/v1/session`

Returns the authenticated account identity used by the frontend session check.

Response:

```json
{
  "account": {
    "email_address": "owner@example.com"
  }
}
```

### `GET /api/v1/items`

Returns all inventory items ordered by `name ASC, id ASC`. Each item includes
the latest snapshot value when one exists.

Response shape:

```json
[
  {
    "id": 42,
    "name": "Printer Paper",
    "category": "Office",
    "unit": "reams",
    "preferred_source": null,
    "low": 5,
    "high": 30,
    "value": 20,
    "last_updated_at": "2026-01-02T00:00:00.000Z"
  }
]
```

### `GET /api/v1/items/:id`

Returns one inventory item using the same presentation shape as
`GET /api/v1/items`. Returns `404` when the item does not exist.

### `POST /api/v1/items`

Creates an item catalog record and returns the created item with status `201`.

Request:

```json
{
  "item": {
    "name": "Printer Paper",
    "category": "Office",
    "unit": "reams",
    "preferred_source": null,
    "low": 5,
    "high": 30
  }
}
```

Validation rules:

- `name` is required and must not be blank after trimming.
- `category`, `unit`, and `preferred_source` are optional text fields. Blank
  strings are stored as `NULL`.
- `low` and `high` are optional integers.

Validation failures return `422` with field-level errors:

```json
{
  "errors": {
    "name": ["can't be blank"]
  }
}
```

### `PATCH /api/v1/items/:id`

Updates item metadata and returns the updated item. This endpoint does not
change stock counts; stock counts are recorded through inventory snapshots.
Returns `404` when the item does not exist.

Request:

```json
{
  "item": {
    "category": "Office",
    "unit": "reams",
    "preferred_source": "Office supplier",
    "low": 5,
    "high": 30
  }
}
```

Validation rules match `POST /api/v1/items` for editable metadata fields.
`name` is not updated by this endpoint. Omitted text and threshold fields are
treated the same as blank values and are cleared to `NULL`.

### `POST /api/v1/inventory_snapshots/bulk`

Creates stock count snapshots in bulk and returns the created snapshots with
status `201`.

Request:

```json
{
  "inventory_snapshots": [
    {
      "item_id": 42,
      "value": 20,
      "note": "Main supply cabinet"
    }
  ]
}
```

Response:

```json
[
  {
    "id": 7,
    "item_id": 42,
    "value": 20,
    "note": "Main supply cabinet",
    "created_at": "2026-01-02T00:00:00.000Z",
    "updated_at": "2026-01-02T00:00:00.000Z"
  }
]
```

Validation rules:

- `inventory_snapshots` must be an array.
- Each `item_id` must be an integer and must reference an existing item.
- Each `value` must be a non-negative integer.
- `note` is optional, but must be a string when provided.
- An empty snapshot array is valid and returns an empty array with status `201`.

## D1 Data Model

The current D1 schema is defined in
[`migrations/0001_initial.sql`](../migrations/0001_initial.sql). It has two
domain tables: `items` and `inventory_snapshots`.

### `items`

`items` stores the inventory catalog. Each row represents a thing that can be
counted.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | Stable item identifier used by API responses and item detail URLs. |
| `name` | `TEXT NOT NULL` | Required display name. |
| `category` | `TEXT` | Optional grouping label for filtering and scanning inventory. |
| `unit` | `TEXT` | Optional count unit, such as `reams`, `boxes`, or `each`. |
| `preferred_source` | `TEXT` | Optional purchasing/source note. |
| `low` | `INTEGER` | Optional lower target threshold. |
| `high` | `INTEGER` | Optional upper target threshold. |
| `created_at` | `TEXT NOT NULL` | ISO timestamp set by the Worker. |
| `updated_at` | `TEXT NOT NULL` | ISO timestamp set by the Worker when item metadata changes. |

Important behavior:

- Creating an item requires a non-blank `name`.
- `category`, `unit`, and `preferred_source` are trimmed and stored as `NULL`
  when blank.
- `low` and `high` are nullable integers. The current schema does not enforce
  ordering between them.
- Updating an item changes metadata fields only. Stock counts are recorded as
  snapshots instead of mutating an item column.

### `inventory_snapshots`

`inventory_snapshots` stores counted stock values over time. Each row is a
point-in-time count for one item.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | Stable snapshot identifier. |
| `item_id` | `INTEGER NOT NULL` | References `items.id`. |
| `value` | `INTEGER NOT NULL CHECK (value >= 0)` | Counted stock value. |
| `note` | `TEXT` | Optional note captured with the count. |
| `created_at` | `TEXT NOT NULL` | ISO timestamp set by the Worker. |
| `updated_at` | `TEXT NOT NULL` | ISO timestamp set by the Worker. |

Important behavior:

- Snapshot values must be non-negative integers.
- Bulk snapshot creation verifies that every `item_id` references an existing
  item before inserting any rows.
- The latest snapshot for an item is selected by `created_at DESC, id DESC`.
  The `id` tie-breaker keeps latest-count selection deterministic when multiple
  snapshots share the same timestamp.
- The app currently treats snapshots as count history. There is no adjustment
  table or delta-based ledger yet.

### Relationships And Presentation

`inventory_snapshots.item_id` has a foreign key to `items.id`. Reads present an
inventory item with its latest count by left joining each item to the newest
snapshot:

```text
items.id -> inventory_snapshots.item_id
```

API item responses use the frontend `InventoryItem` shape:

| Field | Source |
| --- | --- |
| `id`, `name`, `category`, `unit`, `preferred_source`, `low`, `high` | `items` |
| `value` | latest `inventory_snapshots.value`, or `null` when never counted |
| `last_updated_at` | latest `inventory_snapshots.updated_at`, or `null` when never counted |

### Indexes

The schema defines two indexes:

| Index | Purpose |
| --- | --- |
| `index_items_on_name_and_id` on `(name, id)` | Supports stable item listing ordered by name and then id. |
| `index_inventory_snapshots_latest` on `(item_id, created_at DESC, id DESC)` | Supports efficient latest-snapshot lookup per item. |

### Migration Notes

- D1 migrations live in `migrations/` and should be applied through Wrangler.
- Preserve `items.id` when importing data from the older Rails/Postgres app so
  existing `/items/:id` URLs keep working.
- Do not add browser-side database access. New data model behavior should stay
  behind Worker handlers and D1 bindings.
