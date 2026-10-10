# Authentication testing

Updated: 2026-10-09. Release item 0.8 remains IN_PROGRESS until live and native checks pass.

## Configuration

The existing ignored `.env` needs only the Supabase API URL and public publishable
key listed in `.env.example`. No new API key, administrative secret, paid service,
or SMTP setup is required for this implementation.

Supabase MCP access is verified: project `teqqepzihflflnvhacze` is ACTIVE_HEALTHY.
The public schema has no tables. Authentication uses Supabase's existing Auth
service; profile tables and RLS migrations are a separate foundation task.

The project currently requires email confirmation. This setting was preserved.
The default email sender only delivers to project-team addresses and currently
allows two messages per hour; it is unsuitable for public production delivery.
Use your Supabase team email for free testing. Do not send a password in chat.
See [Supabase default sender restrictions](https://supabase.com/docs/guides/auth/auth-smtp).

## Callback URLs

In the Supabase dashboard, Authentication > URL Configuration, allow the exact
URLs for the runtime you are testing. The connected MCP tools do not expose Auth
configuration editing; the allowlist has not been inspected or changed.

- Development build using the existing `actaro` scheme:
  `actaro://auth/callback` and `actaro://auth/recovery`.
- Web when launched on port 8081: `http://localhost:8081/auth/callback` and
  `http://localhost:8081/auth/recovery`.
- Expo Go uses its development `exp://.../--/auth/callback` and recovery URLs,
  derived by `Linking.createURL`. Allow the actual URL for your running server;
  do not substitute a guessed address. A development build gives stable scheme URLs.

Keep Supabase's default confirmation/reset templates using the confirmation URL.
The SDK adds the PKCE flow ID to the redirect. Open the email link on the same
device/browser where signup or recovery started: that runtime holds the verifier.
Only the SDK's PASSWORD_RECOVERY event enables password update; a route name does
not grant access. Callback codes are exchanged once and removed through route replacement.

## Verification steps

1. Run `npm start` for native, or `npm run web -- --port 8081` for web. Restart
   after environment changes. Check keyboard usability and error/loading states.
2. Create an account using a team email. Check password mismatch validation;
   follow the confirmation link on the initiating device, then sign in.
3. Close and reopen the app. Confirm the account remains signed in. Sign out,
   reopen, and confirm that the sign-in screen returns. Repeat on Android and iOS.
4. Request password reset. Follow the link on the initiating device, set a new
   password, sign out, and sign in with the new password. An expired/used link
   must show an error. Reset responses must not reveal account existence.
5. Check confirmation resend within sender rate limits. Test failed sign-in and
   network failure without displaying raw provider errors or logging credentials.

## Evidence and limits

Automated tests cover validation, request contracts, duplicate submissions,
password clearing, safe reset responses, session restoration races, listener
cleanup, recovery/sign-out transitions, and callback validation/exchange failures.
SDK boundaries are mocked; these tests do not prove live email delivery or device
session persistence. Exports verify bundling, not native launches.

Sign In and Password Reset use the fetched Figma values. The user authorized
composing signup/verification/update from those components after Figma's read
limit blocked Sign Up. Exact Sign Up parity remains pending. ACTARO replaces the
design's FITNESS label. The privacy copy avoids claiming verified fitness-data
RLS before those tables exist. Auth uses a full safe-area screen instead of a
border around the Figma artboard and retains accessible 44-point controls.

The browser automation runtime failed to start twice. No screenshot comparison
or interactive browser smoke test is claimed from this session.
