/**
 * Types for the Encryption module
 */

export interface EncryptionOptions {
  secret?: string;
  salt?: string;
  rsaKeySize?: number;
  aesAlgorithm?: string;
  ivLength?: number;
  tagLength?: number;
  saltLength?: number;
  keyIterations?: number;
}

export interface RSAKeyPair {
  publicKey: string;
  privateKey: string;
}

export interface AESEncryptionResult {
  encrypted: string;
  iv: string;
  salt: string;
  tag?: string;
}

export interface CombinedEncryptionPayload {
  e: string; // encrypted data
  i: string; // iv
  s: string; // salt
  t?: string; // tag (for GCM mode)
  a: string; // algorithm
}

export interface E2EEPayload {
  encryptedKey: string;
  encryptedData: string;
  iv: string;
  tag: string;
}

export interface KeyDerivationResult {
  key: Buffer;
  salt: Buffer;
}

export interface DecryptionResult<T = unknown> {
  success: boolean;
  payload?: T;
  error?: string;
}

export interface UUIDVerificationResult {
  valid: boolean;
  expectedUUID: string;
}

export interface DecodeAndVerifyResult<T = unknown> {
  success: boolean;
  valid: boolean;
  payload?: T;
  expectedUUID?: string;
  error?: string;
}

export interface TokenMetadata {
  algorithm: string;
  ivLength: number;
  saltLength: number;
  hasAuthTag: boolean;
  encryptedDataLength: number;
}

export interface MetadataResult {
  success: boolean;
  metadata?: TokenMetadata;
  error?: string;
}

export interface VerifiablePayload<T = any> {
  encryptionKey: string;
  uuid: string;
  payload: T;
}

export type CurveType = 'prime256v1' | 'secp256k1' | 'prime384v1' | 'secp384r1';

export type AESAlgorithm = 'aes-128-gcm' | 'aes-192-gcm' | 'aes-256-gcm' | 'aes-256-cbc' | 'aes-128-cbc';

export type RSAKeySize = 1024 | 2048 | 4096;
