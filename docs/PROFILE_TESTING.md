# Profile testing

Updated: 2026-10-10. v0.1 Profile / Preferences remains IN_PROGRESS.

## Current scope

Sign in, select **More → Profile management**, and edit the optional display
name. Leave it blank to clear it. Save uses the existing authenticated Supabase
service; only `display_name` is updated. The same screen displays your current
email and offers email/password changes through Supabase Auth. Email changes
remain pending until Supabase's required confirmations are completed. Password
changes use the signed-in session; a server reauthentication requirement is
reported without bypassing it. No current-password verification is claimed.
No new environment variable, schema migration or API credential is required.

The user authorized existing verified components after Figma MCP hit its Starter
call limit. This functional editor does not establish exact Profile visual parity.
Preferences now save units, time zone and notification/gamification preference
values through the same private service; theme switching remains pending.
Browser automation could not initialize,
so no agent interactive visual or live authenticated persistence pass is claimed.
The user reports the name editor works on iPhone Expo Go; this is not evidence
for email/password updates. The latest iPhone report confirms five-tab switching,
sign-in and sign-out; Android is unavailable.

## Manual acceptance — web and Expo Go

Run the app using the [README](../README.md). Use your own test accounts; never
share a password, session token, confirmation code or private profile data in chat.

1. Sign in as test user A, open Profile and confirm the saved name loads. An
   unnamed profile should show an empty field. Unchanged values cannot be saved.
2. Edit the name and choose Discard changes; the saved value returns without an
   update. Enter more than 80 characters; saving must show validation feedback.
3. Save a valid name. During the request, editing/save/discard/back controls are
   disabled. Success appears only after the server confirms the save. Close the
   editor, reopen it, then reload/reopen the app and confirm the saved value remains.
4. Clear the name and save; reopening must show an empty field.
5. Disconnect networking. A failed save must keep the draft and show a safe error
   without a success message. Reconnect and retry. If initial loading fails, Retry
   must fetch the record before showing an editable form.
6. Sign out, sign in as test user B, and open Profile. A's name/draft must not
   appear. Editing B must not affect A. An old in-flight editor request must not
   display results or success feedback after switching accounts.
7. Signed-out access to `/profile` must return to the auth entry. Password-recovery
   sessions must finish their recovery flow before opening Profile.
8. On a phone, verify keyboard access, safe-area spacing and the raised snackbar.
   On web, verify successful-save toast placement and readable inline errors.
9. Open Change email, enter a different email and submit once. The current email
   must remain until confirmed; check both inboxes as required by project settings.
   Open links in the originating browser/app using its allowed callback URL.
   Reopen Profile after confirmation and sign in using the replacement email.
10. Change password with matching passwords of at least eight characters. If
    reauthentication is required, sign out/in and retry. On success, sign out and
    confirm only the new password works. Failure must clear password fields and
    show no success notification. Do not share passwords in chat.
11. Verify Today opens after sign-in, each of the five tabs responds, More opens
    Profile, Back returns to More, and sign-out prevents access to tabs/Profile.
    Repeat on web and iPhone; confirm the snackbar sits above the tab bar.

Record the tested platform and individual outcomes. A bundle export, mocked
service response or SQL ownership test is not proof of live app save/reopen.

## Preferences acceptance

1. Open **More → Preferences**. Confirm saved units/time zone load before editing.
2. Change each unit, time zone and opt-in value; save once. Reopen the screen
   and restart the app to confirm the database values persist.
3. Discard a draft or toggle a value back; unchanged values must not be saved.
   An invalid time zone must fail before a request.
4. Test a failed save offline: retain the draft, show no success and allow retry.
5. Repeat with another account: neither account's values may appear or change
   in the other. Signed-out and password-recovery access must be prevented.
6. Check tap targets, scrolling/keyboard and snackbar placement on iPhone/web;
   repeat on Android when available. Notification/gamification controls save
   preferences only; they do not enable reminder delivery or achievements.
