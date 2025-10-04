# 🚀 Dojo Pool - Production Deployment Checklist

## ✅ Immediate Actions Required

### 1. Environment Variables Setup

**Go to Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these variables:

```bash
# Authentication
NEXTAUTH_URL=https://dojopool.com.au
NEXTAUTH_SECRET=Q7zl3U1QEac+Yh80h0NTA7UsL4t0ytZwuJVjeesShFo=
JWT_SECRET=AZDnYUvXs8roa9IfGiXrvBicoAkBRMkFUUgz8DFT6a8=

# Google OAuth (Get from Google Cloud Console)
GOOGLE_CLIENT_ID=[Your Google OAuth Client ID]
GOOGLE_CLIENT_SECRET=[Your Google OAuth Client Secret]

# Database (CRITICAL - This is likely causing the 500 error)
DATABASE_URL=[Production PostgreSQL connection string]

# API Configuration
NEXT_PUBLIC_API_URL=https://api.dojopool.com.au
API_URL=https://api.dojopool.com.au

# Mapbox
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=[Your Mapbox token]

# Environment
NODE_ENV=production
```

### 2. Database Setup

**The 500 error is most likely due to missing DATABASE_URL**

Options:

- **Railway** (Recommended): Easy PostgreSQL setup
- **Supabase**: Free tier available
- **PlanetScale**: MySQL alternative
- **Neon**: PostgreSQL with free tier

**After setting up database:**

```bash
# Run migrations
npx prisma migrate deploy
```

### 3. Commit and Deploy

```bash
# Make sure all files are committed
git add .
git commit -m "fix: update Vercel config for App Router API routes"
git push origin main
```

### 4. Redeploy

- Go to Vercel Dashboard
- Click "Redeploy" on your latest deployment
- Or push a new commit to trigger automatic deployment

## 🔍 Troubleshooting Steps

### If you still get 404 errors:

1. Check Vercel Functions logs
2. Verify `app/api/auth/[...nextauth]/route.ts` is committed
3. Check if Vercel is using the correct build command

### If you still get 500 errors:

1. **Check Vercel Logs** (most important):
   - Go to Vercel Dashboard → Functions tab
   - Look for error details in the logs
   - Most likely: Missing DATABASE_URL or wrong connection string

2. **Verify Environment Variables**:
   - Make sure all variables are set correctly
   - Check for typos in variable names
   - Ensure DATABASE_URL points to a real database

3. **Database Connection**:
   - Test your DATABASE_URL locally
   - Make sure the database is accessible from Vercel
   - Run `npx prisma migrate deploy` on production database

## 📋 Post-Deployment Verification

1. **Test Authentication**:
   - Visit `https://dojopool.com.au/api/auth/session`
   - Should return JSON (not 404)

2. **Test User API**:
   - Visit `https://dojopool.com.au/api/users/me`
   - Should return 401 (unauthorized) or user data (not 500)

3. **Check Vercel Logs**:
   - Monitor Functions logs for any errors
   - Look for successful API calls

## 🎯 Expected Results

After completing these steps:

- ✅ `GET /api/auth/session` should return 200 (not 404)
- ✅ `GET /api/users/me` should return 401 or 200 (not 500)
- ✅ Authentication should work properly
- ✅ No more CLIENT_FETCH_ERROR in console

## 🆘 Still Having Issues?

If problems persist:

1. **Share Vercel Logs**: Copy the exact error from Functions tab
2. **Check Database**: Verify DATABASE_URL is working
3. **Test Locally**: Make sure everything works in development

The most critical step is setting up the production database and adding the DATABASE_URL environment variable to Vercel.
