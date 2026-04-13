import jwt from 'jsonwebtoken';
import { JWTPayload, RefreshTokenPayload } from '@/types/auth.types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';

/**
 * Generate Access Token (short-lived - 1 day)
 */
export function generateAccessToken(userId: string, email: string, userType: string): string {
  const payload: JWTPayload = {
    userId,
    email,
    userType,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1d', // 1 day (24 hours)
    issuer: 'signagewala-app',
    audience: 'signagewala-users',
  });
}

/**
 * Generate Refresh Token (long-lived - 7 days)
 */
export function generateRefreshToken(userId: string, userType: string): string {
  const tokenId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  const payload: RefreshTokenPayload = {
    userId,
    tokenId,
    userType,
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: '7d', // 7 days
    issuer: 'signagewala-app',
    audience: 'signagewala-users',
  });
}

/**
 * Verify Access Token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'signagewala-app',
      audience: 'signagewala-users',
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    console.error('Access token verification failed:', error);
    return null;
  }
}

/**
 * Verify Refresh Token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'signagewala-app',
      audience: 'signagewala-users',
    }) as RefreshTokenPayload;

    return decoded;
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    return null;
  }
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Generate token pair (access + refresh)
 */
export function generateTokenPair(userId: string, email: string, userType: string) {
  return {
    accessToken: generateAccessToken(userId, email, userType),
    refreshToken: generateRefreshToken(userId, userType),
  };
}