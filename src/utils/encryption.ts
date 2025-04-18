import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

interface EncryptedData {
  iv: string;
  authTag: string;
  encryptedData: string;
}

export function encryptData(data: unknown, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const jsonData = JSON.stringify(data);
  const encrypted = Buffer.concat([
    cipher.update(jsonData, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  const result: EncryptedData = {
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    encryptedData: encrypted.toString("base64"),
  };

  return Buffer.from(JSON.stringify(result)).toString("base64");
}

export function decryptData(encryptedString: string, key: Buffer): unknown {
  const encryptedData: EncryptedData = JSON.parse(
    Buffer.from(encryptedString, "base64").toString("utf8"),
  );

  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(encryptedData.iv, "base64"),
  );

  decipher.setAuthTag(Buffer.from(encryptedData.authTag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedData.encryptedData, "base64")),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8"));
}
