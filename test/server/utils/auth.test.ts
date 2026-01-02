import { describe, it, expect } from 'vitest';
import { 
  hashPassword, 
  verifyPassword, 
  isValidEmail, 
  isValidUsername, 
  isValidPassword,
  generateSessionId 
} from '../../../server/utils/auth';

describe('Authentication Utilities', () => {
  describe('Password Hashing', () => {
    it('should hash a password', () => {
      const password = 'mySecurePassword123';
      const hashed = hashPassword(password);
      
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed).toContain(':');
    });

    it('should generate different hashes for the same password', () => {
      const password = 'mySecurePassword123';
      const hash1 = hashPassword(password);
      const hash2 = hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should verify correct password', () => {
      const password = 'mySecurePassword123';
      const hashed = hashPassword(password);
      
      expect(verifyPassword(password, hashed)).toBe(true);
    });

    it('should reject incorrect password', () => {
      const password = 'mySecurePassword123';
      const hashed = hashPassword(password);
      
      expect(verifyPassword('wrongPassword', hashed)).toBe(false);
    });
  });

  describe('Session ID Generation', () => {
    it('should generate a session ID', () => {
      const sessionId = generateSessionId();
      
      expect(sessionId).toBeDefined();
      expect(sessionId.length).toBeGreaterThan(0);
    });

    it('should generate unique session IDs', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      
      expect(id1).not.toBe(id2);
    });
  });

  describe('Email Validation', () => {
    it('should accept valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('invalid@example')).toBe(false);
    });
  });

  describe('Username Validation', () => {
    it('should accept valid usernames', () => {
      expect(isValidUsername('user123')).toBe(true);
      expect(isValidUsername('john_doe')).toBe(true);
      expect(isValidUsername('testuser')).toBe(true);
    });

    it('should reject invalid usernames', () => {
      expect(isValidUsername('ab')).toBe(false); // Too short
      expect(isValidUsername('user name')).toBe(false); // Contains space
      expect(isValidUsername('user-name')).toBe(false); // Contains hyphen
      expect(isValidUsername('user@name')).toBe(false); // Contains special char
    });
  });

  describe('Password Validation', () => {
    it('should accept valid passwords', () => {
      expect(isValidPassword('password123')).toBe(true);
      expect(isValidPassword('mySecureP@ss')).toBe(true);
    });

    it('should reject invalid passwords', () => {
      expect(isValidPassword('short')).toBe(false); // Too short
      expect(isValidPassword('1234567')).toBe(false); // Too short
    });
  });
});
