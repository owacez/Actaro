# Development inputs

Updated: 2026-10-09

## Already supplied

- Supabase development project and administrative connection are configured.
- Each checkout supplies its project's API URL and public publishable key in the
  ignored root `.env`; use `.env.example` for a fresh checkout.
- Android and iOS are both test targets.
- Git author and GitHub repository are configured.
- Canonical product/plan documents and the read-only Figma reference are available.

The application's current environment needs only:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Use `.env.example` on another checkout. Public configuration is embedded in the
app. Never put database passwords, access tokens, service-role/secret keys, SMTP
credentials, or signing credentials in these variables or send them in chat.

For a different Supabase project, apply the committed migrations and configure
Auth callback URLs for that runtime. Authenticate the development tools against
that project before administrative tasks; the public key cannot apply migrations.

## Needed for upcoming foundation tasks

1. Supabase MCP authorization is established. The first profile/preferences migration is applied with database ownership tests; no additional database credential is needed for subsequent reviewed tasks.
2. Android and iPhone device access for launch/session tests. Native build setup
   will need a locally authenticated Expo account and user-approved application
   identifiers. Do not invent signing identities or bundle IDs.
3. For free authentication testing, use a Supabase team email and allow the exact runtime callback URLs. Email confirmation stays enabled; no custom SMTP or paid resource was configured. See [auth testing](AUTH_TESTING.md). The default sender is limited; public production email delivery is a later release requirement.

## Later core-release inputs

- Exercise import: obtain/verify the approved RepDB source, its usage rights and
  the source media to import into Supabase Storage. No runtime hotlinking.
- Nutrition: select a licensed food-data source in the v0.4 task. If its API needs
  a private key, use an approved server-side Supabase function; never ship that key.
- Public distribution: Expo/build account, approved package identifiers and
  store accounts, production email delivery and privacy/store materials.

No AI, maps/GPS, wearable or health-platform credentials are required for v1.0.
Those belong to the explicitly scheduled future releases. Request each input only
when its corresponding task needs it.

## Current testing

`npm run check` runs typecheck, lint, formatting and real Jest tests without
administrative Supabase access. `npm run check:supabase` checks the supplied live
public configuration without creating users, tables or reading user rows.
`npm start` launches the auth entry screens; fitness features remain unimplemented. Exports and mocked native contract tests do not replace device testing.
