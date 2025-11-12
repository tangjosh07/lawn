# Google OAuth Setup Instructions

To enable Google login, you need to set up OAuth credentials in Google Cloud Console.

## Steps:

1. **Go to Google Cloud Console**
   - Visit https://console.cloud.google.com/
   - Create a new project or select an existing one

2. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
   - Also enable "People API" (for user profile info)

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - If prompted, configure the OAuth consent screen first:
     - Choose "External" user type
     - Fill in app name, support email, developer contact
     - Add scopes: `email`, `profile`, `openid`
     - Add test users if in testing mode
   - Application type: "Web application"
   - Name: "LawnLink Web Client"
   - Authorized redirect URIs:
     - `http://localhost:3001/api/auth/google/callback` (for local development)
     - `https://yourdomain.com/api/auth/google/callback` (for production)
   - Click "Create"
   - Copy the **Client ID** and **Client Secret**

4. **Set Environment Variables**
   
   Create a `.env` file in the project root:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   BASE_URL=http://localhost:3001
   ```
   
   Or set them when running:
   ```bash
   GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy npm start
   ```

5. **Install dotenv (optional, for .env file support)**
   ```bash
   npm install dotenv
   ```
   
   Then add at the top of `server.js`:
   ```javascript
   require('dotenv').config();
   ```

## Testing

1. Start the server:
   ```bash
   npm start
   ```

2. Click the "Sign in" button in the header

3. You'll be redirected to Google's login page

4. After signing in, you'll be redirected back to the app

## Production Notes

- Update `BASE_URL` to your production domain
- Add your production redirect URI in Google Cloud Console
- Use environment variables or a secure secret manager (never commit credentials)
- Consider using httpOnly cookies instead of URL tokens for better security

