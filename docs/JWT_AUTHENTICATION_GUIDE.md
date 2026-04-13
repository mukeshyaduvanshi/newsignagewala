# JWT Authentication System Documentation

## Overview
Complete JWT-based authentication system implemented in Next.js 14 with App Router, featuring secure token management and protected routes.

## Recent Bug Fix
**Issue**: Login form was failing with 401/400 errors
**Problem**: Parameter mismatch between frontend and backend
**Solution**: 
- Updated `AuthContext.login()` parameter from `email` to `emailOrPhone`
- Updated interface to match API expectations
- Added proper logging for debugging

```typescript
// Before (causing error)
login: (email: string, password: string) => Promise<void>;

// After (fixed)
login: (emailOrPhone: string, password: string) => Promise<void>;
```

## Authentication Flow

### 1. Signup Flow
```
User fills form → OTP verification → JWT tokens generated → Auto login → Redirect to /home
```

### 2. Login Flow  
```
User enters credentials → JWT tokens generated → Tokens stored → Redirect to /home
```

### 3. Protected Route Access
```
User visits protected route → Check access token → If expired, refresh → If refresh fails, redirect to login
```

## Token Management

### Access Token (15 minutes expiry)
- **Storage**: In-memory only (AuthContext state)
- **Usage**: Send with every API call
- **Security**: Never stored in localStorage/sessionStorage

### Refresh Token (7 days expiry)
- **Storage**: HTTP-only secure cookie
- **Usage**: Automatically used to refresh access tokens
- **Security**: Frontend cannot access, secure flags enabled

## API Authentication Guide

### How to Send Access Token with API Requests

#### Method 1: Using useAuth Hook (Recommended)
```typescript
"use client";
import { useAuth } from "@/lib/context/AuthContext";

function MyComponent() {
  const { accessToken } = useAuth();
  
  const fetchProtectedData = async () => {
    try {
      const response = await fetch('/api/protected-endpoint', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
    }
  };

  return (
    <button onClick={fetchProtectedData}>
      Fetch Protected Data
    </button>
  );
}
```

#### Method 2: With POST Request
```typescript
const { accessToken } = useAuth();

const createPost = async (postData) => {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData),
  });

  return response.json();
};
```

#### Method 3: Custom Hook for API Calls
```typescript
// hooks/useApi.ts
import { useAuth } from "@/lib/context/AuthContext";

export function useApi() {
  const { accessToken, refreshToken } = useAuth();

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Handle token refresh if needed
    if (response.status === 401) {
      const refreshSuccess = await refreshToken();
      if (refreshSuccess) {
        // Retry with new token
        return fetch(endpoint, {
          ...options,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
      }
    }

    return response;
  };

  return { apiCall };
}

// Usage
const { apiCall } = useApi();
const response = await apiCall('/api/protected-route');
```

## Backend API Route Protection

### How to Protect API Routes
```typescript
// app/api/protected-route/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Extract and verify access token
    const authHeader = req.headers.get('authorization');
    const accessToken = extractBearerToken(authHeader);

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "Access token required" },
        { status: 401 }
      );
    }

    const tokenPayload = verifyAccessToken(accessToken);
    if (!tokenPayload) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired access token" },
        { status: 401 }
      );
    }

    // Get user from token payload
    const user = await User.findById(tokenPayload.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Your protected logic here
    const protectedData = {
      message: "This is protected data",
      userId: user._id,
      userName: user.name,
    };

    return NextResponse.json({
      success: true,
      data: protectedData,
    });

  } catch (error) {
    console.error("Protected route error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## API Endpoints

### Authentication Endpoints
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/login` | POST | User login | ❌ |
| `/api/auth/create-user` | POST | User signup | ❌ |
| `/api/auth/refresh` | GET | Refresh access token | 🍪 Cookie |
| `/api/auth/me` | GET | Get current user data | ✅ Bearer Token |
| `/api/auth/logout` | POST | Logout user | 🍪 Cookie |
| `/api/auth/send-otp` | POST | Send OTP | ❌ |
| `/api/auth/verify-otp-temp` | POST | Verify OTP | ❌ |
| `/api/auth/check-existing` | POST | Check if user exists | ❌ |

