# How to Make Google Sign-In Work for Everyone

## The Problem
If Google sign-in works for you but not for other people, your OAuth app is in **"Testing" mode**. In testing mode, only you (the developer) and explicitly added test users can sign in.

## Solution: Publish Your OAuth App

### Step 1: Go to OAuth Consent Screen
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **OAuth consent screen**

### Step 2: Complete Required Information
Make sure all required fields are filled:

**App Information:**
- App name: `LawnLink` (or your preferred name)
- User support email: Your email
- App logo: (Optional, but recommended)

**App Domain:**
- Application home page: `https://lawn-chi.vercel.app`
- Application privacy policy link: (Required for production)
  - You can create a simple privacy policy page or use a generator like:
  - https://www.freeprivacypolicy.com/
  - Example: `https://lawn-chi.vercel.app/privacy`
- Application terms of service link: (Required for production)
  - Example: `https://lawn-chi.vercel.app/terms`

**Authorized Domains:**
- Add: `vercel.app` and `lawn-chi.vercel.app`

**Developer Contact Information:**
- Your email address

### Step 3: Add Scopes
Make sure these scopes are added:
- `email`
- `profile`
- `openid`

### Step 4: Add Test Users (Temporary Solution)
If you can't publish immediately, you can add users as test users:

1. In the OAuth consent screen, scroll to **Test users**
2. Click **+ ADD USERS**
3. Add the email addresses of people who need access
4. Click **SAVE**

**Note**: Test users will receive an email and need to accept the invitation.

### Step 5: Publish the App (Permanent Solution)
1. Scroll to the bottom of the OAuth consent screen
2. Click **PUBLISH APP**
3. You may see a warning - click **CONFIRM**
4. Your app will be in "In production" status

### Step 6: Verification (If Required)
For some scopes, Google may require verification:
- If you see a verification notice, you'll need to submit your app for review
- This usually takes a few days
- For basic scopes (email, profile, openid), verification is often not required

## Quick Fix: Add Test Users
If you need immediate access for specific people:

1. Go to OAuth consent screen
2. Add their email addresses as test users
3. They'll receive an email invitation
4. Once they accept, they can sign in

## Important Notes

- **Testing Mode**: Only works for you and test users
- **Production Mode**: Works for everyone (may require verification)
- **Privacy Policy & Terms**: Required for production mode
- **Verification**: May be required for sensitive scopes, but usually not for basic email/profile

## After Publishing
Once published, anyone can sign in with Google without being added as a test user!

