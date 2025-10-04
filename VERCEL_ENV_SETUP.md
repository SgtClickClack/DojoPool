# 🚀 Vercel Environment Variables Setup Guide

## 📋 Step-by-Step Instructions

### 1. Go to Vercel Dashboard
- Visit [vercel.com/dashboard](https://vercel.com/dashboard)
- Find your Dojo Pool project
- Click on it to open the project

### 2. Navigate to Environment Variables
- Click on **"Settings"** tab
- Click on **"Environment Variables"** in the left sidebar

### 3. Add Each Environment Variable
Click **"Add New"** for each variable below:

#### Database Connection
```
Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_x9SLhEQIBeb4@ep-young-water-aec7av9s.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
Environment: Production, Preview, Development
```

#### Google OAuth Credentials
```
Name: GOOGLE_CLIENT_ID
Value: 190541475829-odsekfe2psrqcp9l9pbemh0sua9t8vre.apps.googleusercontent.com
Environment: Production, Preview, Development
```

```
Name: GOOGLE_CLIENT_SECRET
Value: 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
Environment: Production, Preview, Development
```

#### NextAuth.js Configuration
```
Name: NEXTAUTH_URL
Value: https://dojopool.com.au
Environment: Production, Preview, Development
```

```
Name: NEXTAUTH_SECRET
Value: 2P+vB6D8tF/A?d(G+KbPeShVmYq3s6v9
Environment: Production, Preview, Development
```

#### Application JWT Secret
```
Name: JWT_SECRET
Value: z%C*F-JaNdRfUjXn2r5u8x/A?D(G+KbP
Environment: Production, Preview, Development
```

### 4. Additional Recommended Variables
Add these for complete functionality:

```
Name: NEXT_PUBLIC_API_URL
Value: https://api.dojopool.com.au
Environment: Production, Preview, Development
```

```
Name: API_URL
Value: https://api.dojopool.com.au
Environment: Production, Preview, Development
```

```
Name: NODE_ENV
Value: production
Environment: Production, Preview, Development
```

## 🔄 After Adding Variables

### 1. Redeploy Your Application
- Go to **"Deployments"** tab
- Click **"Redeploy"** on your latest deployment
- Or push a new commit to trigger automatic deployment

### 2. Test Your Application
After deployment, test these endpoints:

- **Authentication**: `https://dojopool.com.au/api/auth/session`
  - Should return JSON (not 404)
  
- **User API**: `https://dojopool.com.au/api/users/me`
  - Should return 401 (unauthorized) or user data (not 500)

## ✅ Expected Results

After adding these environment variables and redeploying:

- ✅ **404 errors fixed**: Authentication routes will work
- ✅ **500 errors fixed**: Backend API will connect to database
- ✅ **CLIENT_FETCH_ERROR fixed**: Frontend will connect successfully
- ✅ **Authentication working**: Users can sign in with Google
- ✅ **Database connected**: All API calls will work

## 🎯 Timeline

- **Adding Variables**: 5-10 minutes
- **Redeploy**: 2-3 minutes
- **Testing**: 2-3 minutes
- **Total**: ~15 minutes

Your application should be fully functional after completing these steps!
