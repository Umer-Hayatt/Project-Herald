# Google sign-in diagnosis — 17 October 2026

The public site now sends readers to the correct production callback. Supabase's default URL also points to production, so the earlier localhost setting has been corrected.

Recent real provider callback logs reported invalid_client. Google's official OAuth guide defines this as an incorrect OAuth client secret and recommends reviewing the client ID/secret pair:
https://developers.google.com/identity/protocols/oauth2/web-server#invalid-client

Human repair: open Google Cloud > Google Auth Platform > Clients (or APIs & Services > Credentials), select the Herald Web application client, and copy its matching client ID and client secret into the Google provider in https://supabase.com/dashboard/project/hnzwraiojsftuncridsp/auth/providers. Save and start a fresh sign-in from https://project-herald-pink.vercel.app/login. Keep credentials out of chat, repository, and logs.

A separate Herald bug mapped every callback containing an error to the cancellation message. A browser regression reproduced a server error landing on /login?error=cancelled. The fix reserves cancellation for a plain access_denied response; provider/state errors use a generic failure notice with retry. Unknown error descriptions are never reflected into the page.

The credential configuration remains a human setup task. Passing callback regression tests does not establish a successful real Google sign-in.
