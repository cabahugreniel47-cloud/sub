import crypto from 'crypto';

/**
 * Hash password securely with scrypt + unique random 16-byte salt
 * Output format: scrypt:<salt>:<hash>
 */
export function hashPassword(password: string): string {
  if (!password) return '';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

/**
 * Verify password against stored hash or legacy plaintext
 * Uses timingSafeEqual to protect against timing attacks
 */
export function verifyPassword(password: string, storedHashOrPlain: string): boolean {
  if (!password || !storedHashOrPlain) return false;

  if (storedHashOrPlain.startsWith('scrypt:')) {
    const parts = storedHashOrPlain.split(':');
    if (parts.length !== 3) return false;
    const [, salt, originalHash] = parts;
    try {
      const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
      const bufA = Buffer.from(originalHash, 'hex');
      const bufB = Buffer.from(computedHash, 'hex');
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  // Backwards compatibility for existing pre-migration passwords
  try {
    const a = Buffer.from(password);
    const b = Buffer.from(storedHashOrPlain);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return password === storedHashOrPlain;
  }
}
