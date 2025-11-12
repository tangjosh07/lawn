# Fixing 401 Errors on Vercel

## Check These Settings in Vercel Dashboard

### 1. Deployment Protection
The 401 error might be from Vercel's Deployment Protection:

1. Go to your Vercel project dashboard
2. Click **Settings** > **Deployment Protection**
3. Check if any of these are enabled:
   - **Password Protection**
   - **Vercel Authentication**
   - **Trusted IPs**
4. If any are enabled, **disable them temporarily** to test

### 2. Check Function Logs
1. Go to **Deployments** > Click on latest deployment
2. Click **Functions** tab
3. Click on the function that's returning 401
4. Check the **Logs** tab for error messages
5. Look for the console.log messages we added - they'll show the file paths

### 3. Verify Environment Variables
Make sure these are set in Vercel:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `BASE_URL` = `https://lawn-chi.vercel.app`

### 4. Check the Actual Error
The logs should now show:
- The file path it's trying to serve
- Any errors loading the file
- The project root directory

## Alternative: Check if it's a Routing Issue

The 401 might be happening because Vercel isn't routing to our function correctly. Check:

1. In Vercel dashboard, go to **Deployments**
2. Click on the deployment
3. Check the **Functions** tab - you should see `/api/index` listed
4. If it's not there, the routing might be wrong

## If Still Not Working

Try accessing the function directly:
- `https://lawn-chi.vercel.app/api/index`

If that works but `/` doesn't, it's a routing issue in `vercel.json`.

