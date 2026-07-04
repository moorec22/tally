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

## Docker

Build the production image:

```sh
docker build -t tally .
```

Run the app and PostgreSQL with Docker Compose:

```sh
RAILS_MASTER_KEY=$(cat config/master.key) POSTGRES_PASSWORD=replace-with-a-secure-password docker compose up --build
```

The app will be available at <http://localhost:3000>. Compose stores uploaded
files in the `tally_storage` volume and PostgreSQL data in the `tally_postgres`
volume.

For managed Docker platforms, provide `RAILS_MASTER_KEY` and either the
`POSTGRES_*` variables used by `compose.yaml` or `DATABASE_URL`. If you use
separate databases for Solid Cache, Solid Queue, or Solid Cable, set
`CACHE_DATABASE_URL`, `QUEUE_DATABASE_URL`, and `CABLE_DATABASE_URL`.

### Google Cloud Run

The production image listens on Cloud Run's default `PORT=8080`.

Recommended runtime services:

- Cloud SQL for PostgreSQL
- Secret Manager for `RAILS_MASTER_KEY` and database credentials
- Google Cloud Storage for Active Storage uploads

Set these environment variables for Cloud Run:

```sh
APP_HOST=tally.example.com
DB_PREPARE_ON_BOOT=false
GOOGLE_CLOUD_STORAGE_BUCKET=your-tally-uploads-bucket
POSTGRES_DB=tally_production
POSTGRES_HOST=/cloudsql/PROJECT_ID:REGION:INSTANCE
POSTGRES_PASSWORD=<secret>
POSTGRES_USER=tally
RAILS_MASTER_KEY=<secret>
SOLID_QUEUE_IN_PUMA=true
```

If you keep Solid Cache, Solid Queue, and Solid Cable in separate databases,
also set:

```sh
CACHE_DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/tally_production_cache
QUEUE_DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/tally_production_queue
CABLE_DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/tally_production_cable
```

Run migrations as a deploy step or Cloud Run Job before sending traffic to a
new revision:

```sh
bin/rails db:prepare
```

Attach the Cloud SQL instance when deploying the service:

```sh
gcloud run deploy tally \
  --image IMAGE_URL \
  --add-cloudsql-instances PROJECT_ID:REGION:INSTANCE \
  --set-env-vars DB_PREPARE_ON_BOOT=false,SOLID_QUEUE_IN_PUMA=true
```

Grant the Cloud Run service account permission to access the Cloud SQL instance
and the configured Storage bucket.
