export interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  apiUrl: string;
  websocketUrl: string;
  googleMapsApiKey: string;
  analyticsEnabled: boolean;
  serviceWorkerEnabled: boolean;
  securityEnabled: boolean;
  compressionEnabled: boolean;
  cdnEnabled: boolean;
  monitoringEnabled: boolean;
}

export interface EnvironmentConfig {
  development: Partial<DeploymentConfig>;
  staging: Partial<DeploymentConfig>;
  production: Partial<DeploymentConfig>;
}

export interface BuildConfig {
  outputDir: string;
  publicPath: string;
  sourceMap: boolean;
  minify: boolean;
  compress: boolean;
  analyze: boolean;
}

export class DeploymentManager {
  private static instance: DeploymentManager;
  private config: DeploymentConfig;
  private environment: string;

  private constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.config = this.loadConfiguration();
  }

  static getInstance(): DeploymentManager {
    if (!DeploymentManager.instance) {
      DeploymentManager.instance = new DeploymentManager();
    }
    return DeploymentManager.instance;
  }

  private loadConfiguration(): DeploymentConfig {
    const baseConfig: DeploymentConfig = {
      environment: 'development',
      apiUrl: 'http://localhost:8080',
      websocketUrl: 'http://localhost:8080',
      googleMapsApiKey: '',
      analyticsEnabled: false,
      serviceWorkerEnabled: false,
      securityEnabled: true,
      compressionEnabled: false,
      cdnEnabled: false,
      monitoringEnabled: false
    };

    const environmentConfigs: EnvironmentConfig = {
      development: {
        environment: 'development',
        apiUrl: 'http://localhost:8080',
        websocketUrl: 'http://localhost:8080',
        analyticsEnabled: false,
        serviceWorkerEnabled: false
      },
      staging: {
        environment: 'staging',
        apiUrl: 'https://staging-api.dojopool.com',
        websocketUrl: 'wss://staging-api.dojopool.com',
        analyticsEnabled: true,
        serviceWorkerEnabled: true,
        securityEnabled: true,
        compressionEnabled: true,
        cdnEnabled: true,
        monitoringEnabled: true
      },
      production: {
        environment: 'production',
        apiUrl: 'https://api.dojopool.com',
        websocketUrl: 'wss://api.dojopool.com',
        analyticsEnabled: true,
        serviceWorkerEnabled: true,
        securityEnabled: true,
        compressionEnabled: true,
        cdnEnabled: true,
        monitoringEnabled: true
      }
    };

    const envConfig = environmentConfigs[this.environment as keyof EnvironmentConfig] || {};
    return { ...baseConfig, ...envConfig };
  }

  // Get current configuration
  getConfig(): DeploymentConfig {
    return { ...this.config };
  }

  // Update configuration
  updateConfig(updates: Partial<DeploymentConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  // Check if feature is enabled
  isFeatureEnabled(feature: keyof DeploymentConfig): boolean {
    return !!this.config[feature];
  }

  // Get environment-specific value
  getEnvironmentValue<T>(key: keyof DeploymentConfig): T {
    return this.config[key] as T;
  }

  // Validate configuration
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.apiUrl) {
      errors.push('API URL is required');
    }

    if (!this.config.websocketUrl) {
      errors.push('WebSocket URL is required');
    }

    if (this.config.environment === 'production' && !this.config.googleMapsApiKey) {
      errors.push('Google Maps API key is required for production');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Generate environment variables
  generateEnvVars(): Record<string, string> {
    return {
      NODE_ENV: this.config.environment,
      REACT_APP_API_URL: this.config.apiUrl,
      REACT_APP_WEBSOCKET_URL: this.config.websocketUrl,
      REACT_APP_GOOGLE_MAPS_API_KEY: this.config.googleMapsApiKey,
      REACT_APP_ANALYTICS_ENABLED: this.config.analyticsEnabled.toString(),
      REACT_APP_SERVICE_WORKER_ENABLED: this.config.serviceWorkerEnabled.toString(),
      REACT_APP_SECURITY_ENABLED: this.config.securityEnabled.toString(),
      REACT_APP_COMPRESSION_ENABLED: this.config.compressionEnabled.toString(),
      REACT_APP_CDN_ENABLED: this.config.cdnEnabled.toString(),
      REACT_APP_MONITORING_ENABLED: this.config.monitoringEnabled.toString()
    };
  }

  // Generate build configuration
  generateBuildConfig(): BuildConfig {
    return {
      outputDir: 'build',
      publicPath: this.config.cdnEnabled ? 'https://cdn.dojopool.com' : '/',
      sourceMap: this.config.environment === 'development',
      minify: this.config.environment !== 'development',
      compress: this.config.compressionEnabled,
      analyze: this.config.environment === 'development'
    };
  }

  // Generate nginx configuration
  generateNginxConfig(): string {
    const config = this.getConfig();
    
    return `
server {
    listen 80;
    server_name dojopool.com www.dojopool.com;
    
    # Redirect HTTP to HTTPS in production
    ${config.environment === 'production' ? `
    return 301 https://$server_name$request_uri;
    ` : ''}
}

${config.environment === 'production' ? `
server {
    listen 443 ssl http2;
    server_name dojopool.com www.dojopool.com;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/dojopool.crt;
    ssl_certificate_key /etc/ssl/private/dojopool.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' ${config.apiUrl} ${config.websocketUrl};";
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Static Files
    location / {
        root /var/www/dojopool;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API Proxy
    location /api/ {
        proxy_pass ${config.apiUrl};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket Proxy
    location /socket.io/ {
        proxy_pass ${config.websocketUrl};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
` : ''}
`;
  }

  // Generate Docker configuration
  generateDockerConfig(): { dockerfile: string; dockerCompose: string } {
    const dockerfile = `
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;

    const dockerCompose = `
version: '3.8'

services:
  dojopool-frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=${this.config.environment}
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - dojopool-backend

  dojopool-backend:
    image: dojopool/backend:latest
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=${this.config.environment}
      - DATABASE_URL=${process.env.DATABASE_URL || 'postgresql://localhost/dojopool'}
    volumes:
      - ./logs:/app/logs

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
`;

    return { dockerfile, dockerCompose };
  }

  // Generate monitoring configuration
  generateMonitoringConfig(): string {
    return `
# Prometheus Configuration
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'dojopool-frontend'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'

  - job_name: 'dojopool-backend'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/metrics'

# Alerting Rules
groups:
  - name: dojopool
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }} seconds"
`;
  }

  // Generate deployment script
  generateDeploymentScript(): string {
    const config = this.getConfig();
    
    return `
#!/bin/bash

# DojoPool Deployment Script
# Environment: ${config.environment}

set -e

echo "🚀 Starting DojoPool deployment..."

# Build the application
echo "📦 Building application..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm test

# Run security audit
echo "🔒 Running security audit..."
npm audit --audit-level=moderate

# Optimize bundle
echo "⚡ Optimizing bundle..."
npm run analyze

# Deploy to server
echo "🌐 Deploying to server..."
rsync -avz --delete build/ user@server:/var/www/dojopool/

# Restart services
echo "🔄 Restarting services..."
ssh user@server "sudo systemctl restart nginx"
ssh user@server "sudo systemctl restart dojopool-backend"

# Health check
echo "🏥 Running health check..."
sleep 10
curl -f http://dojopool.com/api/health || exit 1

echo "✅ Deployment completed successfully!"
`;
  }

  // Get deployment status
  async getDeploymentStatus(): Promise<{
    environment: string;
    version: string;
    lastDeployed: string;
    health: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
  }> {
    try {
      const response = await fetch(`${this.config.apiUrl}/api/health`);
      const data = await response.json();
      
      return {
        environment: this.config.environment,
        version: process.env.npm_package_version || '1.0.0',
        lastDeployed: new Date().toISOString(),
        health: response.ok ? 'healthy' : 'degraded',
        uptime: data.uptime || 0
      };
    } catch (error) {
      return {
        environment: this.config.environment,
        version: process.env.npm_package_version || '1.0.0',
        lastDeployed: new Date().toISOString(),
        health: 'unhealthy',
        uptime: 0
      };
    }
  }
}

// Export singleton instance
export const deploymentManager = DeploymentManager.getInstance();

// Convenience functions
export const getDeploymentConfig = () => deploymentManager.getConfig();
export const isFeatureEnabled = (feature: keyof DeploymentConfig) => deploymentManager.isFeatureEnabled(feature);
export const getEnvironmentValue = <T>(key: keyof DeploymentConfig) => deploymentManager.getEnvironmentValue<T>(key);
export const validateDeploymentConfig = () => deploymentManager.validateConfig();
export const generateEnvVars = () => deploymentManager.generateEnvVars();
export const generateBuildConfig = () => deploymentManager.generateBuildConfig();
export const getDeploymentStatus = () => deploymentManager.getDeploymentStatus(); 