### Request Examples

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "emailOrPhone": "user@example.com",
  "password": "password123"
}
```

#### Access Protected Route
```bash
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Frontend Route Protection

### Protected Pages
```typescript
// app/protected-page/page.tsx
"use client";
import { useProtectedRoute } from "@/lib/context/AuthContext";

export default function ProtectedPage() {
  const { user, isLoading } = useProtectedRoute();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Welcome {user?.name}</h1>
      <p>This is a protected page</p>
    </div>
  );
}
```

### Guest Pages (Login/Signup)
```typescript
// app/auth/login/page.tsx
"use client";
import { useGuestRoute } from "@/lib/context/AuthContext";

export default function LoginPage() {
  const { isLoading } = useGuestRoute(); // Redirects if already logged in

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <LoginForm />;
}
```

## Security Best Practices

### ✅ Implemented
- Access tokens stored in memory only
- Refresh tokens in HTTP-only cookies
- Automatic token refresh
- Secure cookie flags (production)
- Token rotation on refresh
- CORS protection
- Input validation

### 🔒 Cookie Security
```typescript
const refreshTokenCookie = serialize('refreshToken', refreshToken, {
  httpOnly: true,                    // Prevent XSS
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: 'lax',                  // CSRF protection
  maxAge: 7 * 24 * 60 * 60,         // 7 days
  path: '/',                        // Available site-wide
});
```

## Environment Variables

```env
# Required for JWT functionality
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
MONGODB_URI="your-mongodb-connection-string"
```

## Error Handling

### Common API Responses
```typescript
// Success Response
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com"
  }
}

// Error Response
{
  "success": false,
  "message": "Invalid credentials"
}

// 401 Unauthorized
{
  "success": false,
  "message": "Invalid or expired access token"
}
```

### Frontend Error Handling
```typescript
const { login } = useAuth();

try {
  await login(email, password);
  // Success - user is logged in and redirected
} catch (error) {
  // Error handling
  if (error.message.includes("verify")) {
    // User needs verification
    router.push("/auth/verify-otp");
  } else {
    // Show error message
    toast.error(error.message);
  }
}
```

## Usage Examples

### Complete Component with API Call
```typescript
"use client";
import { useAuth } from "@/lib/context/AuthContext";
import { useEffect, useState } from "react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  posts: Array<{
    id: string;
    title: string;
    content: string;
  }>;
}

export default function ProfilePage() {
  const { accessToken, user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!accessToken) return;

      try {
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setProfile(data.profile);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [accessToken]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{profile?.name}'s Profile</h1>
      <p>Email: {profile?.email}</p>
      <h2>Posts:</h2>
      {profile?.posts.map(post => (
        <div key={post.id}>
          <h3>{post.title}</h3>
          <p>{post.content}</p>
        </div>
      ))}
    </div>
  );
}
```

## Testing Authentication

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone": "test@example.com", "password": "password123"}'
```

### Test Protected Route
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Troubleshooting

### Common Issues
1. **401 Unauthorized**: Check if access token is being sent correctly
2. **Token expired**: Implement automatic refresh logic
3. **CORS errors**: Ensure credentials are included in requests
4. **Cookie not set**: Check secure flag in development vs production

### Debug Tips
```typescript
// Check if user is authenticated
const { user, accessToken } = useAuth();
console.log("User:", user);
console.log("Access Token:", accessToken ? "Present" : "Missing");

// Log API requests
const response = await fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
console.log("Response Status:", response.status);
```

---
**Created**: November 28, 2025
**Last Updated**: November 28, 2025
**Version**: 1.0.0