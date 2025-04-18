# Authentication API

## Endpoints

### Register New User

```http
POST /auth/register
Content-Type: application/json

{
    "username": "newuser",
    "email": "user@example.com",
    "password": "secure_password"
}
```

**Response** (201 Created)

```json
{
  "id": 123,
  "username": "newuser",
  "email": "user@example.com",
  "created_at": "2024-01-17T12:00:00Z"
}
```

### Login

```http
POST /auth/login
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "secure_password"
}
```

**Response** (200 OK)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

### Refresh Token

```http
POST /auth/refresh
Authorization: Bearer <refresh_token>
```

**Response** (200 OK)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

### Logout

```http
POST /auth/logout
Authorization: Bearer <access_token>
```

**Response** (200 OK)

```json
{
  "message": "Successfully logged out"
}
```

### Password Reset Request

```http
POST /auth/password/reset-request
Content-Type: application/json

{
    "email": "user@example.com"
}
```

**Response** (200 OK)

```json
{
  "message": "Password reset instructions sent to email"
}
```

### Password Reset

```http
POST /auth/password/reset
Content-Type: application/json

{
    "token": "reset_token_from_email",
    "new_password": "new_secure_password"
}
```

**Response** (200 OK)

```json
{
  "message": "Password successfully reset"
}
```

## Error Responses

### Invalid Credentials (401 Unauthorized)

```json
{
  "error": "Invalid email or password",
  "code": "AUTH_INVALID_CREDENTIALS"
}
```

### Token Expired (401 Unauthorized)

```json
{
  "error": "Token has expired",
  "code": "AUTH_TOKEN_EXPIRED"
}
```

### Invalid Token (401 Unauthorized)

```json
{
  "error": "Invalid token",
  "code": "AUTH_INVALID_TOKEN"
}
```

### Email Already Exists (409 Conflict)

```json
{
  "error": "Email already registered",
  "code": "AUTH_EMAIL_EXISTS"
}
```

### Username Already Exists (409 Conflict)

```json
{
  "error": "Username already taken",
  "code": "AUTH_USERNAME_EXISTS"
}
```

@app.after_request
def add_security_headers(response): # HSTS with preload and includeSubDomains
response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload' # Prevent clickjacking
response.headers['X-Frame-Options'] = 'DENY' # Prevent MIME type sniffing
response.headers['X-Content-Type-Options'] = 'nosniff' # Comprehensive CSP policy
response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; block-all-mixed-content; upgrade-insecure-requests;" # XSS protection
response.headers['X-XSS-Protection'] = '1; mode=block' # Control referrer information
response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin' # Permissions policy
response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=(), payment=()'
return response
