# Quick MongoDB Setup for Vercel

## Step 1: Get MongoDB Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up (free tier available)
3. Create a cluster (FREE M0 tier)
4. Create a database user (Database Access → Add New User)
5. Whitelist IP: Network Access → Add IP Address → "Allow Access from Anywhere" (0.0.0.0/0)
6. Get connection string: Database → Connect → Connect your application
7. Copy the connection string, it looks like:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
8. Add database name at the end:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/lawnlink?retryWrites=true&w=majority
   ```

## Step 2: Add to Vercel

1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add new variable:
   - **Name**: `MONGODB_URI`
   - **Value**: Your connection string (from Step 1)
   - **Environment**: Production, Preview, Development (select all)
4. Click **Save**

## Step 3: Redeploy

1. Go to **Deployments**
2. Click **⋯** on latest deployment
3. Click **Redeploy**

Or just push a new commit to trigger redeploy.

## That's it!

Your app will now:
- ✅ Save users to database
- ✅ Save groups to database
- ✅ Persist data across restarts
- ✅ Work properly with group creation

## Troubleshooting

**"Database unavailable" error:**
- Check that `MONGODB_URI` is set in Vercel
- Check that your MongoDB cluster is running
- Check that IP whitelist includes 0.0.0.0/0

**"Creator not found" error:**
- Make sure you're signed in
- Try signing out and signing in again
- Check Vercel logs for database connection errors

