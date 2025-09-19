#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Read .firebaserc to get project ID
const firebasercPath = path.join(ROOT, '.firebaserc');
const firebaserc = JSON.parse(fs.readFileSync(firebasercPath, 'utf8'));

console.log('🔥 Firebase Configuration for GitHub Secrets:');
console.log('==============================================');
console.log('');
console.log('Based on your .firebaserc file:');
console.log(`Project ID: ${firebaserc.projects.dev}`);
console.log('');
console.log('📋 Add these GitHub Secrets:');
console.log('');
console.log(`FIREBASE_PROJECT_ID=${firebaserc.projects.dev}`);
console.log(`FIREBASE_AUTH_DOMAIN=${firebaserc.projects.dev}.firebaseapp.com`);
console.log(`FIREBASE_STORAGE_BUCKET=${firebaserc.projects.dev}.appspot.com`);
console.log('');
console.log('🔑 Get these from Firebase Console → Project Settings:');
console.log('  - Web API Key → FIREBASE_API_KEY');
console.log('  - Cloud Messaging Sender ID → FIREBASE_MESSAGING_SENDER_ID');
console.log('  - App ID → FIREBASE_APP_ID');
console.log('  - Measurement ID → FIREBASE_MEASUREMENT_ID');
console.log('');
console.log('🔐 Service Account:');
console.log('  1. Go to Firebase Console → Project Settings → Service Accounts');
console.log('  2. Click "Generate new private key"');
console.log('  3. Copy the entire JSON content → FIREBASE_SERVICE_ACCOUNT');
console.log('');
console.log('🌐 Firebase Console URL:');
console.log(`https://console.firebase.google.com/project/${firebaserc.projects.dev}`);
