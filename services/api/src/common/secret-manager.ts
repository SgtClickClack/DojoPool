import * as fs from 'fs';

interface SecretConfig {
  required: string[];
  optional: string[];
  patterns: {
    [key: string]: RegExp;
  };
}

class SecretManager {
  private config: SecretConfig;
  private envPath: string;

  constructor(envPath: string = '.env') {
    this.envPath = envPath;
    this.config = {
      required: [
        'JWT_SECRET',
        'DATABASE_URL',
        'GOOGLE_OAUTH_CLIENT_ID',
        'GOOGLE_OAUTH_CLIENT_SECRET',
      ],
      optional: [
        'OPENAI_API_KEY',
        'MAPBOX_ACCESS_TOKEN',
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET',
      ],
      patterns: {
        JWT_SECRET: /^[A-Za-z0-9+/=]{32,}$/,
        DATABASE_URL: /^postgresql:\/\/.+/,
        GOOGLE_OAUTH_CLIENT_ID:
          /^[0-9]+-[A-Za-z0-9]+\.apps\.googleusercontent\.com$/,
        GOOGLE_OAUTH_CLIENT_SECRET: /^[A-Za-z0-9_-]{24,}$/,
        OPENAI_API_KEY: /^sk-[A-Za-z0-9]{48,}$/,
        MAPBOX_ACCESS_TOKEN: /^pk\.[A-Za-z0-9_-]{100,}$/,
      },
    };
  }

  /**
   * Validate all required secrets are present and properly formatted
   */
  validateSecrets(): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if .env file exists
    if (!fs.existsSync(this.envPath)) {
      errors.push(`Environment file ${this.envPath} not found`);
      return { valid: false, errors, warnings };
    }

    // Load environment variables
    const envContent = fs.readFileSync(this.envPath, 'utf8');
    const envVars = this.parseEnvFile(envContent);

    // Validate required secrets
    for (const secret of this.config.required) {
      if (!envVars[secret]) {
        errors.push(`Required secret ${secret} is missing`);
        continue;
      }

      // Validate format if pattern exists
      if (this.config.patterns[secret]) {
        if (!this.config.patterns[secret].test(envVars[secret])) {
          errors.push(`Secret ${secret} has invalid format`);
        }
      }
    }

    // Check optional secrets
    for (const secret of this.config.optional) {
      if (!envVars[secret]) {
        warnings.push(`Optional secret ${secret} is missing`);
      } else if (this.config.patterns[secret]) {
        if (!this.config.patterns[secret].test(envVars[secret])) {
          warnings.push(`Optional secret ${secret} has invalid format`);
        }
      }
    }

    // Check for placeholder values
    for (const [key, value] of Object.entries(envVars)) {
      if (this.isPlaceholderValue(value)) {
        errors.push(`Secret ${key} contains placeholder value: ${value}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate a secure JWT secret
   */
  generateJWTSecret(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Check if a value looks like a placeholder
   */
  private isPlaceholderValue(value: string): boolean {
    const placeholderPatterns = [
      /^(xxx|your-|changeme|test|dummy|sample|placeholder|example)/i,
      /^<.*>$/,
      /^\[.*\]$/,
      /^\{.*\}$/,
    ];

    return placeholderPatterns.some((pattern) => pattern.test(value));
  }

  /**
   * Parse .env file content
   */
  private parseEnvFile(content: string): { [key: string]: string } {
    const envVars: { [key: string]: string } = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    }

    return envVars;
  }

  /**
   * Create a secure .env template
   */
  createSecureTemplate(): string {
    const template = `# DojoPool Environment Configuration
# Generated on ${new Date().toISOString()}

# JWT Configuration
JWT_SECRET=${this.generateJWTSecret()}
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/dojopool

# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

# Optional AI Services
OPENAI_API_KEY=sk-your-openai-key-here
MAPBOX_ACCESS_TOKEN=pk.your-mapbox-token-here

# Optional Cloud Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Application Configuration
NODE_ENV=development
PORT=3002
FRONTEND_URL=http://localhost:3000
`;

    return template;
  }

  /**
   * Audit secrets for security issues
   */
  auditSecrets(): { secure: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!fs.existsSync(this.envPath)) {
      issues.push('Environment file not found');
      return { secure: false, issues };
    }

    const envContent = fs.readFileSync(this.envPath, 'utf8');
    const envVars = this.parseEnvFile(envContent);

    // Check for weak secrets
    for (const [key, value] of Object.entries(envVars)) {
      if (key.includes('SECRET') || key.includes('KEY')) {
        if (value.length < 16) {
          issues.push(
            `Secret ${key} is too short (${value.length} characters)`
          );
        }
        if (value === value.toLowerCase() || value === value.toUpperCase()) {
          issues.push(`Secret ${key} lacks mixed case`);
        }
        if (!/[0-9]/.test(value)) {
          issues.push(`Secret ${key} lacks numbers`);
        }
        if (!/[^A-Za-z0-9]/.test(value)) {
          issues.push(`Secret ${key} lacks special characters`);
        }
      }
    }

    return {
      secure: issues.length === 0,
      issues,
    };
  }
}

export default SecretManager;
