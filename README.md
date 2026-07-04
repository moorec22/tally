# Tally

Tally is a simple web application to manage inventory.

## Development

Install the project tool versions with `mise` before setting up the app:

```sh
mise install
```

The app uses PostgreSQL. By default, Rails connects to local databases named
`tally_development` and `tally_test` using your local Postgres user.

Optional environment variables:

- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_TEST_DB`

Set up the app:

```sh
mise exec -- bin/setup --skip-server
```

Run the app locally:

```sh
mise exec -- bin/dev
```

Rails will start on <http://localhost:3000> and Vite will serve frontend assets
alongside it. To use a different Rails port, pass it through to `bin/dev`:

```sh
mise exec -- bin/dev -p 3001
```

Run the test suite:

```sh
mise exec -- bundle exec rspec
```
