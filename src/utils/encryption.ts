import CryptoJS from 'crypto-js';

// Default encryption key (should be from environment in production)
const DEFAULT_ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

/**
 * Encrypts data using AES encryption
 * @param data - The data to encrypt
 * @param key - Optional encryption key
 * @returns The encrypted string
 */
export function encryptData(data: string, key: string = DEFAULT_ENCRYPTION_KEY): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(data, key).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts data using AES decryption
 * @param encryptedData - The encrypted data to decrypt
 * @param key - Optional decryption key
 * @returns The decrypted string
 */
export function decryptData(encryptedData: string, key: string = DEFAULT_ENCRYPTION_KEY): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      throw new Error('Failed to decrypt data - invalid key or corrupted data');
    }
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hashes data using SHA-256
 * @param data - The data to hash
 * @returns The hashed string
 */
export function hashData(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

/**
 * Generates a random encryption key
 * @param length - The length of the key to generate
 * @returns A random hex string
 */
export function generateEncryptionKey(length: number = 32): string {
  return CryptoJS.lib.WordArray.random(length).toString();
}

/**
 * Verifies if encrypted data can be decrypted with a given key
 * @param encryptedData - The encrypted data
 * @param key - The key to test
 * @returns True if the key can decrypt the data
 */
export function verifyEncryption(encryptedData: string, key: string = DEFAULT_ENCRYPTION_KEY): boolean {
  try {
    decryptData(encryptedData, key);
    return true;
  } catch {
    return false;
  }
}
