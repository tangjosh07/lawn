# Vercel Deployment Setup for Google OAuth

## Step 1: Set Environment Variables in Vercel

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your project (`lawn-chi`)
3. Go to **Settings** > **Environment Variables**
4. Add these variables:

```
BASE_URL=https://lawn-chi.vercel.app
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**Important**: Make sure `BASE_URL` is set to `https://lawn-chi.vercel.app` (your actual Vercel URL)

## Step 2: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   ```
   https://lawn-chi.vercel.app/api/auth/google/callback
   ```
5. Click **Save**

## Step 3: Redeploy

After updating environment variables and Google OAuth settings:

1. In Vercel dashboard, go to **Deployments**
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**

Or push a new commit to trigger a new deployment.

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in Google Console **exactly** matches: `https://lawn-chi.vercel.app/api/auth/google/callback`
- Check that `BASE_URL` environment variable is set correctly in Vercel

### Error: "Google OAuth not configured"
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in Vercel environment variables
- Make sure to redeploy after adding environment variables

### Still not working?
- Check Vercel function logs: **Deployments** > Click deployment > **Functions** tab
- Verify the redirect URI matches exactly (no trailing slashes, correct protocol)

