# 002 — Supabase client and session lifecycle

Date: 2026-10-09

## Decision

Use the supplied Supabase project's HTTPS API origin and new public publishable
key through the ignored root `.env`. Validate both before creating one shared
client in `src/lib/supabase/client.ts`. Reject dashboard URLs and privileged keys.
No project key is committed. RLS, rather than a public key, protects user rows.

Follow Supabase's React Native client guidance: URL polyfill, Expo-compatible
AsyncStorage for native session persistence, browser storage on web, and explicit
foreground/background token refresh. The root layout registers one listener in
an effect and removes it on cleanup. Lazy creation avoids accessing native
storage while statically rendering the web application.

AsyncStorage is not encrypted storage. It is used only for the SDK session here;
no health records or privileged credentials are stored in it. Authentication UI,
real session persistence tests, callback handling, and account security remain
separate work. Revisit storage requirements in the security review before release.

## Verification and limits

Configuration tests reject missing variables, malformed/non-HTTPS origins,
embedded credentials, dashboard URLs, query/hash parameters, and non-public keys.
Client contract tests check singleton creation, persistence options, foreground
refresh, background suspension, cleanup, and the browser branch. These use native
boundary mocks; they do not prove persistence on a device.

`npm run check:supabase` sends only read-only requests: Auth settings and SDK
queries for zero profile/preferences rows. After the first migration, anonymous
requests must receive database permission denial (`42501`, HTTP 401/403). The
earlier pre-migration probe expected `PGRST205` for the missing profile table.
The probe confirms API/key reachability and anonymous grants, not authenticated
ownership; real two-user SQL tests verify that separately.
The script requires Node 24, used by this workspace, to load the shared TypeScript
configuration validator without introducing a second configuration implementation.

Database administration will use the user-selected Supabase connection, once
authenticated. Never use the publishable client to apply migrations or embed an
administrative key in the application. Generate database types from the actual
schema after each schema task; do not invent types for tables that do not exist.

## Sequencing

Headless integration proceeds before Figma tokens because the user has supplied
the project configuration and the client has no visual dependency. Product
screens still require Figma evidence. No schema, auth flow, later-release feature,
or Figma file is changed in this task.

References:

- [Supabase React Native authentication setup](https://supabase.com/docs/guides/auth/quickstarts/react-native)
- [Supabase public API keys and RLS](https://supabase.com/docs/guides/getting-started/api-keys)
- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)

## Auth flow implementation (2026-10-09)

The authorized authentication task now uses PKCE, an AuthProvider for session restoration/events and feature-local Supabase calls. The provider owns the native refresh subscription and cleans it up. Callback routes exchange a one-use code with its SDK `sb_flow_id`, replace the URL on success, and never log tokens or provider responses. Only the SDK PASSWORD_RECOVERY event opens password update. Sign-out uses local scope to clear this device. AsyncStorage remains the SDK session store; live Android/iOS persistence is unverified.

Email confirmation is enabled on the project and was preserved. The user requested no custom SMTP or paid resources. Exact callback allowlists and live email delivery still require verification. See [auth testing](../AUTH_TESTING.md). No profile tables, health-data policies, or schema migrations were added by the auth task.
