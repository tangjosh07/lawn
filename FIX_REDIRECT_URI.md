# Fix: redirect_uri_mismatch Error

## The Problem
You're getting `Error 400: redirect_uri_mismatch` because the redirect URI your app sends doesn't exactly match what's configured in Google Cloud Console.

## Solution: Update Google Cloud Console

### Step 1: Check What Redirect URI Your App Is Using

The app uses: `https://lawn-chi.vercel.app/api/auth/google/callback`

**Important**: It must match EXACTLY (no trailing slashes, correct protocol, correct path).

### Step 2: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Click on your OAuth 2.0 Client ID (the one you're using)
5. Under **Authorized redirect URIs**, you should see a list

### Step 3: Add/Update the Redirect URI

Make sure you have EXACTLY this URI (copy-paste to avoid typos):

```
https://lawn-chi.vercel.app/api/auth/google/callback
```

**Critical points:**
- ✅ Must start with `https://` (not `http://`)
- ✅ No trailing slash at the end
- ✅ Exact path: `/api/auth/google/callback`
- ✅ Domain: `lawn-chi.vercel.app` (not `www.lawn-chi.vercel.app` or any other variation)

### Step 4: Remove Incorrect URIs

If you have any of these, **remove them** (they won't work):
- `http://lawn-chi.vercel.app/api/auth/google/callback` (wrong protocol)
- `https://lawn-chi.vercel.app/api/auth/google/callback/` (trailing slash)
- `https://www.lawn-chi.vercel.app/api/auth/google/callback` (www prefix)
- `https://lawn-chi.vercel.app/api/auth/google/callback/` (trailing slash)

### Step 5: Save

1. Click **SAVE** at the bottom
2. Wait a few seconds for changes to propagate

### Step 6: Test

1. Try signing in again
2. If it still doesn't work, wait 1-2 minutes (Google's changes can take a moment to propagate)

## Common Mistakes

❌ **Wrong protocol**: Using `http://` instead of `https://`
❌ **Trailing slash**: `...callback/` instead of `...callback`
❌ **Wrong domain**: Using `www.` or a different subdomain
❌ **Wrong path**: `/auth/google/callback` instead of `/api/auth/google/callback`
❌ **Typos**: Extra spaces, wrong characters

## Verify Your Vercel Environment Variables

Also make sure in Vercel:
1. Go to **Settings** > **Environment Variables**
2. Check that `BASE_URL` is set to: `https://lawn-chi.vercel.app`
3. No trailing slash!

## Still Not Working?

1. **Check Vercel logs**: Go to your deployment > **Functions** tab > Check for errors
2. **Double-check the URI**: Copy the exact URI from the error message (if shown) and compare
3. **Wait a few minutes**: Google's changes can take 1-5 minutes to propagate
4. **Clear browser cache**: Sometimes cached OAuth errors persist

## Debugging

If you want to see what redirect URI your app is actually sending, check the Vercel function logs. The app now logs the redirect URI for debugging.

