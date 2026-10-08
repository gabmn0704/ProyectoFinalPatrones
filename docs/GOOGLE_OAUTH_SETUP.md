# Google OAuth Setup Guide

This document describes how to set up Google OAuth sign-in for EpiSafe AI using Supabase authentication.

> **Current beta behavior:** Google and Supabase sign-in are temporarily turned off in the app. Sign-in asks only for a name and stores demo data in this browser. The Supabase client configuration is retained; OAuth setup steps below are for a future reactivation.

## Overview

EpiSafe AI uses Supabase for authentication and data management. Users can sign in using:
1. Email and password (traditional account)
2. Google OAuth (via Google credentials)

Both methods create isolated user sessions where each person only sees their own health data.

## Prerequisites

- A Google Cloud Console project
- A Supabase project (already created for EpiSafe AI)
- Admin access to both consoles
- The main project deployed to Netlify

## Step 1: Create OAuth Client in Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select the EpiSafe AI project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth Client ID**
5. Choose **Application type: Web application**
6. Name it: "EpiSafe Supabase Web OAuth"
7. Add Authorized redirect URIs:
   ```
   https://<your-supabase-project-id>.supabase.co/auth/v1/callback
   ```
   Example: `https://devtfvejnrtphnlymrmq.supabase.co/auth/v1/callback`
8. Click **Create**
9. Copy the **Client ID** and **Client Secret** (visible only once)

## Step 2: Configure Google Provider in Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select the **episafe-ai** project
3. Navigate to **Authentication** → **Providers**
4. Click on **Google** to expand settings
5. Enable the toggle if not already enabled
6. Paste the **Client ID** from Google Cloud into the "Client IDs" field
7. Paste the **Client Secret** from Google Cloud into the "Client Secret (for OAuth)" field
8. Verify the **Callback URL** matches your redirect URI (auto-filled)
9. Click **Save**

**Note:** Google OAuth configuration can take 5-60 minutes to propagate globally.

## Step 3: Configure Supabase Redirect URLs

1. In Supabase, open **Authentication** → **URL Configuration**
2. Set **Site URL** to the production app URL:
   ```
   https://episafe-ai-gabmn0704.netlify.app
   ```
3. Add the OAuth callback route to **Redirect URLs**:
   ```
   https://episafe-ai-gabmn0704.netlify.app/auth/callback
   ```
   A wildcard such as `https://episafe-ai-gabmn0704.netlify.app/**` also permits this route.
4. Save the changes.

The Google Cloud **Authorized redirect URI** remains the Supabase callback URL from Step 1. Do not replace it with the Netlify URL.

## Step 4: Add Test Users (For Development)

When Google OAuth is in development mode, only test users can authenticate:

1. In Google Cloud Console, navigate to the OAuth consent screen
2. Add test user email addresses (your email, team members, etc.)
3. These users can now test the sign-in flow

## Step 5: Frontend Integration

The frontend (`frontend/src/App.tsx`) already includes:
- A "Continue with Google" button in the AuthScreen component
- Integration with Supabase's `signInWithOAuth()` method
- Automatic session management and data isolation via Row Level Security (RLS)

### How It Works

1. User clicks "Continue with Google" button
2. Browser redirects to Google's OAuth consent screen
3. User approves, Google redirects back to Supabase callback
4. Supabase redirects to `/auth/callback` on the Netlify site with a one-time code
5. The frontend exchanges the code for a Supabase session
6. Row Level Security (RLS) policies ensure user only sees their data

## Environment Variables

No additional environment variables are needed. Supabase handles Google OAuth configuration server-side.

The frontend requires:
```
VITE_SUPABASE_URL=https://devtfvejnrtphnlymrmq.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

These are already configured in Netlify environment settings.

## Database Schema & Row Level Security

All tables in the Supabase schema include RLS policies that enforce user isolation:

```sql
-- Example RLS policy: users can only see their own data
CREATE POLICY "Users can view their own daily logs"
  ON daily_logs FOR SELECT
  USING (auth.uid() = user_id);
```

This means:
- Google OAuth users create a new `auth.users` row automatically
- Their `auth.uid()` is used to isolate their health records
- The `full_name` from Google profile is stored in user metadata
- Each user's dashboard only displays their personal data

## Deployment to Netlify

The Netlify deployment (`netlify.toml`) includes:
- Build settings that inject `VITE_SUPABASE_*` environment variables
- GitHub Actions workflow for continuous deployment
- Environment variables configured in Netlify UI

### Deploying Changes

```bash
# Build locally
npm run build

# Deploy to Netlify (automatic on push to main, or manual)
netlify deploy --prod
```

The deployment is automatic via GitHub Actions when you push to the `main` branch.

## Testing Google OAuth Locally

To test Google OAuth on your local machine:

1. Start the dev server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open `http://localhost:5173`

3. Click "Continue with Google"

4. If Google OAuth is configured, you'll be redirected to Google's consent screen

5. After approval, you'll return to the app and be logged in

**Note:** If you're not in the Google OAuth test users list, you may see an error. Add your email to the consent screen in Google Cloud Console.

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
- Verify the Redirect URI in Google Cloud Console exactly matches the Supabase callback URL
- No trailing slashes, exact protocol (https), and exact domain

### "Unable to exchange external code"
- This means Supabase received Google's authorization code but could not exchange it for Google tokens. It is different from the application's Supabase redirect allow-list.
- In Google Cloud Console → **APIs & Services** → **Credentials**, open the **Web application** OAuth client used by Supabase.
- Confirm its Authorized redirect URI is exactly `https://devtfvejnrtphnlymrmq.supabase.co/auth/v1/callback`.
- In Supabase → **Authentication** → **Providers** → **Google**, verify the Client ID and current Client Secret both belong to that same OAuth client. If uncertain, create a new client secret and replace the value in Supabase, then save.
- A short suffix such as `4/0A` is only a prefix of Google's one-time authorization code, not the underlying cause.
- Never share the client secret in screenshots, chat, or source control.

### "Google OAuth provider not enabled"
- Confirm the toggle is ON in Supabase → Authentication → Providers → Google
- Wait 5-60 minutes for configuration to propagate

### Test user not recognized
- Add your email to the OAuth consent screen in Google Cloud Console
- Only test users can authenticate in development mode

### User created but no profile name
- Google profile data is stored in `user_metadata` by Supabase
- The frontend reads `user.user_metadata.full_name` to display the user's name
- If not shown, the user may need to re-authenticate

## Going to Production

When ready to deploy EpiSafe AI for real users:

1. Change Google OAuth consent screen from **External** to **Internal** (or production mode)
2. Publish the app to production
3. Users can then authenticate with any Google account (no test user list required)

## Related Documentation

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup Guide](https://developers.google.com/identity/protocols/oauth2)
- [EpiSafe Deployment Guide](./deployment.md)
- [Database Schema](../backend/supabase/schema.sql)
