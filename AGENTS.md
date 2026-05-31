# AGENTS.md

## Project Overview

Tally is a simple Rails web application for inventory management. The app should help users track items, quantities, and changes to stock in a clear, low-friction workflow.

Prefer straightforward Rails conventions over custom architecture. Keep the product practical and easy to maintain: simple models, readable controllers, focused React components, and focused tests.

## Development Guidelines

- Use RSpec for tests. Do not add new Minitest files.
- Keep inventory workflows explicit and understandable.
- Rails serves the backend and root page; the frontend is a Vite-powered React app written in TypeScript.
- Use Material UI for frontend components, layout primitives, icons, and theming before adding custom UI patterns.
- Keep React components practical and small. Avoid introducing global client-side state or routing until the product needs it.
- Preserve Rails defaults where they fit the application.
- Avoid broad refactors while implementing small product features.

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
