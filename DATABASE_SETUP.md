# Database Setup Guide

## MongoDB Atlas (Free & Recommended)

MongoDB Atlas offers a free tier that works perfectly with Vercel serverless functions.

### Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Create a new organization (or use default)
4. Create a new project (e.g., "LawnLink")

### Step 2: Create a Cluster

1. Click **"Build a Database"**
2. Choose **FREE** (M0) tier
3. Select a cloud provider and region (choose one close to you)
4. Click **"Create"**
5. Wait 3-5 minutes for cluster to be created

### Step 3: Create Database User

1. Go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `lawnlink-user` (or any name)
5. Password: Generate a secure password (save it!)
6. Database User Privileges: **"Read and write to any database"**
7. Click **"Add User"**

### Step 4: Whitelist IP Address

1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. For Vercel, click **"Allow Access from Anywhere"** (or add `0.0.0.0/0`)
4. Click **"Confirm"**

**Note**: For production, you can restrict to Vercel's IP ranges, but allowing from anywhere is fine for now.

### Step 5: Get Connection String

1. Go to **Database** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Driver: **Node.js**, Version: **5.5 or later**
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` with your database username
7. Replace `<password>` with your database password
8. Add a database name at the end:
   ```
   mongodb+srv://lawnlink-user:yourpassword@cluster0.xxxxx.mongodb.net/lawnlink?retryWrites=true&w=majority
   ```

### Step 6: Set Environment Variable

#### For Local Development (.env file):
```
MONGODB_URI=mongodb+srv://lawnlink-user:yourpassword@cluster0.xxxxx.mongodb.net/lawnlink?retryWrites=true&w=majority
```

#### For Vercel:
1. Go to your Vercel project dashboard
2. **Settings** > **Environment Variables**
3. Add:
   - Name: `MONGODB_URI`
   - Value: Your connection string (from Step 5)
   - Environment: Production, Preview, Development (select all)
4. Click **Save**
5. **Redeploy** your application

### Step 7: Install Dependencies

```bash
npm install
```

This will install `mongoose` which we added to `package.json`.

### Step 8: Test

1. Start your server: `npm start`
2. Check the console - you should see: `✅ Connected to MongoDB`
3. Try creating a user, group, or offer
4. Log out and log back in - your data should persist!

## What Gets Saved

- ✅ **Users**: Profile, email, Google ID, user type
- ✅ **Groups**: Name, ZIP, members, creator
- ✅ **Offers**: Provider offers with pricing
- ✅ **Messages**: Chat messages between users

## Troubleshooting

### "MONGODB_URI not set"
- Make sure you've added `MONGODB_URI` to your `.env` file (local) or Vercel environment variables (production)

### "Authentication failed"
- Check your database username and password in the connection string
- Make sure you've created a database user in MongoDB Atlas

### "IP not whitelisted"
- Go to Network Access in MongoDB Atlas
- Add `0.0.0.0/0` to allow from anywhere (or add Vercel's IP ranges)

### Connection timeout
- Check your cluster is running (should show "Active" in Atlas)
- Verify the connection string is correct
- Make sure your IP is whitelisted

## Alternative: Local MongoDB

If you want to run MongoDB locally:

1. Install MongoDB: https://www.mongodb.com/try/download/community
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/lawnlink`

## Notes

- The app will work without a database (falls back to in-memory storage)
- But data will be lost on server restart
- With MongoDB, all data persists permanently
- OAuth sessions stay in-memory (they're temporary anyway)

