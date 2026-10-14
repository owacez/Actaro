# Development inputs

Updated: 2026-10-14

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

## Foundation configuration and deferred acceptance

v0.1 active development is DONE. No additional API key or account is needed to
close that scope. The remaining acceptance checks and all native/cloud builds
are user-DEFERRED; retain the following access notes for when testing resumes.

1. Supabase MCP authorization is established. The first profile/preferences migration is applied with database ownership tests; no additional database credential is needed for subsequent reviewed tasks.
2. EAS login was verified and Actaro is linked to that account. The user approved
   `com.actaro.app` for Android/iOS development. Internal development profiles
   and Expo's compatible development client are configured. Native compilation
   and launch remain pending; Android is currently unavailable. A physical iPhone
   cloud build needs Apple signing/account access. The user has no Apple Developer
   membership and explicitly deferred all native/cloud builds until the app is
   ready. Do not submit builds or configure signing now. Do not send signing secrets.
3. For free authentication testing, use a Supabase team email and allow the exact runtime callback URLs. Email confirmation stays enabled; no custom SMTP or paid resource was configured. See [auth testing](AUTH_TESTING.md). The default sender is limited; public production email delivery is a later release requirement.

## Later core-release inputs

- Exercise import is complete: RepDB metadata/media are served from our own
  Supabase project. A fresh backend needs the committed migrations and local
  import described in README; no runtime hotlinking or new application key.
- Nutrition import is complete: USDA SR Legacy is served from our own database.
  No USDA API key is needed. A fresh backend needs migrations and the local import.
- Public distribution: Expo/build account, approved package identifiers and
  store accounts, production email delivery and privacy/store materials.

No AI, maps/GPS, wearable or health-platform credentials are required for v1.0.
Those belong to the explicitly scheduled future releases. Request each input only
when its corresponding task needs it.

## Deferred v0.1 evidence and access

All remaining checks below are DEFERRED by the user's 2026-10-14 instruction.
They do not block further development, but must pass before final release acceptance.

- Figma's Starter call limit blocks the remaining design reads. The approved PDF
  fallback and functional dark palette are in use. Current shared controls and
  theme switching are implemented; full visual acceptance remains open.
- Complete the [auth](AUTH_TESTING.md) and [profile/preferences](PROFILE_TESTING.md)
  checklists. iPhone sign-in/out, tabs and name editing are user-confirmed;
  web email change with both inbox confirmations and an updated account email is
  also user-confirmed. Session restoration, profile/preferences save/reopen, themes
  and password reset/new-password sign-in passed on web/iPhone. Native email change,
  post-crypto device acceptance, individually identified signup/verification and
  two-account application isolation remain open. No extra application API key is needed.
- Cloud builds are user-deferred. When separately authorized later, configure the
  two public build variables and check quota/signing requirements. No build or
  paid service was enabled during foundation verification.

## Current testing

`npm run check` runs typecheck, lint, formatting and real Jest tests without
administrative Supabase access. `npm run check:supabase` checks the supplied live
public configuration without creating users, tables or reading user rows.
`npm start` launches Sign In or the authenticated Today dashboard. Exercise,
workout, nutrition, habits/goals and Today functionality is implemented, with
Weight Progress as the first v0.6 module. Exports and mocked native contract tests
do not replace the deferred device testing.
