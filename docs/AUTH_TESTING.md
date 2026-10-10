# Authentication testing

Updated: 2026-10-09. Release item 0.8 remains IN_PROGRESS until live and native checks pass.

## Configuration

The existing ignored `.env` needs only the Supabase API URL and public publishable
key listed in `.env.example`. No new API key, administrative secret, paid service,
or SMTP setup is required for this implementation.

Supabase MCP access is verified: project `teqqepzihflflnvhacze` is ACTIVE_HEALTHY.
The first private profile/preferences tables and RLS migration are applied.
Authentication uses Supabase's existing Auth service; profile editing in the app
is a separate foundation task. SQL trigger/ownership tests passed without sending emails.

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
Callbacks forward a PKCE flow ID when present; automatic flow-ID appending is
an SDK experiment and is not enabled by this client. Open the email link on the same
device/browser where signup or recovery started: that runtime holds the verifier.
Only the SDK's PASSWORD_RECOVERY event enables password update; a route name does
not grant access. Callback codes are exchanged once and removed through route replacement.

## Desktop web confirmation and localhost errors

For a signup started at `http://localhost:8081` on your computer:

1. Keep `npm run web -- --port 8081` running.
2. In Supabase Authentication > URL Configuration, verify that Redirect URLs
   includes `http://localhost:8081/auth/callback` and
   `http://localhost:8081/auth/recovery`. These settings have not been inspected
   through the connected tools. Retain the default confirmation URL email template.
3. Open the email link in the same computer browser/profile and origin used for
   signup. That browser holds the PKCE verifier. Do not open the desktop-localhost
   link on your phone: localhost there points to the phone, not the computer.
4. After successful exchange, `/auth/confirmed` shows Email confirmed only if
   Supabase's session reports `email_confirmed_at`. Continue opens Your Account.
   Recovery links return to the separate password-update flow.

Email verification can finish at Supabase before a browser redirect fails, so
later password sign-in may work despite an unreachable redirect. A redirect to
`/` rather than `/auth/callback` may indicate Site URL fallback or a template
configuration issue; inspect the allowlist/template before treating that as proven.
Do not reuse consumed links. If the account is already confirmed, sign in normally.
To test phone confirmation, start signup in Expo Go and allow its actual callback,
then open the email on that same phone.

These are diagnosis and testing instructions, not a claim that remote Auth
configuration or cross-device confirmation has been fixed. See
[Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

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
6. Check that form errors are plain text, without an input-like border. On web,
   errors also appear at the upper right; hover or focus the dismiss button to
   pause automatic dismissal. Check manual dismissal and replacement by a newer
   message. Successful sign-in/sign-out feedback must survive the screen change.
   On mobile, check that success/information snackbars stay within safe areas
   and remain usable with the keyboard open. Success/information messages expire
   after eight seconds; error notifications after ten. Inline errors remain.

## Evidence and limits

Automated tests cover validation, request contracts, duplicate submissions,
password clearing, safe reset responses, session restoration races, listener
cleanup, recovery/sign-out transitions, and callback validation/exchange failures.
Feedback tests cover success after sign-in, screen replacement, timer replacement,
manual dismissal, web hover/focus pauses and a single live error announcement.
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
