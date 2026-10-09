# Development inputs

Updated: 2026-10-09

## Already supplied

- Supabase project reference: `teqqepzihflflnvhacze`; initially empty, per the user.
- API URL and public publishable key are stored in the ignored root `.env`.
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

## Needed for upcoming foundation tasks

1. Supabase database tools must become available for project inspection and
   reviewed migrations. The user selected this route; installation is confirmed and the user authorized connection, but database
   tools are not yet exposed to this session. No administrative credential is needed in the app's environment.
2. Android and iPhone device access for launch/session tests. Native build setup
   will need a locally authenticated Expo account and user-approved application
   identifiers. Do not invent signing identities or bundle IDs.
3. Authentication email configuration when implementing verification and password
   reset: confirm intended test recipients, configure the supported email provider
   in Supabase, and allow the exact callback URLs defined by that task. Keep SMTP
   credentials in Supabase, not in mobile code. No production domain is assumed.

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
`npm start` launches the starter app; it does not yet offer sign-in or fitness
features. Exports and mocked native contract tests do not replace device testing.
