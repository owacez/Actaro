# Actaro

Premium personal fitness and wellness mobile application, developed incrementally.
Current implementation: Expo foundation, Supabase client and email/password auth flows with contract tests. Live email/device verification is pending.
The starter screens, colors, icons, and assets are Expo examples, not the approved
Actaro design system or implemented product features. Version `0.1.0` is project
metadata; v0.1's release gate has not passed.

## Project authority

- [Source of Truth](docs/ACTARO_SOURCE_OF_TRUTH_FINAL.md): product behavior.
- [Development Plan](docs/ACTARO_DECELOPMENT_PLAN.md): release order and weights.
  This is the supplied file's actual name; the requested
  `ACTARO_DEVELOPMENT_PLAN_FINAL.md` is absent. Both supplied documents retain
  older `FITNESS_APP_*` references. Original canonical files are preserved.
- [Figma](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW): visual authority.
- [Development Status](docs/DEVELOPMENT_STATUS.md): verified implementation.
- [Agent instructions](AGENTS.md): development rules and verification.

Explicit user work orders determine the authorized scope. Initialization does
not authorize completing the rest of v0.1.

## Local development

### Requirements

- Install [Node.js 24 LTS with npm](https://nodejs.org/en/download), then reopen
  your terminal. SDK 57 requires Node 22.13 or later; this checkout was verified
  with Node 24.21.0. Check with `node --version` and `npm --version`.
- Install [Git](https://git-scm.com/downloads) if cloning or pulling updates.
- Install Expo Go on your Android phone or iPhone. Use a version that supports
  **Expo SDK 57**, the version in this project. Check the
  [Expo Go downloads](https://expo.dev/go) if an SDK mismatch appears.
- Connect the computer and phone to the same Wi-Fi network. Internet access is
  needed for dependency installation and Supabase authentication.
- For a physical iPhone, sign in to Expo CLI with `npx expo login`, then sign in
  to Expo Go with the same Expo account. This is separate from your Actaro account.

No Android Studio, Xcode, EAS build, or custom SMTP setup is needed to start
testing the current app in a compatible Expo Go. The user verified sign-in,
sign-out, tab switching and name editing on iPhone Expo Go. Android and the
remaining live acceptance checks are pending.

References: [SDK requirements](https://docs.expo.dev/versions/v57.0.0/),
[opening the app on a phone](https://docs.expo.dev/get-started/start-developing/).

### First-time setup

Run all commands from your checkout's root directory, which contains
`package.json`. In VS Code, open the Actaro folder and select **Terminal > New
Terminal**. The checkout can live anywhere on your computer.

If you have not cloned the repository yet:

```bash
git clone https://github.com/owacez/Actaro.git
cd Actaro
```

Install the locked dependencies:

```bash
npm ci
```

`npm install` (or `npm i`) also installs dependencies. Prefer `npm ci` for a fresh
checkout so it uses the committed lockfile. You only need to install again after
pulling dependency changes or when `node_modules` is missing.

Create `.env` from `.env.example` **only if `.env` does not already exist**.
Keep an existing configured `.env`; it is local to your checkout and is not
included when cloning the repository. In Windows PowerShell:

```powershell
if (!(Test-Path -LiteralPath .env)) { Copy-Item -LiteralPath .env.example -Destination .env }
```

On macOS/Linux, use `cp -n .env.example .env`. Edit `.env` and fill both values
from your Supabase project's Connect dialog:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Use the HTTPS API origin, not the dashboard URL. `.env` is ignored by Git;
the publishable key is public app configuration. No privileged key belongs here.

### Start Expo Go on your phone

From the project root:

```bash
npm start -- --go --lan
```

Equivalent direct command: `npx expo start --go --lan`. The `--go` flag selects
Expo Go explicitly. Leave the terminal running while you test.

1. Android: open Expo Go and use its QR scanner to scan the terminal QR code.
2. iPhone: scan the QR code with Camera and open the link in Expo Go. Use the
   same Expo account in CLI and Expo Go as described above.
3. The app should show Sign In, or Today if a session was previously
   saved. Create Account and Forgot Password are available from Sign In.
4. Press `r` in the terminal to reload; press `Ctrl+C` to stop the server.

For subsequent sessions, run only the start command unless dependencies or
environment configuration changed. Restart the server after `.env` edits.

### Authentication testing in Expo Go

The project requires email confirmation. With the current default sender, test
using your Supabase team email. Confirmation/reset callbacks must be allowed in
Supabase and opened on the initiating phone; detailed steps and sender limits
are in [authentication testing](docs/AUTH_TESTING.md).

Expo Go uses the running server's `exp://.../--/auth/callback` and recovery URLs,
not `actaro://...`. Use your actual server address when configuring callbacks;
LAN IPs and tunnel addresses can change. Stable `actaro://` links require a
development build. If a link fails, inspect the callback allowlist before
repeating requests. No additional app key or paid SMTP service was configured.

### Troubleshooting

- **`npx expo login` asks to install Expo:** run it from the Actaro folder,
  where `package.json` and the installed dependencies live. Running outside
  your checkout can make npx offer a temporary Expo download. Open a terminal
  in the project root, then run `npx --no-install expo login` (or
  `npx.cmd --no-install expo login` on Windows). The `--no-install` flag prevents a temporary
  download. If dependencies are genuinely missing, run `npm ci` (`npm.cmd ci`
  on Windows) in the project root first. Pressing `Ctrl+C` cancels the current command; it does not
  establish an Expo login.
- **`npm` or `node` is not recognized:** install Node 24 LTS and reopen the
  terminal. Confirm that `node --version` and `npm --version` work before
  continuing. Use the installer for your operating system and processor.
- **PowerShell blocks `npm.ps1`:** use `npm.cmd ci` and
  `npm.cmd start -- --go --lan`; use `npx.cmd` for direct CLI commands.
- **QR code will not connect:** check Wi-Fi, VPN and guest-network isolation.
  Allow Node.js through Windows Firewall on your private network. Do not use
  `--localhost` for a physical phone.
- **LAN remains unavailable:** optionally use Expo's tunnel helper and rescan
  the new QR code. These commands are an alternative to LAN, not extra required
  app dependencies:

  ```bash
  npm install -g @expo/ngrok
  npm start -- --go --tunnel
  ```

- **Stale bundle or configuration:** stop the server and run
  `npm start -- --go --lan --clear`.
- **Expo Go reports an SDK mismatch:** check SDK 57 support in the installed
  Expo Go. If unavailable on your device, use a compatible version or a
  development build; do not change project dependencies just to bypass it.
- **iPhone reports an Expo account mismatch:** run `npx expo login` and sign in
  to Expo Go with that same account.
- **Authentication unavailable:** check both `.env` values, restart Expo, and
  optionally run the read-only `npm run check:supabase` probe.
- **Confirmation opens localhost on your phone:** a desktop web signup must be
  completed in that same computer browser, with the web server running. Localhost
  on the phone targets the phone. Verify the callback allowlist using the
  [web confirmation checklist](docs/AUTH_TESTING.md#desktop-web-confirmation-and-localhost-errors).

### Current screens

These views exist in code and have automated logic/contract tests; full
live email and Android/iOS verification remain pending.

Auth errors appear as plain text beside the form. On mobile, successful actions
and email instructions use a bottom snackbar. On web, errors and successful
actions also use a dismissible notification at the upper right. Notifications
expire automatically; hovering or focusing the web notification pauses dismissal.

| Screen / state                         | Present behavior                                                                                                            |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Sign In                                | Validated email/password sign-in.                                                                                           |
| Sign Up                                | Email, password and confirmation; creates a Supabase account.                                                               |
| Check Your Email                       | Confirmation instructions and resend.                                                                                       |
| Reset Password                         | Requests a recovery link without revealing account existence.                                                               |
| Set a New Password                     | Updates the password after the SDK recovery event.                                                                          |
| Callback processing / error            | Exchanges a one-use code or displays a safe link error.                                                                     |
| Email Confirmed                        | Shows verified status from the Supabase session, then Continue to Account.                                                  |
| Today / Fitness / Nutrition / Progress | Signed-in tab destinations showing planned release scope; no tracking data yet.                                             |
| More                                   | Real signed-in email, Profile management and local sign-out.                                                                |
| Profile                                | Edit/clear name, view/change email and change password. Open More → Profile management.                                     |
| Preferences                            | Save units, time zone, notification and gamification preferences. Open More → Preferences. Theme switching remains pending. |

The remaining `/explore` route is an Expo starter example, not an Actaro feature.
The five-tab navigation shell is implemented; sign-in opens Today. The populated
Today dashboard belongs to v0.5. Exercise, workout,
nutrition, habits/goals and progress screens remain in their scheduled releases.

Tunnel setup and flags follow the [Expo CLI documentation](https://docs.expo.dev/more/expo-cli/).

### Other commands

### Native development builds

`expo-dev-client` is installed and `eas.json` defines internal development and
iOS Simulator profiles. Android and iOS use the approved development identifier
`com.actaro.app`. This checkout is linked to the verified EAS project through
`app.json`; a fork should link its own project with `npx eas-cli@latest init`.

Before building, sign in with `npx eas-cli@latest login` and set the two public
Supabase variables in that project's **development** EAS environment. Ignored
local `.env` files are not uploaded in the build archive. Use the same API URL
and publishable key as your local checkout; never add privileged secrets.
Check your account's available build allowance first. No cloud build, paid
subscription or store submission was performed by this setup.

```bash
npx eas-cli@latest build --profile development --platform android
npx eas-cli@latest build --profile development --platform ios
```

A physical iPhone EAS build requires Apple signing/account setup. Continue using
Expo Go while that is unavailable. The `development-simulator` profile creates
an iOS Simulator build for a Mac. A configured profile or successful JS export
does not establish a successful native build or device launch.
See [Expo's development-build guide](https://docs.expo.dev/develop/development-builds/introduction/).

After installing your development build, start Metro with:

```bash
npm start -- --dev-client --lan
```

For Expo Go, keep using `npm start -- --go --lan` instead.

### Checks and other platforms

For web testing, run `npm run web`. For an installed Android emulator, use
`npm run android`; `npm run ios` requires an iOS Simulator on a Mac. A physical
iPhone can connect to your computer's Expo Go server through the QR code.

```bash
npm run typecheck
npm run lint
npm run format:check
npm run check
npm test
npm run test:watch
```

`npm run format` applies Prettier. Canonical documents and binary assets are
excluded from formatting. Jest uses the SDK 57 Expo preset and React Native Testing Library. Tests cover
server/client hydration, Supabase configuration, auth forms/services, callback handling and session transitions. `npm run check` includes tests
and fails if any check fails. `.github/workflows/check.yml` runs the locked
install, these checks and Android/iOS/web exports on pushes to `main` and pull
requests. CI requires no Supabase credentials; exports do not run authenticated requests.

For database ownership regression checks, run the entire
[profile/preferences SQL test](supabase/tests/profile_preferences.sql) through
the authorized Supabase MCP connection or the project's SQL Editor as an
administrator. It creates disposable test users, checks grants/RLS and validation,
then rolls back all fixtures. It sends no emails and does not edit the existing
account. These database checks complement the app tests; profile UI acceptance
remains pending.

## Structure and architecture

The scaffold follows Expo's default template and supported SDK versions:
[create-expo-app](https://docs.expo.dev/more/create-expo/) and
[SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/).

```text
src/app/          Expo Router route entry points and auth layout
src/features/auth/ Auth UI, business/service logic and session context
src/features/profile/ Typed profile/preferences services and input validation
src/components/   Existing Expo starter components
src/hooks/        Existing starter presentation hooks
src/constants/    Verified Actaro light tokens plus the preserved starter theme
src/expo.d.ts     Expo global typings for checks before generated files exist
assets/           Expo starter media and icons
scripts/          Generator-provided reset script
docs/             Canonical documents, status, and decisions
```

Add `src/features/<feature>/` only with approved feature work; separate its UI,
business logic, and data access. Routes compose feature UI. Shared UI belongs
in `src/components/` when reuse is justified. Avoid unused folders or placeholder
services. The generator's `reset-project` moves starter code; do not run it as
unrelated cleanup.

Backend: Supabase PostgreSQL, Auth, RLS and Storage. The shared client is
configured; auth screens and service flows exist. The profile/preferences schema
and ownership policies are applied and database-tested; typed profile/preferences
services have SDK request tests. Profile edits names through the database service;
email/password changes use Supabase Auth, with required confirmation and safe errors.
Preferences save units, time zone and notification/gamification opt-in values;
reminder delivery and achievements belong to later releases. Theme switching and
full live acceptance are pending. React state
is the default; TanStack Query and Zustand require demonstrated needs.
See [mobile stack decision](docs/decisions/001-mobile-stack.md).

## Environment and security

Copy `.env.example` to `.env` and supply your project API URL and public
publishable key before launching the app. The client validates these values;
restart Expo after changes. Actual `.env` variants are ignored. Public Expo variables are bundled app content: never use
these for service-role keys, database passwords, signing secrets, or AI provider
credentials. The user approved `com.actaro.app` for Android/iOS development;
production identifiers and domains still require release review.

Run `npm run check:supabase` with Node 24 for the read-only live connection check.
The probe requires anonymous permission denial for the private profile/preferences tables.
See [required development inputs](docs/DEVELOPMENT_INPUTS.md) and
[Supabase client decision](docs/decisions/002-supabase-auth.md).
The [schema design](docs/decisions/003-core-schema.md) specifies the first
profile/preferences migration and historical data rules; later module schemas remain pending.

## Release discipline

Core order: v0.1 Foundation → v0.2 Exercise Library → v0.3 Strength Workouts →
v0.4 Manual Nutrition → v0.5 Habits, Goals & Today → v0.6 Basic Progress →
v0.9 Quality & Personal Beta → v1.0 Core Release.

Future order: v1.1 Active Minutes → v1.2 Running & GPS → v1.3 Advanced Analytics
& Achievements → v1.4 Food Photo AI → v1.5 Advanced Offline & Sync → v2.0 Health
& Wearables. Retained unassigned/deferred work is tracked in Development Status.

Initialization stops at review. Feature development requires explicit approval
of the next small, independently verifiable task.

For signup, verification and reset testing, see [authentication testing](docs/AUTH_TESTING.md). After sign-in, Today opens within the five-tab shell; More contains account management and sign-out. Product dashboards are not implemented.
For name/email/password and account-isolation checks, see [profile testing](docs/PROFILE_TESTING.md).
