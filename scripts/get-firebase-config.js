#!/usr/bin/env node
/**
 * Script to help extract Firebase configuration for GitHub secrets
 * Run this after setting up Firebase CLI: firebase login
 */

import { execSync } from 'child_process';
import fs from 'fs';

async function getFirebaseConfig() {
  try {
    console.log('🔍 Extracting Firebase configuration...\n');
    
    // Get project info
    const projectInfo = execSync('firebase projects:list --json', { encoding: 'utf8' });
    const projects = JSON.parse(projectInfo);
    
    console.log('📋 Available Firebase projects:');
    projects.forEach(project => {
      console.log(`  - ${project.projectId} (${project.displayName})`);
    });
    
    // Get current project
    try {
      const currentProject = execSync('firebase use --json', { encoding: 'utf8' });
      const project = JSON.parse(currentProject);
      console.log(`\n🎯 Current project: ${project.projectId}`);
    } catch (e) {
      console.log('\n⚠️  No active Firebase project. Run: firebase use dojo-pool');
    }
    
    console.log('\n📝 GitHub Secrets to add:');
    console.log('FIREBASE_PROJECT_ID=dojo-pool');
    console.log('FIREBASE_AUTH_DOMAIN=dojo-pool.firebaseapp.com');
    console.log('FIREBASE_STORAGE_BUCKET=dojo-pool.appspot.com');
    console.log('\n🔑 Get these from Firebase Console → Project Settings:');
    console.log('  - Web API Key → FIREBASE_API_KEY');
    console.log('  - Cloud Messaging Sender ID → FIREBASE_MESSAGING_SENDER_ID');
    console.log('  - App ID → FIREBASE_APP_ID');
    console.log('  - Measurement ID → FIREBASE_MEASUREMENT_ID');
    console.log('\n🔐 Service Account:');
    console.log('  1. Go to Firebase Console → Project Settings → Service Accounts');
    console.log('  2. Click "Generate new private key"');
    console.log('  3. Copy JSON content → FIREBASE_SERVICE_ACCOUNT');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure Firebase CLI is installed and you\'re logged in:');
    console.log('   npm install -g firebase-tools');
    console.log('   firebase login');
  }
}

getFirebaseConfig();
