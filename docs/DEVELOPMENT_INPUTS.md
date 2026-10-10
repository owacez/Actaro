# Development inputs

Updated: 2026-10-10

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
2. EAS login was verified and Actaro is linked to that account. The user approved
   `com.actaro.app` for Android/iOS development. Internal development profiles
   and Expo's compatible development client are configured. Native compilation
   and launch remain pending; Android is currently unavailable. A physical iPhone
   cloud build needs Apple signing/account access. Do not send signing secrets.
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

## Outstanding v0.1 evidence and access

- Figma's Starter call limit blocks the remaining component/theme reads. The
  verified light values and approved existing components are used; exact visual
  matching and theme switching remain open.
- Complete the [auth](AUTH_TESTING.md) and [profile/preferences](PROFILE_TESTING.md)
  checklists. iPhone sign-in/out, tabs and name editing are user-confirmed;
  confirmation/reset/reopening, account updates and preference save/reopen still
  need individual results. No extra application API key is needed.
- Before a cloud development build, set the two public variables in the linked
  EAS project's development environment and confirm available free build quota.
  No paid service was enabled.

## Current testing

`npm run check` runs typecheck, lint, formatting and real Jest tests without
administrative Supabase access. `npm run check:supabase` checks the supplied live
public configuration without creating users, tables or reading user rows.
`npm start` launches the auth entry screens; fitness features remain unimplemented. Exports and mocked native contract tests do not replace device testing.
