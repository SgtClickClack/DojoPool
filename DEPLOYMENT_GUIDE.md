# Dojo Pool - Vercel Deployment Guide

## Environment Variables Required for Production

Add these environment variables to your Vercel project settings:

### Frontend (Next.js) Environment Variables:

```
NEXTAUTH_URL=https://dojopool.com.au
NEXTAUTH_SECRET=[Generate with: openssl rand -base64 32]
GOOGLE_CLIENT_ID=[Your Google OAuth Client ID]
GOOGLE_CLIENT_SECRET=[Your Google OAuth Client Secret]
DATABASE_URL=[Production database connection string]
JWT_SECRET=[Generate with: openssl rand -base64 32]
NEXT_PUBLIC_API_URL=https://api.dojopool.com.au
API_URL=https://api.dojopool.com.au
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=[Your Mapbox token]
NODE_ENV=production
```

### Backend (NestJS) Environment Variables:

```
DATABASE_URL=[Production database connection string]
JWT_SECRET=[Same as frontend]
GOOGLE_CLIENT_ID=[Same as frontend]
GOOGLE_CLIENT_SECRET=[Same as frontend]
REDIS_URL=[Production Redis connection string]
NODE_ENV=production
PORT=3001
```

## Database Setup

1. **Create a production database** (recommended: PostgreSQL on Railway, Supabase, or PlanetScale)
2. **Update DATABASE_URL** to point to your production database
3. **Run migrations**: `npx prisma migrate deploy`

## Deployment Steps

1. **Commit all authentication files** to Git
2. **Push to main branch**
3. **Add environment variables** in Vercel dashboard
4. **Redeploy** the application

## Troubleshooting

- **404 errors**: Authentication routes not deployed - check if files are committed
- **500 errors**: Missing environment variables - check Vercel logs
- **Database errors**: Wrong DATABASE_URL or missing migrations
