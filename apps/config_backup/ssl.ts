import { type SecureContextOptions, type SecureVersion } from 'tls';
import fs from 'fs';
import path from 'path';

interface SSLConfig extends Omit<SecureContextOptions, 'minVersion'> {
  enabled: boolean;
  port: number;
  redirectHttps: boolean;
  preferHttps: boolean;
  minVersion: SecureVersion;
  cipherSuites: string[];
  requestCert?: boolean;
  rejectUnauthorized?: boolean;
  sessionTimeout?: number;
  sessionIdContext?: string;
  enableOCSPStapling?: boolean;
}

const defaultCipherSuites = [
  'TLS_AES_128_GCM_SHA256',
  'TLS_AES_256_GCM_SHA384',
  'TLS_CHACHA20_POLY1305_SHA256',
  'ECDHE-ECDSA-AES128-GCM-SHA256',
  'ECDHE-RSA-AES128-GCM-SHA256',
  'ECDHE-ECDSA-AES256-GCM-SHA384',
  'ECDHE-RSA-AES256-GCM-SHA384',
  'ECDHE-ECDSA-CHACHA20-POLY1305',
  'ECDHE-RSA-CHACHA20-POLY1305',
];

export const sslConfig: SSLConfig = {
  enabled: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.HTTPS_PORT || '443', 10),
  redirectHttps: true,
  preferHttps: true,
  minVersion: 'TLSv1.3' as SecureVersion,
  cipherSuites: defaultCipherSuites,

  // SSL certificate paths (load only in production)
  ...(process.env.NODE_ENV === 'production' && {
    cert: fs.readFileSync(path.join(process.cwd(), 'ssl', 'cert.pem')),
    key: fs.readFileSync(path.join(process.cwd(), 'ssl', 'key.pem')),
    ca: fs.readFileSync(path.join(process.cwd(), 'ssl', 'chain.pem')),
  }),

  // Additional security options
  requestCert: false,
  rejectUnauthorized: true,

  // Session options
  sessionTimeout: 300,
  sessionIdContext: 'dojopool',

  // OCSP Stapling
  enableOCSPStapling: true,
};

// Helper function to validate SSL configuration
export function validateSSLConfig(config: SSLConfig): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  const requiredFiles = ['cert.pem', 'key.pem', 'chain.pem'];
  const sslDir = path.join(process.cwd(), 'ssl');

  // Check if SSL directory exists
  if (!fs.existsSync(sslDir)) {
    throw new Error('SSL directory not found');
  }

  // Check if required files exist
  for (const file of requiredFiles) {
    const filePath = path.join(sslDir, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Required SSL file not found: ${file}`);
    }
  }

  // Validate cipher suites
  if (!config.cipherSuites || config.cipherSuites.length === 0) {
    throw new Error('No cipher suites configured');
  }

  // Validate TLS version
  if (!config.minVersion || config.minVersion < 'TLSv1.2') {
    throw new Error('Minimum TLS version must be 1.2 or higher');
  }

  return true;
}
