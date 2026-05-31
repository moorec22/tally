# AGENTS.md

## Project Overview

Tally is a simple Rails web application for inventory management. The app should help users track items, quantities, and changes to stock in a clear, low-friction workflow.

Prefer straightforward Rails conventions over custom architecture. Keep the product practical and easy to maintain: simple models, readable controllers, conventional views, and focused tests.

## Development Guidelines

- Use RSpec for tests. Do not add new Minitest files.
- Keep inventory workflows explicit and understandable.
- Favor server-rendered Rails patterns unless the feature clearly needs richer client-side behavior.
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

When changing behavior, add or update focused RSpec coverage and run:

```sh
bundle exec rspec
```
