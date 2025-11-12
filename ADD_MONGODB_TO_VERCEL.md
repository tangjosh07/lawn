# Add MONGODB_URI to Vercel - Quick Guide

## Your MongoDB Connection String

**Template (replace `<db_password>` with your actual password):**
```
mongodb+srv://jtang07:<db_password>@lawnlink.8dxmtk2.mongodb.net/lawnlink?retryWrites=true&w=majority
```

## Steps to Add to Vercel

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click your project** (lawn-chi or similar)
3. **Settings** → **Environment Variables**
4. **Click "Add New"**
5. **Fill in:**
   - **Name**: `MONGODB_URI`
   - **Value**: Your connection string (replace `<db_password>` with your real password)
   - **Environment**: Select all three:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
6. **Click "Save"**

## Redeploy

1. Go to **Deployments**
2. Click **⋯** (three dots) on the latest deployment
3. Click **Redeploy**

## Verify It's Working

After redeploy, check the logs:
1. Go to **Deployments** → Click latest deployment
2. Click **Functions** tab
3. Click on `/api/index`
4. Check **Logs** tab
5. Look for: `✅ Connected to MongoDB`

If you see that message, the database is connected! 🎉

## Example Connection String

If your password is `MyPassword123`, your connection string would be:
```
mongodb+srv://jtang07:MyPassword123@lawnlink.8dxmtk2.mongodb.net/lawnlink?retryWrites=true&w=majority
```

**Important:** 
- Replace `<db_password>` with your actual MongoDB Atlas password
- Make sure your MongoDB cluster allows connections from anywhere (0.0.0.0/0 in Network Access)
- The database name `/lawnlink` is already included in the connection string

