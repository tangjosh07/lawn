# Quick Setup for Google Login

## Step 1: Restart Your Server

Stop your current server (Ctrl+C in the terminal where it's running) and restart it:

```bash
npm start
```

## Step 2: Set Up Google OAuth (Required)

The route exists, but you need Google OAuth credentials for it to work.

### Quick Setup:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/

2. **Create a Project** (or select existing)

3. **Enable APIs**:
   - Go to "APIs & Services" > "Library"
   - Enable "Google+ API" and "People API"

4. **Create OAuth Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Configure OAuth consent screen first (if prompted):
     - User Type: External
     - App name: LawnLink
     - Support email: your email
     - Scopes: Add `email`, `profile`, `openid`
   - Application type: **Web application**
   - Name: LawnLink
   - **Authorized redirect URIs**: 
     ```
     http://localhost:3001/api/auth/google/callback
     ```
   - Click "Create"
   - **Copy the Client ID and Client Secret**

5. **Create `.env` file** in the project root:

```bash
# Create .env file
cat > .env << EOF
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
BASE_URL=http://localhost:3001
EOF
```

Replace `your_client_id_here` and `your_client_secret_here` with your actual credentials.

6. **Restart the server**:
```bash
npm start
```

## Step 3: Test

Click the "Sign in" button in the header. It should redirect to Google's login page.

## Troubleshooting

- **"Cannot GET /api/auth/google"**: Server needs restart
- **500 Error**: Google credentials not set (create .env file)
- **Redirect URI mismatch**: Make sure the redirect URI in Google Console matches exactly: `http://localhost:3001/api/auth/google/callback`

