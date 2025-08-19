# DojoPool Connection Issue Resolution

## Issue Summary

The "refused to connect" error occurs because the backend server is not running when the frontend tries to connect to it.

## Root Cause Analysis

1. **Frontend Configuration**: Next.js is configured to proxy API requests to `http://localhost:8080` (see `next.config.js`)
2. **Backend Server**: The backend server should run on port 8080 but is not currently running
3. **Service Dependencies**: The frontend depends on the backend being available for API calls

## Solution Steps

### 1. Start the Backend Server

Choose one of these options to start the backend:

#### Option A: Start Full Development Environment

```bash
npm run dev
```

This starts both frontend (Next.js on port 3000) and backend (minimal server on port 8080) concurrently.

#### Option B: Start Backend Only (Minimal)

```bash
npm run dev:backend:minimal
```

This starts only the minimal backend server on port 8080.

#### Option C: Start Backend Only (Full)

```bash
npm run dev:backend
```

This starts the full backend server with all features on port 8080.

### 2. Verify Backend is Running

After starting the backend, verify it's working:

1. **Check if port 8080 is in use:**

   ```bash
   netstat -an | findstr :8080
   ```

2. **Test health endpoint:**
   Open browser and go to: `http://localhost:8080/api/health`

   You should see a JSON response like:

   ```json
   {
     "status": "healthy",
     "timestamp": "2025-08-05T20:51:00.000Z",
     "uptime": 123.456,
     "pid": 12345
   }
   ```

### 3. Start Frontend (if not already running)

If you started only the backend, start the frontend separately:

```bash
npx next dev
```

## Troubleshooting

### If Backend Won't Start

1. **Check for port conflicts:**

   ```bash
   netstat -an | findstr :8080
   ```

   If port 8080 is already in use, either:
   - Kill the process using that port
   - Change the PORT environment variable: `set PORT=8081`

2. **Check for missing dependencies:**

   ```bash
   npm install
   ```

3. **Check for TypeScript compilation errors:**
   ```bash
   npm run type-check
   ```

### If Frontend Can't Connect to Backend

1. **Verify backend is running on port 8080**
2. **Check Next.js proxy configuration in `next.config.js`:**

   ```javascript
   async rewrites() {
     return [
       {
         source: '/api/:path*',
         destination: 'http://localhost:8080/api/:path*',
       },
     ];
   }
   ```

3. **Check browser network tab for failed requests**

### Alternative Backend Servers

If the main backend has issues, you can use:

1. **Minimal Backend** (`src/backend/index-minimal.ts`):
   - Simple Express server
   - Basic health check and venue management endpoints
   - Fewer dependencies

2. **Simple Backend** (`src/backend/index-simple.ts`):
   - Mid-level functionality
   - More features than minimal but fewer than full

## Environment Variables

Ensure these environment variables are set in `.env`:

```
NODE_ENV=development
PORT=8080
```

## Quick Fix Commands

```bash
# Install dependencies
npm install

# Start development environment (frontend + backend)
npm run dev

# Or start backend only
npm run dev:backend:minimal

# Test backend health
curl http://localhost:8080/api/health
```

## Files Modified/Created

- `test-backend-start.js` - Test script to verify backend startup
- `CONNECTION_ISSUE_RESOLUTION.md` - This resolution document

## Next Steps

1. Follow the solution steps above to start the backend server
2. Verify the connection is working by accessing the health endpoint
3. Test the frontend application to ensure API calls are working
4. If issues persist, check the troubleshooting section

The "refused to connect" error should be resolved once the backend server is running on port 8080.
