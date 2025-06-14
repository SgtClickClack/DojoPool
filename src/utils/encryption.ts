import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

interface EncryptedData {
  encryptedData: string;
  iv: string;
  authTag: string;
}

export const encrypt = (text: string, key: Buffer): EncryptedData => {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key as any, iv as any);
  
  const jsonData = JSON.stringify({ data: text });
  
  const encrypted = Buffer.concat([
    cipher.update(jsonData, "utf8") as any,
    cipher.final() as any,
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return {
    encryptedData: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
};

export const decrypt = (encryptedData: EncryptedData, key: Buffer): string => {
  const decipher = createDecipheriv(
    ALGORITHM,
    key as any,
    Buffer.from(encryptedData.iv, "base64") as any
  );
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, "base64") as any);
  
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedData.encryptedData, "base64") as any) as any,
    decipher.final() as any,
  ]);
  
  const jsonData = JSON.parse(decrypted.toString("utf8"));
  return jsonData.data;
};
