import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-char-key-change-this';

// Ensure key is exactly 32 bytes
const getKey = () => {
  const key = ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32);
  return Buffer.from(key, 'utf8');
};

/**
 * Encrypt text using AES-256-CBC
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted text in format: iv:encryptedData
 */
export const encrypt = (text) => {
  if (!text) return null;

  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt text using AES-256-CBC
 * @param {string} encryptedText - Text to decrypt in format: iv:encryptedData
 * @returns {string} - Decrypted text
 */
export const decrypt = (encryptedText) => {
  if (!encryptedText) return null;

  try {
    const [ivHex, encrypted] = encryptedText.split(':');

    if (!ivHex || !encrypted) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};
