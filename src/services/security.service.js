import CryptoJS from 'crypto-js';

// Use NEXTAUTH_SECRET as encryption key
const getEncryptionKey = () => process.env.NEXTAUTH_SECRET || 'fallback-key';

/**
 * Encrypt sensitive data (credentials) for temporary in-memory use
 */
export function encryptCredentials(data) {
  const key = getEncryptionKey();
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
}

/**
 * Decrypt credentials
 */
export function decryptCredentials(encryptedData) {
  const key = getEncryptionKey();
  const bytes = CryptoJS.AES.decrypt(encryptedData, key);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

/**
 * Sanitize input string — strip potential XSS
 */
export function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Mask email for logging: john@gmail.com -> j***@gmail.com
 */
export function maskEmail(email) {
  if (!email || typeof email !== 'string') return '***';
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  return `${local[0]}***@${domain}`;
}

/**
 * Simple in-memory rate limiter
 */
const rateLimitStore = new Map();

export function checkRateLimit(key, maxRequests = 100, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  record.count++;
  if (record.count > maxRequests) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }

  return { allowed: true, remaining: maxRequests - record.count };
}
