/**
 * This module provides simple XOR-based encryption and decryption using a key stored in localStorage.
 * **Security Note**: XOR encryption is not suitable for protecting sensitive data against determined attackers.
 * It is intended for basic obfuscation only. Additionally, storing the key in localStorage may expose it to
 * XSS attacks if the application is not properly secured.
 */

import { logger } from './logger';

/** Name of the encryption key stored in localStorage */
const ENCRYPTION_KEY_NAME = 'gemini-encryption-key';

/** Character set used for generating random encryption keys */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** Cached encryption key to avoid repeated localStorage access */
const key = getOrCreateKey();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function xorBytes(data: Uint8Array, keyBytes: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ keyBytes[i % keyBytes.length];
  }
  return result;
}

/**
 * Encrypts data using an XOR cipher and encodes the result in base64.
 * @param data - The string to encrypt.
 * @param key - The encryption key.
 * @returns The encrypted data as a base64-encoded string.
 */
function xorEncrypt(data: string, key: string): string {
  const dataBytes = new TextEncoder().encode(data);
  const keyBytes = new TextEncoder().encode(key);
  const encryptedBytes = xorBytes(dataBytes, keyBytes);
  return bytesToBase64(encryptedBytes);
}

/**
 * Decrypts base64-encoded encrypted data using an XOR cipher.
 * @param encryptedData - The base64-encoded encrypted string.
 * @param key - The encryption key.
 * @returns The decrypted string, or an empty string if decryption fails.
 */
function xorDecrypt(encryptedData: string, key: string): string {
  try {
    const dataBytes = base64ToBytes(encryptedData);
    const keyBytes = new TextEncoder().encode(key);
    const decryptedBytes = xorBytes(dataBytes, keyBytes);
    return new TextDecoder().decode(decryptedBytes);
  } catch (error) {
    logger.error('Decryption failed:', error);
    return '';
  }
}

/**
 * Retrieves an existing encryption key from localStorage or generates a new one.
 * @returns The encryption key as a 32-character string.
 */
function getOrCreateKey(): string {
  let key = localStorage.getItem(ENCRYPTION_KEY_NAME);
  if (!key) {
    key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(x => CHARS.charAt(x % CHARS.length))
      .join('');
    localStorage.setItem(ENCRYPTION_KEY_NAME, key);
  }
  return key;
}

/**
 * Encrypts the provided data using the stored encryption key.
 * @param data - The string to encrypt.
 * @returns A Promise resolving to the encrypted data as a base64-encoded string.
 */
export async function encryptData(data: string): Promise<string> {
  return xorEncrypt(data, key);
}

/**
 * Decrypts the provided encrypted data using the stored encryption key.
 * @param encryptedData - The base64-encoded encrypted string to decrypt.
 * @returns A Promise resolving to the decrypted string, or an empty string if decryption fails.
 */
export async function decryptData(encryptedData: string): Promise<string> {
  return xorDecrypt(encryptedData, key);
}
