# Tally

Tally is a simple web application to manage inventory.

## Accounts

Tally requires an account to access inventory pages and JSON API endpoints. For
now, all signed-in accounts manage the same shared inventory; items and inventory
snapshots are not scoped to individual users.

There is no public sign-up page yet. Accounts are created manually by an
operator, and users sign in at `/sign-in`.

### Create an account in the console

Start a Rails console:

```sh
mise exec -- bin/rails console
```

Create the account:

```ruby
User.create!(
  email_address: "owner@example.com",
  password: "replace-with-a-secure-password"
)
```

## Development

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
bundle install
bin/rails db:prepare
```

Run the test suite:

```sh
bundle exec rspec
```
