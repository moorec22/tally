# AGENTS.md

## Project Overview

Tally is a simple Rails web application for inventory management. The app should help users track items, quantities, and changes to stock in a clear, low-friction workflow.

Prefer straightforward Rails conventions over custom architecture. Keep the product practical and easy to maintain: simple models, readable controllers, focused React components, and focused tests.

## Development Guidelines

- Use RSpec for tests. Do not add new Minitest files.
- Keep inventory workflows explicit and understandable.
- Rails controllers always return JSON and never render HTML. The React frontend is responsible for all UI decisions and rendering.
- Route JSON controllers under the `/api/v1/` path prefix.
- The frontend is a Vite-powered React app written in TypeScript.
- Use Material UI for frontend components, layout primitives, icons, and theming before adding custom UI patterns.
- Keep React components practical and small. Avoid introducing global client-side state or routing until the product needs it.
- Decompose frontend UI into focused React components. Keep page-level components responsible for data loading and orchestration, and move reusable layout, status, and domain display pieces into named components.
- Preserve Rails defaults where they fit the application.
- Avoid broad refactors while implementing small product features.

## Presenter Model Protocol

Use the presenter pattern for all JSON data that a controller returns. Presenters can translate multiple models into frontend-ready payloads. Use the following guidelines:

- Store presenters in `app/presenters` and name them after the model or screen they present, such as `InventoryItemPresenter`.
- Keep presenters as plain Ruby objects initialized with the record or records they present.
- Instantiate presenters explicitly in controllers when a JSON response depends on them, using clear variable names like `inventory_item_presenter`.
- Put formatting, labels, badges, derived display text, and other view-specific presentation decisions in presenters when the logic is more than a tiny one-off helper.
- Keep simple Rails helpers for small, broadly reusable formatting methods.
- Avoid querying the database from presenter methods. Load needed associations in the controller or calling scope.
- Add focused RSpec coverage in `spec/presenters` for presenter behavior that contains conditionals, formatting rules, or display policy.

## Product Direction

The application is intended to be a small inventory tool, not a complex ERP system. Build toward core inventory tasks first:

- Managing inventory items
- Tracking stock counts
- Recording basic stock adjustments
- Organizing items by location or category when useful
- Keeping interfaces simple enough for repeated daily use

## Verification

When changing Rails behavior, add or update focused RSpec coverage and run:

```sh
bundle exec rspec
```

When changing frontend TypeScript, React, Vite, or Material UI code, also run:

```sh
yarn typecheck
```

When changing frontend build configuration or asset integration, verify the production asset build:

```sh
RAILS_ENV=production SECRET_KEY_BASE_DUMMY=1 bin/rails assets:precompile
```
