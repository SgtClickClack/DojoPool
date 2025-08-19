# DojoPool Authentication System

## Overview
This document describes the authentication system implemented for the DojoPool frontend application.

## Components Implemented

### 1. AuthContext (`src/contexts/AuthContext.tsx`)
- **Purpose**: Global authentication state management
- **Features**:
  - User authentication state
  - Login/logout functionality
  - Registration support
  - Token management
  - Loading states
  - Error handling

### 2. Login Page (`src/pages/login.tsx`)
- **Purpose**: User login form
- **Features**:
  - Email/password authentication
  - Form validation
  - Error display
  - Redirect to dashboard on success

### 3. Register Page (`src/pages/register.tsx`)
- **Purpose**: User registration form
- **Features**:
  - User registration with validation
  - Password confirmation
  - Redirect to login on success

### 4. Protected Route (`src/components/auth/ProtectedRoute.tsx`)
- **Purpose**: Route protection for authenticated users
- **Features**:
  - Redirects unauthenticated users to login
  - Loading state handling
  - Configurable redirect paths

### 5. Dashboard Page (`src/pages/dashboard.tsx`)
- **Purpose**: Protected dashboard for authenticated users
- **Features**:
  - User information display
  - Logout functionality
  - Navigation to other protected areas

### 6. Test Page (`src/pages/test-auth.tsx`)
- **Purpose**: Debug authentication state
- **Features**:
  - Display current auth state
  - Navigation to auth pages
  - Debug information

## API Integration

The authentication system integrates with the existing `ApiService` which provides:
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User authentication
- `GET /api/v1/auth/me` - Get current user
- JWT token management
- Automatic token inclusion in requests

## Testing the Authentication System

### 1. Start the Development Server
```bash
cd apps/web
npm run dev
```

### 2. Test the Authentication Flow

#### Step 1: Visit the Test Page
Navigate to `http://localhost:3000/test-auth` to see the current authentication state.

#### Step 2: Test Registration
1. Click "Go to Register" or navigate to `http://localhost:3000/register`
2. Fill out the registration form
3. Submit the form
4. You should be redirected to the login page with a success message

#### Step 3: Test Login
1. Navigate to `http://localhost:3000/login`
2. Enter your credentials
3. Submit the form
4. On successful authentication, you'll be redirected to the dashboard

#### Step 4: Test Protected Routes
1. After login, try accessing `http://localhost:3000/dashboard`
2. You should see the dashboard with your user information
3. Try accessing a protected route without authentication - you should be redirected to login

#### Step 5: Test Logout
1. From the dashboard, click the "Logout" button
2. You should be redirected to the login page
3. Try accessing the dashboard again - you should be redirected to login

### 3. Debug Information

The test page (`/test-auth`) shows:
- Current loading state
- Authentication status
- User information (if authenticated)
- Any authentication errors

## Backend Requirements

For the authentication system to work, the backend must provide:

1. **Registration Endpoint**: `POST /api/v1/auth/register`
   - Accepts: `firstName`, `lastName`, `email`, `username`, `password`
   - Returns: `{ success: boolean, message: string, user?: any }`

2. **Login Endpoint**: `POST /api/v1/auth/login`
   - Accepts: `email`, `password`
   - Returns: `{ success: boolean, message: string, token: string, user: any }`

3. **Current User Endpoint**: `GET /api/v1/auth/me`
   - Requires: `Authorization: Bearer <token>` header
   - Returns: User object

## Security Features

- JWT token storage in localStorage
- Automatic token inclusion in API requests
- Protected route redirection
- Token validation on app initialization
- Secure logout with token cleanup

## Error Handling

The system handles various error scenarios:
- Network errors
- Authentication failures
- Token expiration
- Invalid credentials
- Server errors

## Future Enhancements

- HTTP-only cookie support for production
- Refresh token implementation
- Remember me functionality
- Password reset capabilities
- Email verification
- Multi-factor authentication

## Troubleshooting

### Common Issues

1. **"Authentication temporarily disabled" error**
   - This indicates the backend is not running or not accessible
   - Ensure the backend server is running on the expected port

2. **CORS errors**
   - Check that the backend allows requests from `http://localhost:3000`
   - Verify the API URL in the environment configuration

3. **Token not being stored**
   - Check browser console for localStorage errors
   - Verify the token is being returned by the backend

4. **Protected routes not working**
   - Ensure the AuthProvider is wrapping the app in `_app.tsx`
   - Check that the useAuth hook is being used correctly

### Debug Steps

1. Open browser developer tools
2. Check the Console tab for errors
3. Check the Network tab for failed API requests
4. Use the test page (`/test-auth`) to verify authentication state
5. Check localStorage for stored tokens
