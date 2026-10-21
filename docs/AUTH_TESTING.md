# Authentication testing

Updated: 2026-10-21. v0.1 authentication development is DONE for the active scope.
Live confirmation return testing is IN_PROGRESS after the reported Safari failure;
other retained native acceptance checks remain user-DEFERRED. See
[foundation closure](DEVELOPMENT_STATUS.md#v01-development-closure--2026-10-14).

## Configuration

The ignored root `.env` needs only the Supabase API URL and public publishable
key listed in `.env.example`. No new API key, administrative secret, paid service,
or SMTP setup is required for this implementation.

Use the Supabase project matching `EXPO_PUBLIC_SUPABASE_URL` in your local `.env`.
The project's dashboard shows its project reference for administrative tooling;
the app does not need a separate reference variable. Apply the committed migrations
when using a new project. In the current development project, the first private
profile/preferences tables and RLS migration are applied.
Authentication uses Supabase's existing Auth service; profile editing in the app
is a separate foundation task. SQL trigger/ownership tests passed without sending emails.

The project currently requires email confirmation. This setting was preserved.
The default email sender only delivers to project-team addresses and currently
allows two messages per hour; it is unsuitable for public production delivery.
Use your Supabase team email for free testing. Do not send a password in chat.
See [Supabase default sender restrictions](https://supabase.com/docs/guides/auth/auth-smtp).

## Callback URLs

### Latest failing link and recovery (2026-10-21)

The user's latest signup email explicitly targets `http://localhost:8081/auth/callback`.
This is a web destination: on iPhone it addresses the phone, not the development
computer. It could come from a web request, an older email or Supabase's Site URL
fallback; the destination alone does not prove which runtime initiated signup.
The reported **Unable to open this link / expired or already used** message is
the app's callback error UI, distinct from Safari being unable to reach a host.
Do not replay the shared link or copy its token into logs or documentation.

The callback now recommends trying normal sign-in before sending more confirmation
emails, without claiming success or granting a session. If Supabase rejects sign-in
with `email_not_confirmed`, the existing verification screen opens with the email
preserved and password cleared. Resend requires an explicit button press. Expired
password recovery keeps separate instructions to request a new reset link.

The previous tunnel's successful manifest/allowlist probes were point-in-time
checks. On October 21 the tunnel was offline and two restart attempts timed out;
its old hostname is not evidence of a currently reachable callback. Phone email
handoff is still **IN_PROGRESS**, not fixed by these recovery UI changes. No
IP address, tunnel hostname or localhost return was hardcoded into app code.

Next checks: sign in normally if already verified; if unconfirmed, resend only
from the intended running runtime; verify a fresh email returns there. For web,
use the original computer/browser with its server running. For phone, a running
hostname-based Expo Go tunnel and its allowed callbacks are required; stable
installed-build callbacks remain deferred by the user's build decision.

### Verified redirect diagnosis (2026-10-20)

Before correction, read-only probes of the development project used an
intentionally invalid token, followed no redirect and sent no emails. Supabase
returned HTTP 303:

| Requested destination                                        | Observed result                        |
| ------------------------------------------------------------ | -------------------------------------- |
| Current web origin on port 8081, callback and recovery paths | Accepted                               |
| The user's current Expo Go LAN callback                      | Replaced with `http://localhost:3000/` |
| Configured `actaro://auth/callback` and recovery scheme      | Replaced with `http://localhost:3000/` |
| No requested redirect                                        | `http://localhost:3000/`               |

Verification can succeed at Supabase before the browser fails to open its return
destination. The app already sends runtime-derived URLs for signup, resend,
reset and email changes; hardcoding a LAN address would not fix this.

For development, set Site URL to the **actual web origin plus `/auth/callback`**.
Keep exact web callback/recovery entries. Start a hostname-based Expo tunnel,
allow its exact callback/recovery URLs, and open that tunnel project on the
phone **before** requesting a fresh email there. Old emails retain old targets.
Keep the server running; avoid broad wildcards. Installed builds need the
configured `actaro://` entries. Before deployment, use the actual deployed web
origin for Site URL; no production domain is assumed here.

The user then saved the development Site URL and exact tunnel callback/recovery
entries in the dashboard. Repeat probes **PASS**: the default goes to the web
callback on port 8081, both tunnel destinations are accepted exactly, and the
web callback remains accepted. The native tunnel manifest is reachable (HTTP
200); the iPhone loading page requires `?platform=ios` when opening it directly.
Fresh live confirmation remains pending. Successful invalid-token probes verify
destination selection, not email delivery, PKCE exchange or an iPhone launch.

In the Supabase dashboard, Authentication > URL Configuration, allow the exact
URLs for the runtime you are testing. The connected MCP tools do not expose Auth
configuration editing. The probes above verify specific effective destinations;
the full allowlist and email templates have not been inspected through the
dashboard tools. The user-applied URL correction above is verified by probes.

- Development build using the existing `actaro` scheme:
  `actaro://auth/callback` and `actaro://auth/recovery`.
- Web when launched on port 8081: `http://localhost:8081/auth/callback` and
  `http://localhost:8081/auth/recovery`.
- Expo Go uses its development `exp://.../--/auth/callback` and recovery URLs,
  derived by `Linking.createURL`. Allow the actual URL for your running server;
  do not substitute a guessed address. A development build gives stable scheme URLs.

The localhost URLs above are examples for port 8081, not fixed application
configuration. If Expo uses another port or web origin, use that exact origin
with `/auth/callback` and `/auth/recovery`. The application derives callback URLs
from the running environment rather than storing a machine address in code.

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

### Email changes started in Expo Go

Supabase's secure email-change flow requires confirmation from both the current
and replacement inboxes. The first accepted link can return only a message,
without a session code. The callback now shows **Check your other inbox** for
that response; it does not grant a session or claim that the email has changed.
The final link follows the existing PKCE code-exchange flow.

A redirect to `localhost:3000` is not an Expo Go callback. It is consistent with
Supabase falling back to Site URL after rejecting/missing a requested redirect,
or an overridden email template. MCP cannot edit these settings and no browser
was available. The user's subsequent tunnel allowlist correction is verified
above; the complete allowlist/templates were not inspected through dashboard tools.

The project's Auth health endpoint reports v2.197.0. That version's
[redirect validation](https://github.com/supabase/auth/blob/v2.197.0/internal/utilities/request.go)
rejects non-loopback literal IP destinations before checking the allowlist,
unless the destination matches the configured Site URL. A LAN Expo Go URL can
therefore fall back even when listed. Use a hostname-based tunnel for this test
instead of changing Site URL to a personal LAN address:

1. Stop the existing Expo server and run `npm start -- --go --tunnel` from the
   project root. If Expo needs its tunnel helper, follow the README's tunnel setup.
2. In Supabase **Authentication > URL Configuration**, add the actual tunnel
   URL shown by Expo with `/--/auth/callback` and `/--/auth/recovery` appended.
   For example, the structure is `exp://<actual tunnel host>/--/auth/callback`;
   replace the placeholder with the running server's complete host/port. Do not
   paste the placeholder, guess an IP or allow every destination. Update the
   entries if the tunnel changes. Keep the default confirmation URL templates.
3. Scan the new QR code on iPhone, start a new email-change request there, and
   open both fresh confirmation emails on that same phone. Keep Metro running.
   The desktop browser does not have the phone's PKCE verifier. Previously
   issued links do not pick up changed redirect settings.
4. The first link should show the other-inbox instruction. After the final
   confirmation, reopen Profile and verify the server-reported email, then sign
   out and sign in with the replacement email. Record each result separately.

For stable native callbacks, use the configured development build and its
`actaro://auth/callback` and `actaro://auth/recovery` allowlist entries instead.
No additional environment variable or API key is needed. See
[Expo callback URL behavior](https://docs.expo.dev/versions/v57.0.0/sdk/linking/).

### Email changes started on web

1. Keep the web server running. Begin the request in the browser profile where
   you are signed in. Use the same origin throughout: `localhost` and
   `127.0.0.1`, different ports, private windows and separate browser profiles
   do not share the required local verification data.
2. Make one request, then open both current/replacement inbox links once in that
   original browser profile. Do not sign out, clear browser storage, or start
   another signup/reset/email-change request between those confirmations.
3. The first accepted link can show **Check your other inbox**. The final link
   must exchange its code and show the confirmed state. Reopen Profile to
   verify the actual account email, then test replacement-email sign-in.
4. A `localhost` redirect opened on a phone addresses the phone, not the
   development machine. Start a separate phone test in Expo Go using its actual
   allowed callback; do not reuse a link from the web request.
5. If confirmation fails, report only the screen's safe error message. Missing
   browser verification data, mismatched requests and expired/used links now
   have separate messages. Never share confirmation URLs, tokens or codes.

### Remaining auth acceptance

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
