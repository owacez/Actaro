# Profile testing

Updated: 2026-10-10. v0.1 Profile / Preferences remains IN_PROGRESS.

## Current scope

Sign in, select **Edit profile** from Your Account, and edit the optional display
name. Leave it blank to clear it. Save uses the existing authenticated Supabase
service; only `display_name` is updated. Email/password remain managed by Auth.
No new environment variable, schema migration or API credential is required.

The user authorized existing verified components after Figma MCP hit its Starter
call limit. This functional editor does not establish exact Profile visual parity.
Preferences controls are a separate task. Browser automation could not initialize,
so no interactive visual or live authenticated persistence pass is claimed.

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

Record the tested platform and individual outcomes. A bundle export, mocked
service response or SQL ownership test is not proof of live app save/reopen.
