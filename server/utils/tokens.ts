/**
 * API Token utilities
 * Handles token generation, hashing, and validation
 */

import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token
 * @returns A 32-byte token in base64url format (43 characters)
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Hash a token using SHA-256 for secure storage
 * @param token - The plaintext token to hash
 * @returns The hashed token as a hex string
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify a token against its hash
 * @param token - The plaintext token
 * @param hash - The stored hash to compare against
 * @returns True if the token matches the hash
 */
export function verifyToken(token: string, hash: string): boolean {
  const tokenHash = hashToken(token);
  return crypto.timingSafeEqual(
    Buffer.from(tokenHash),
    Buffer.from(hash)
  );
}
