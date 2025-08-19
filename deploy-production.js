#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProductionDeployment {
  constructor() {
    this.config = require('./production-config');
    this.checks = [];
    this.errors = [];
  }

  async run() {
    console.log('🚀 Starting DojoPool Production Deployment...\n');

    try {
      await this.performPreDeploymentChecks();
      await this.setupEnvironment();
      await this.installDependencies();
      await this.buildApplication();
      await this.startProductionServer();
      await this.performPostDeploymentTests();

      console.log('\n✅ Production deployment completed successfully!');
      this.displayDeploymentSummary();
    } catch (error) {
      console.error('\n❌ Deployment failed:', error.message);
      this.displayErrors();
      process.exit(1);
    }
  }

  async performPreDeploymentChecks() {
    console.log('🔍 Performing pre-deployment checks...');

    // Check Node.js version
    const nodeVersion = process.version;
    const requiredVersion = '16.0.0';
    if (this.compareVersions(nodeVersion, requiredVersion) < 0) {
      this.errors.push(
        `Node.js version ${requiredVersion} or higher required. Current: ${nodeVersion}`
      );
    } else {
      this.checks.push(`✅ Node.js version: ${nodeVersion}`);
    }

    // Check if required files exist
    const requiredFiles = [
      'production-config.js',
      'production-backend.js',
      'test-app.html',
      'package.json',
    ];

    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        this.checks.push(`✅ Required file exists: ${file}`);
      } else {
        this.errors.push(`Missing required file: ${file}`);
      }
    }

    // Check port availability
    try {
      const net = require('net');
      const testServer = net.createServer();
      await new Promise((resolve, reject) => {
        testServer.listen(this.config.server.port, () => {
          testServer.close();
          resolve();
        });
        testServer.on('error', reject);
      });
      this.checks.push(`✅ Port ${this.config.server.port} is available`);
    } catch (error) {
      this.errors.push(`Port ${this.config.server.port} is not available`);
    }

    if (this.errors.length > 0) {
      throw new Error('Pre-deployment checks failed');
    }
  }

  async setupEnvironment() {
    console.log('⚙️ Setting up environment...');

    // Create logs directory
    const logsDir = 'logs';
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      this.checks.push('✅ Created logs directory');
    }

    // Create uploads directory
    const uploadsDir = 'uploads';
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      this.checks.push('✅ Created uploads directory');
    }

    // Set environment variables
    process.env.NODE_ENV = 'production';
    process.env.PORT = this.config.server.port.toString();
    this.checks.push('✅ Environment variables set');
  }

  async installDependencies() {
    console.log('📦 Installing dependencies...');

    try {
      execSync('npm install --production --legacy-peer-deps', {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
      this.checks.push('✅ Dependencies installed');
    } catch (error) {
      throw new Error('Failed to install dependencies');
    }
  }

  async buildApplication() {
    console.log('🔨 Building application...');

    try {
      // Create production build directory
      const buildDir = 'dist';
      if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir, { recursive: true });
      }

      // Copy static files
      const staticFiles = ['test-app.html', 'simple-frontend-server.js'];
      for (const file of staticFiles) {
        if (fs.existsSync(file)) {
          fs.copyFileSync(file, path.join(buildDir, file));
        }
      }

      this.checks.push('✅ Application built');
    } catch (error) {
      throw new Error('Failed to build application');
    }
  }

  async startProductionServer() {
    console.log('🚀 Starting production server...');

    try {
      // Start the production backend
      const ProductionBackend = require('./production-backend');
      const server = new ProductionBackend();
      server.start();

      this.checks.push('✅ Production server started');

      // Wait a moment for server to start
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      throw new Error('Failed to start production server');
    }
  }

  async performPostDeploymentTests() {
    console.log('🧪 Performing post-deployment tests...');

    try {
      const http = require('http');

      // Test health endpoint
      await this.testEndpoint('/api/health');
      this.checks.push('✅ Health endpoint responding');

      // Test game status endpoint
      await this.testEndpoint('/api/game-status');
      this.checks.push('✅ Game status endpoint responding');

      // Test metrics endpoint
      await this.testEndpoint('/api/metrics');
      this.checks.push('✅ Metrics endpoint responding');

      // Test features endpoint
      await this.testEndpoint('/api/features');
      this.checks.push('✅ Features endpoint responding');
    } catch (error) {
      throw new Error('Post-deployment tests failed');
    }
  }

  async testEndpoint(path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: this.config.server.port,
        path: path,
        method: 'GET',
      };

      const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(
            new Error(`Endpoint ${path} returned status ${res.statusCode}`)
          );
        }
      });

      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error(`Timeout testing ${path}`)));
      req.end();
    });
  }

  compareVersions(v1, v2) {
    const normalize = (v) => v.replace(/^v/, '').split('.').map(Number);
    const n1 = normalize(v1);
    const n2 = normalize(v2);

    for (let i = 0; i < Math.max(n1.length, n2.length); i++) {
      const num1 = n1[i] || 0;
      const num2 = n2[i] || 0;
      if (num1 < num2) return -1;
      if (num1 > num2) return 1;
    }
    return 0;
  }

  displayDeploymentSummary() {
    console.log('\n📊 Deployment Summary:');
    console.log('========================');

    for (const check of this.checks) {
      console.log(check);
    }

    console.log('\n🌐 Production URLs:');
    console.log(`   Backend: http://localhost:${this.config.server.port}`);
    console.log(
      `   Health: http://localhost:${this.config.server.port}/api/health`
    );
    console.log(
      `   Metrics: http://localhost:${this.config.server.port}/api/metrics`
    );
    console.log(
      `   Game Status: http://localhost:${this.config.server.port}/api/game-status`
    );
    console.log(
      `   Features: http://localhost:${this.config.server.port}/api/features`
    );

    console.log('\n🔧 Environment:');
    console.log(`   Node Environment: ${process.env.NODE_ENV}`);
    console.log(`   Port: ${this.config.server.port}`);
    console.log(`   Host: ${this.config.server.host}`);

    console.log('\n🎮 Features Enabled:');
    for (const [feature, enabled] of Object.entries(this.config.features)) {
      console.log(`   ${feature}: ${enabled ? '✅' : '❌'}`);
    }
  }

  displayErrors() {
    console.log('\n❌ Deployment Errors:');
    console.log('=====================');
    for (const error of this.errors) {
      console.log(`   ${error}`);
    }
  }
}

// Run deployment if this file is executed directly
if (require.main === module) {
  const deployment = new ProductionDeployment();
  deployment.run().catch((error) => {
    console.error('Deployment failed:', error.message);
    process.exit(1);
  });
}

module.exports = ProductionDeployment;
