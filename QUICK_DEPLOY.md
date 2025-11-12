# Quick Deployment Guide

Since Google doesn't recommend `localhost` for OAuth, here are the easiest options:

## 🚀 Option 1: ngrok (Quickest - 2 minutes)

### Step 1: Install ngrok
```bash
# Mac
brew install ngrok/ngrok/ngrok

# OR download from https://ngrok.com/download
```

### Step 2: Run the script
```bash
./start-with-ngrok.sh
```

This will:
- Start your server
- Create a public HTTPS URL
- Show you the URL to use

### Step 3: Update Google OAuth
1. Copy the ngrok URL shown (e.g., `https://abc123.ngrok.io`)
2. Go to Google Cloud Console > Credentials
3. Edit your OAuth client
4. Add redirect URI: `https://YOUR_NGROK_URL.ngrok.io/api/auth/google/callback`
5. Update `.env`:
   ```
   BASE_URL=https://YOUR_NGROK_URL.ngrok.io
   ```
6. Restart the script

**Note**: Free ngrok URLs change each restart. For a stable URL, sign up at https://dashboard.ngrok.com (free tier available).

---

## ☁️ Option 2: Deploy to Railway (Free & Permanent)

### Step 1: Sign up
Go to https://railway.app and sign up with GitHub

### Step 2: Deploy
1. Click "New Project"
2. "Deploy from GitHub repo" (or "Empty Project" to upload)
3. Connect your repository
4. Railway auto-detects Node.js and deploys

### Step 3: Set Environment Variables
In Railway dashboard:
- `GOOGLE_CLIENT_ID` = your client ID
- `GOOGLE_CLIENT_SECRET` = your secret
- `BASE_URL` = Railway provides this (e.g., `https://yourapp.railway.app`)

### Step 4: Update Google OAuth
- Redirect URI: `https://yourapp.railway.app/api/auth/google/callback`

**Done!** Your app is live with a permanent URL.

---

## 🎯 Option 3: Render (Also Free)

1. Sign up at https://render.com
2. "New" > "Web Service"
3. Connect GitHub or upload code
4. Set environment variables
5. Deploy

---

## Which Should You Choose?

- **ngrok**: Quick testing, URLs change each restart
- **Railway/Render**: Permanent URL, better for production, free tier available

For development/testing: Use **ngrok**
For production: Use **Railway** or **Render**

