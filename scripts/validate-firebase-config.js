#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { execSync } = require('child_process');
const readline = require('readline');

const ENV_FILE = path.resolve(process.cwd(), '.env.local');
const REQUIRED_KEYS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
];

function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) {
    console.error(`.env.local not found at ${ENV_FILE}`);
    process.exit(1);
  }
  const env = dotenv.parse(fs.readFileSync(ENV_FILE));
  return env;
}

function validateKeys(env) {
  let valid = true;
  for (const key of REQUIRED_KEYS) {
    if (!env[key]) {
      console.error(`Missing required key: ${key}`);
      valid = false;
    } else if (/\b(firebasestorage\.app)\b/i.test(env[key])) {
      console.error(
        `Typo detected in ${key}: 'firebasestorage.app' should be 'appspot.com'`
      );
      valid = false;
    } else if (/^(xxx|your-|changeme|test|dummy|sample)/i.test(env[key])) {
      console.warn(`Value for ${key} looks like a placeholder: ${env[key]}`);
      valid = false;
    }
  }
  return valid;
}

function fixEnv(env) {
  let changed = false;
  const fixedEnv = { ...env };
  for (const key of REQUIRED_KEYS) {
    if (env[key] && /firebasestorage\.app/i.test(env[key])) {
      fixedEnv[key] = env[key].replace(/firebasestorage\.app/gi, 'appspot.com');
      changed = true;
      console.log(
        `Fixed typo in ${key}: replaced 'firebasestorage.app' with 'appspot.com'`
      );
    }
    if (env[key] && /^(xxx|your-|changeme|test|dummy|sample)/i.test(env[key])) {
      fixedEnv[key] = '';
      changed = true;
      console.log(`Cleared placeholder value in ${key}`);
    }
  }
  return changed ? fixedEnv : null;
}

function writeEnv(env) {
  const lines = Object.entries(env).map(([k, v]) => `${k}=${v}`);
  fs.writeFileSync(ENV_FILE, lines.join('\n'));
  console.log('.env.local updated.');
}

async function fetchFirebaseConfig() {
  const credPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || 'firebase-credentials.json';
  if (!fs.existsSync(credPath)) {
    console.error(
      'No Firebase service account key found. Set FIREBASE_SERVICE_ACCOUNT_KEY or place firebase-credentials.json in project root.'
    );
    process.exit(1);
  }
  const cred = JSON.parse(fs.readFileSync(credPath));
  const projectId = cred.project_id;
  if (!projectId) {
    console.error('project_id missing in service account key.');
    process.exit(1);
  }
  // Use gcloud CLI to fetch config (requires gcloud installed and authenticated)
  try {
    const result = execSync(
      `gcloud firebase web apps list --project ${projectId} --format=json`,
      { encoding: 'utf8' }
    );
    const apps = JSON.parse(result);
    if (!apps.length) throw new Error('No web apps found for this project.');
    const appId = apps[0].appId;
    const configResult = execSync(
      `gcloud firebase web apps describe ${appId} --project ${projectId} --format=json`,
      { encoding: 'utf8' }
    );
    const config = JSON.parse(configResult).webConfig;
    if (!config) throw new Error('No webConfig found.');
    return {
      NEXT_PUBLIC_FIREBASE_API_KEY: config.apiKey,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: config.authDomain,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: config.projectId,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: config.storageBucket,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: config.messagingSenderId,
      NEXT_PUBLIC_FIREBASE_APP_ID: config.appId,
      NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: config.measurementId || '',
    };
  } catch (e) {
    console.error('Failed to fetch Firebase config from gcloud:', e.message);
    process.exit(1);
  }
}

function promptConfirm(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(message + ' [y/N]: ', (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const env = loadEnv();
  let valid = validateKeys(env);
  if (args.includes('--fix')) {
    const fixed = fixEnv(env);
    if (fixed) {
      const confirmed = await promptConfirm(
        'Apply fixes and overwrite .env.local?'
      );
      if (confirmed) {
        writeEnv(fixed);
        valid = validateKeys(fixed);
      } else {
        console.log('No changes made.');
      }
    } else {
      console.log('No fixes needed.');
    }
  }
  if (args.includes('--fetch')) {
    try {
      const fetched = await fetchFirebaseConfig();
      const confirmed = await promptConfirm(
        'Overwrite .env.local with config from Firebase Console?'
      );
      if (confirmed) {
        writeEnv({ ...env, ...fetched });
        valid = validateKeys({ ...env, ...fetched });
      } else {
        console.log('No changes made.');
      }
    } catch (e) {
      console.error('Error fetching Firebase config:', e.message || e);
      process.exit(1);
    }
  }
  if (valid) {
    console.log('Firebase config looks good!');
  } else {
    process.exit(1);
  }
}

main();
