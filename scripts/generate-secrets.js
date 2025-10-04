#!/usr/bin/env node

/**
 * Generate production secrets for Dojo Pool deployment
 * Run this script to generate secure secrets for your production environment
 */

const crypto = require('crypto');

console.log('🔐 Dojo Pool - Production Secrets Generator\n');

// Generate NextAuth secret
const nextAuthSecret = crypto.randomBytes(32).toString('base64');
console.log('NEXTAUTH_SECRET=' + nextAuthSecret);

// Generate JWT secret
const jwtSecret = crypto.randomBytes(32).toString('base64');
console.log('JWT_SECRET=' + jwtSecret);

console.log('\n📋 Instructions:');
console.log('1. Copy these secrets to your Vercel environment variables');
console.log(
  '2. Make sure to use the same JWT_SECRET in both frontend and backend'
);
console.log('3. Generate a new NEXTAUTH_SECRET for each environment');
console.log('\n⚠️  Keep these secrets secure and never commit them to Git!');
