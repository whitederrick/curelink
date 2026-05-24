import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getEncryptionKey() {
  const rawKey = process.env.ENCRYPTION_KEY;

  if (!rawKey) {
    throw new Error('ENCRYPTION_KEY is required for sensitive data encryption.');
  }

  const key = /^[a-f0-9]{64}$/i.test(rawKey)
    ? Buffer.from(rawKey, 'hex')
    : Buffer.from(rawKey, 'base64');

  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must decode to exactly 32 bytes.');
  }

  return key;
}

export function encryptSensitiveData(text: string): string {
  if (!text) {
    throw new Error('Cannot encrypt empty sensitive data.');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    'v1',
    iv.toString('base64url'),
    encrypted.toString('base64url'),
    authTag.toString('base64url'),
  ].join(':');
}

export function decryptSensitiveData(encryptedData: string): string {
  const [version, ivText, encryptedText, authTagText] = encryptedData.split(':');

  if (version !== 'v1' || !ivText || !encryptedText || !authTagText) {
    throw new Error('Invalid encrypted sensitive data format.');
  }

  const iv = Buffer.from(ivText, 'base64url');
  const encrypted = Buffer.from(encryptedText, 'base64url');
  const authTag = Buffer.from(authTagText, 'base64url');
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);

  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
