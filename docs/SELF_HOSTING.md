# Run Actaro with your own backend

Actaro's backend is a [Supabase](https://supabase.com) instance: PostgreSQL, sign-in,
file storage and one small function, all in one package. There is no other server to
write or run. You can use **Supabase Cloud** (easiest) or **self-host Supabase with
Docker** (your data stays on your own machine or server). One command then sets
everything up.

## What you need

- [Node.js 24 LTS](https://nodejs.org/en/download) and [Git](https://git-scm.com/downloads)
- A Supabase Cloud account, **or** [Docker](https://docs.docker.com/get-docker/) for self-hosting
- About 1 GB of free disk space for the dataset downloads

```bash
git clone https://github.com/owacez/Actaro.git
cd Actaro
npm ci
cp .env.example .env    # Windows PowerShell: Copy-Item .env.example .env
```

## Option A: Supabase Cloud

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard). Note the
   database password you choose.
2. Open **Connect** in the dashboard and fill `.env`:

   | `.env` name                            | Where to find it                                                                                                    |
   | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
   | `EXPO_PUBLIC_SUPABASE_URL`             | Project URL, e.g. `https://abcd.supabase.co`                                                                        |
   | `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | API keys → publishable key (`sb_publishable_…`)                                                                     |
   | `SUPABASE_SECRET_KEY`                  | API keys → secret key (`sb_secret_…`). Server-only.                                                                 |
   | `SUPABASE_DB_URL`                      | Connect → **Session pooler** URI, with your database password. Percent-encode special characters in the password.   |
   | `SUPABASE_ACCESS_TOKEN` _(optional)_   | Account → Access Tokens. Lets setup deploy the account-deletion function and add the sign-in redirect URLs for you. |

3. Run the setup. Check first with a dry run (nothing is written), then for real:

   ```bash
   npm run setup:backend -- --dry-run
   npm run setup:backend
   ```

## Option B: Self-hosted Supabase (Docker)

1. Install Supabase with Docker by following
   [Supabase's self-hosting guide](https://supabase.com/docs/guides/self-hosting/docker).
   It generates your keys (`sh run.sh secrets` shows them) and starts everything with
   `sh run.sh start`. The API runs on port `8000`.
2. Expose Postgres for migrations: add a port mapping to the `db` service (for example
   `5433:5432`), as described in
   [Accessing Postgres](https://supabase.com/docs/guides/self-hosting/accessing-postgres).
3. Fill Actaro's `.env`:

   | `.env` name                            | Value                                                                                      |
   | -------------------------------------- | ------------------------------------------------------------------------------------------ |
   | `EXPO_PUBLIC_SUPABASE_URL`             | `http://<your-computer-ip>:8000` for local testing, or `https://your-domain` in production |
   | `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `SUPABASE_PUBLISHABLE_KEY` from the Docker `.env`                                          |
   | `SUPABASE_SECRET_KEY`                  | `SUPABASE_SECRET_KEY` from the Docker `.env`. Server-only.                                 |
   | `SUPABASE_DB_URL`                      | `postgres://postgres:<POSTGRES_PASSWORD>@<server>:5433/postgres` (the direct connection)   |

   Use your computer's network IP, not `localhost`: phones cannot reach your
   computer's `localhost`. Plain `http://` is accepted only for local and private network
   addresses. Anywhere else, put Supabase behind HTTPS (a reverse proxy).

4. Run `npm run setup:backend -- --dry-run`, then `npm run setup:backend`.
5. Finish the two steps the script prints for self-hosting:
   - Copy `supabase/functions/delete-account` to `volumes/functions/delete-account`, then
     run `sh run.sh restart functions`.
   - Set `SITE_URL` and `ADDITIONAL_REDIRECT_URLS` in the Docker `.env` to the values
     shown, then restart auth.

## What `npm run setup:backend` does

| Step             | What happens                                                                                            | Rerun safe?                       |
| ---------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Check `.env`     | Validates the URL and keys; secrets are never printed                                                   | Yes                               |
| Database         | Applies all migrations in `supabase/migrations` (tables, security rules, functions)                     | Yes, applies only what is missing |
| Account deletion | Deploys `delete-account` (Cloud with an access token; otherwise prints the command)                     | Yes                               |
| Sign-in URLs     | Adds the app's callback URLs, keeping existing ones (Cloud with an access token; otherwise prints them) | Yes                               |
| Exercises        | Downloads the pinned free [RepDB](https://repdb.co) dataset (643 exercises with images) and imports it  | Yes, keeps IDs                    |
| Foods            | Downloads and unzips USDA SR Legacy (7,793 foods, public domain) and imports it                         | Yes, keeps IDs                    |
| Verify           | Read-only checks that the app can connect and private tables are protected                              | Yes                               |

Useful flags: `--dry-run`, `--skip-data`, `--skip-function`, `--skip-auth`.

## Start the app

```bash
npm start          # then scan the QR code with Expo Go
```

Sign up in the app. To use the email confirmation link **on a phone**, add your phone's
Expo Go callback as an allowed redirect URL before signing up:
`exp://<computer-ip>:8081/--/auth/callback` and `exp://<computer-ip>:8081/--/auth/recovery`.
Put them in `ACTARO_AUTH_REDIRECT_URLS` and rerun setup with an access token, or add them
in the dashboard. [Authentication testing](AUTH_TESTING.md) has more detail.

## Going to production

- **HTTPS:** Use HTTPS for the API (Supabase Cloud does this for you).
- **Email:** Configure SMTP so confirmation and reset emails are delivered reliably. Supabase's
  built-in sender is rate-limited.
- **Sign-in URLs:** Set the Site URL and redirect URLs to your real web origin and the app scheme
  (`actaro://auth/callback`, `actaro://auth/recovery`).
- **Backups:** Back up the database. Supabase Cloud includes backups on paid plans; for
  self-hosting, schedule `pg_dump` or volume backups.
- **Secrets:** Keep `SUPABASE_SECRET_KEY`, the database URL and access tokens out of the app,
  EAS environments and Git. Only `EXPO_PUBLIC_*` values go into the app.

## Data licences

- **RepDB:** free tier, attribution required. The dataset is downloaded from RepDB during
  setup and is never stored in this repository. Do not republish it as a dataset or API
  (see [the decision record](decisions/004-repdb-import.md)).
- **USDA FoodData Central SR Legacy:** public domain / CC0.

## Troubleshooting

- **The setup stops at the database step.** Check `SUPABASE_DB_URL`. Percent-encode the
  password, use the session pooler (Cloud) or the direct connection (self-hosted), and
  allow your IP in the database network settings.
- **"public publishable key" error.** You put the secret key in
  `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Use the publishable key there.
- **Imports are denied.** `SUPABASE_SECRET_KEY` must be the secret (service) key.
- **The confirmation email opens a blank or unreachable page on the phone.** The phone's
  callback URL is not in the allowed redirect URLs. See _Start the app_.
- **A step failed partway.** Fix the reported problem and rerun; completed work is kept.
