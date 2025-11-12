# Deployment Options for Google OAuth

Google doesn't recommend using `localhost` for OAuth. Here are your options:

## Option 1: ngrok (Easiest for Development) ⭐ Recommended

ngrok creates a public HTTPS URL that tunnels to your localhost.

### Setup:

1. **Install ngrok** (if not already installed):
   ```bash
   brew install ngrok/ngrok/ngrok
   # OR download from https://ngrok.com/download
   ```

2. **Sign up for free ngrok account** (optional but recommended):
   - Go to https://dashboard.ngrok.com/signup
   - Get your authtoken
   - Run: `ngrok config add-authtoken YOUR_TOKEN`

3. **Start server with ngrok**:
   ```bash
   ./start-with-ngrok.sh
   ```
   
   Or manually:
   ```bash
   # Terminal 1: Start your server
   npm start
   
   # Terminal 2: Start ngrok
   ngrok http 3001
   ```

4. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`)

5. **Update Google OAuth**:
   - Go to Google Cloud Console
   - Update redirect URI to: `https://YOUR_NGROK_URL.ngrok.io/api/auth/google/callback`
   - Update `.env` file:
     ```
     BASE_URL=https://YOUR_NGROK_URL.ngrok.io
     ```

**Note**: Free ngrok URLs change each time you restart. For a stable URL, upgrade to a paid plan or use Option 2.

---

## Option 2: Deploy to Cloud Platform (Best for Production)

### Railway (Easiest)

1. **Sign up**: https://railway.app
2. **New Project** > **Deploy from GitHub** (or upload code)
3. **Add Environment Variables**:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `BASE_URL` (Railway will provide this)
4. **Update Google OAuth redirect URI** to Railway URL

### Render

1. **Sign up**: https://render.com
2. **New Web Service**
3. **Connect GitHub** or upload code
4. **Set environment variables**
5. **Deploy**

### Vercel (For frontend + serverless)

1. **Sign up**: https://vercel.com
2. **Import project**
3. **Configure serverless functions**

---

## Option 3: Use Your Public IP (Not Recommended)

If you're on a local network, you can use your machine's IP:

1. **Find your IP**:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   # OR
   ipconfig getifaddr en0
   ```

2. **Update `.env`**:
   ```
   BASE_URL=http://YOUR_IP:3001
   ```

3. **Update Google OAuth redirect URI**

**Note**: This only works on your local network, not from the internet.

---

## Quick Start with ngrok

Run this script to automatically start everything:

```bash
./start-with-ngrok.sh
```

Then update your Google OAuth redirect URI with the ngrok URL shown.

