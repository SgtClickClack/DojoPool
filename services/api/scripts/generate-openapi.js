#!/usr/bin/env node

/**
 * OpenAPI Documentation Generator for DojoPool API
 *
 * This script generates OpenAPI/Swagger documentation from the NestJS application
 * and saves it as JSON and YAML files for consumption by various tools.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const API_PORT = process.env.PORT || 3002;
const API_URL = `http://localhost:${API_PORT}`;
const OPENAPI_URL = `${API_URL}/api/docs-json`;
const OUTPUT_DIR = path.join(__dirname, '..', 'docs');
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'openapi.json');
const OUTPUT_YAML = path.join(OUTPUT_DIR, 'openapi.yaml');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🚀 Generating OpenAPI documentation for DojoPool API...\n');

// Check if API server is running
function isApiServerRunning() {
  try {
    execSync(`curl -s ${API_URL}/api/v1/health > /dev/null`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

if (!isApiServerRunning()) {
  console.log(
    '❌ API server is not running. Please start the API server first:'
  );
  console.log('   npm run start:dev');
  console.log('\nAlternatively, start it in the background:');
  console.log('   npm run start:dev &');
  console.log('   sleep 10 && npm run generate:docs');
  process.exit(1);
}

console.log('✅ API server is running');

// Fetch OpenAPI JSON from running server
try {
  console.log('📥 Fetching OpenAPI specification...');
  const openApiJson = execSync(`curl -s ${OPENAPI_URL}`, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024, // 10MB buffer
  });

  // Parse and validate JSON
  const openApiSpec = JSON.parse(openApiJson);

  // Add custom metadata
  openApiSpec.info = {
    ...openApiSpec.info,
    description: `# DojoPool API Documentation

Welcome to the comprehensive API documentation for **DojoPool** - The Ultimate Pool Gaming Platform.

## 🎯 Overview

DojoPool provides a complete suite of APIs for:
- **User Management**: Authentication, profiles, and account operations
- **Real-time Gaming**: Tournament management, match tracking, and live updates
- **Social Features**: Clans, messaging, and community interactions
- **Analytics**: Real-time metrics, dashboards, and performance monitoring
- **Economy**: DojoCoin transactions, marketplace, and rewards system
- **Territories**: Venue control, conquest mechanics, and strategic gameplay

## 🔐 Authentication

All API endpoints (except authentication) require a valid JWT token:

\`\`\`bash
Authorization: Bearer <your-jwt-token>
\`\`\`

### Getting Started
1. **Register** a new account via \`POST /api/v1/auth/register\`
2. **Login** via \`POST /api/v1/auth/login\` to get JWT tokens
3. **Use the token** in subsequent API calls
4. **Refresh tokens** via \`POST /api/v1/auth/refresh\` when expired

## 📊 Real-time Features

DojoPool supports real-time updates via:
- **WebSocket**: For live gaming events and chat
- **Server-Sent Events (SSE)**: For analytics and dashboard updates
- **Webhooks**: For external integrations (coming soon)

### SSE Analytics Example
\`\`\`javascript
const eventSource = new EventSource('/api/analytics/stream');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time analytics:', data);
};
\`\`\`

## 🎮 Key Concepts

### Territories & Venues
- **Territories**: Physical pool venues that can be controlled
- **Conquest**: Players can challenge and take control of territories
- **Defense**: Territory owners defend against challengers
- **Rewards**: Controlling territories provides ongoing benefits

### Tournaments
- **Single Elimination**: Traditional bracket-style tournaments
- **Round Robin**: All players compete against each other
- **Live Updates**: Real-time bracket updates and match results

### Economy System
- **DojoCoin**: Platform currency for transactions
- **NFTs**: Collectible items and achievements
- **Marketplace**: Player-to-player trading system
- **Staking**: Territory control rewards

## 📈 Analytics & Monitoring

Access comprehensive analytics through:
- **Dashboard API**: \`GET /api/analytics/dashboard\` (Admin only)
- **Real-time Metrics**: \`GET /api/analytics/realtime\`
- **SSE Streams**: \`GET /api/analytics/stream\` for live updates

## 🔧 Development

### Base URL
- **Development**: \`http://localhost:3002/api/v1\`
- **Production**: \`https://api.dojopool.com/api/v1\`

### Response Format
All responses follow a consistent JSON structure:
\`\`\`json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
\`\`\`

### Error Handling
Standard HTTP status codes with detailed error messages:
- **400**: Bad Request - Invalid input parameters
- **401**: Unauthorized - Missing or invalid authentication
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource doesn't exist
- **500**: Internal Server Error - Server-side issues

---

**Built with ❤️ by the DojoPool Team**`,
    contact: {
      name: 'DojoPool Team',
      email: 'api@dojopool.com',
      url: 'https://dojopool.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    version: '1.0.0',
    'x-logo': {
      url: 'https://dojopool.com/logo.png',
      backgroundColor: '#1a1a2e',
      altText: 'DojoPool Logo',
    },
    'x-api-version': '1.0.0',
    'x-generated-at': new Date().toISOString(),
    'x-generator': 'DojoPool OpenAPI Generator',
  };

  // Add custom servers
  openApiSpec.servers = [
    {
      url: 'http://localhost:3002/api/v1',
      description: 'Development Server',
    },
    {
      url: 'https://api.dojopool.com/api/v1',
      description: 'Production Server',
    },
  ];

  // Add security schemes if not present
  if (!openApiSpec.components) {
    openApiSpec.components = {};
  }

  if (!openApiSpec.components.securitySchemes) {
    openApiSpec.components.securitySchemes = {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'JWT Authorization header using the Bearer scheme. Enter your JWT token in the text input below.',
      },
    };
  }

  // Write JSON file
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(openApiSpec, null, 2));
  console.log(`✅ Generated OpenAPI JSON: ${OUTPUT_JSON}`);

  // Generate YAML version (optional)
  try {
    const yamlContent = require('js-yaml').dump(openApiSpec, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
    });
    fs.writeFileSync(OUTPUT_YAML, yamlContent);
    console.log(`✅ Generated OpenAPI YAML: ${OUTPUT_YAML}`);
  } catch (yamlError) {
    console.log('⚠️  YAML generation skipped (js-yaml not available)');
  }

  // Generate summary
  const pathCount = Object.keys(openApiSpec.paths || {}).length;
  const tagCount = (openApiSpec.tags || []).length;
  const schemaCount = Object.keys(openApiSpec.components?.schemas || {}).length;

  console.log('\n📊 Documentation Summary:');
  console.log(`   • API Endpoints: ${pathCount}`);
  console.log(`   • Tags/Categories: ${tagCount}`);
  console.log(`   • Schema Definitions: ${schemaCount}`);
  console.log(`   • Generated: ${new Date().toISOString()}`);

  console.log('\n🎉 OpenAPI documentation generated successfully!');
  console.log('\n📖 View documentation at:');
  console.log(`   Web UI: ${API_URL}/api/docs`);
  console.log(`   JSON: file://${OUTPUT_JSON}`);
  if (fs.existsSync(OUTPUT_YAML)) {
    console.log(`   YAML: file://${OUTPUT_YAML}`);
  }

  console.log('\n🔄 To regenerate after API changes:');
  console.log('   npm run generate:docs');
} catch (error) {
  console.error('❌ Failed to generate OpenAPI documentation:', error.message);

  if (error.message.includes('connect ECONNREFUSED')) {
    console.log('\n💡 Make sure the API server is running:');
    console.log('   npm run start:dev');
  }

  process.exit(1);
}
