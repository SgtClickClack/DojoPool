#!/usr/bin/env node
import 'dotenv/config';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import schema from './env-schema.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function bool(val) {
  return val === 'true' || val === '1' || val === true;
}

function isSet(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict') || args.includes('--ci');

  // Build from centralized schema
  const missing = [];
  const warnings = [];

  // Required groups (except dbEither)
  for (const [groupName, groupDef] of Object.entries(schema.required)) {
    if (groupName === 'dbEither') continue;
    for (const [key, meta] of Object.entries(groupDef)) {
      const val = process.env[key];
      if (!isSet(val)) {
        const hint = meta && meta.hint ? ` - hint: ${meta.hint}` : '';
        const example = meta && meta.example ? ` (e.g., ${meta.example})` : '';
        missing.push(`${key} is not set${hint}${example}`);
      }
    }
  }

  // DB either rule
  const eitherKeys = Array.isArray(schema.required.dbEither) ? schema.required.dbEither : [];
  const hasEither = eitherKeys.some((k) => isSet(process.env[k]));
  if (!hasEither) {
    missing.push(`One of ${eitherKeys.join(', ')} must be set`);
  }

  // Optional groups
  for (const keys of Object.values(schema.optional)) {
    for (const key of keys) {
      const val = process.env[key];
      if (!isSet(val)) warnings.push(`${key} is not set`);
    }
  }

  // Check .env presence (best-effort)
  const envPath = path.join(ROOT, '.env');
  const hasDotEnv = await fileExists(envPath);

  // Additional invalid and recommendation checks
  const invalid = [];
  const recommendations = [];
  const devMode = (process.env.NODE_ENV || '').toLowerCase() !== 'production';

  const isHttpUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);
  const isHttpsUrl = (u) => typeof u === 'string' && /^https:\/\//i.test(u);
  const isWsUrl = (u) => typeof u === 'string' && /^(wss?|https?):\/\//i.test(u); // allow http(s) base for proxied WS

  // NODE_ENV
  if (isSet(process.env.NODE_ENV)) {
    const v = process.env.NODE_ENV.toLowerCase();
    if (!['development', 'production', 'test'].includes(v)) {
      invalid.push('NODE_ENV must be one of development, production, or test');
    }
  }

  // PORT
  if (isSet(process.env.PORT) && (!/^\d+$/.test(process.env.PORT) || Number(process.env.PORT) <= 0)) {
    invalid.push('PORT must be a positive integer');
  }

  // FRONTEND_URL
  if (isSet(process.env.FRONTEND_URL) && !isHttpUrl(process.env.FRONTEND_URL)) {
    invalid.push('FRONTEND_URL should start with http:// or https://');
  }

  // NEXT_PUBLIC_API_URL
  if (isSet(process.env.NEXT_PUBLIC_API_URL) && !isHttpUrl(process.env.NEXT_PUBLIC_API_URL)) {
    invalid.push('NEXT_PUBLIC_API_URL should start with http:// or https://');
  } else if (!devMode && isSet(process.env.NEXT_PUBLIC_API_URL) && !isHttpsUrl(process.env.NEXT_PUBLIC_API_URL)) {
    recommendations.push('In production, NEXT_PUBLIC_API_URL should use https://');
  }

  // CORS_ORIGINS
  if (isSet(process.env.CORS_ORIGINS)) {
    const origins = process.env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
    const bad = origins.filter((o) => !isHttpUrl(o));
    if (bad.length) {
      invalid.push(`CORS_ORIGINS must be a comma-separated list of http(s) origins. Invalid: ${bad.join(', ')}`);
    }
  } else {
    if (devMode) recommendations.push('For development, set CORS_ORIGINS to http://localhost:3000');
  }

  // NEXT_PUBLIC_WEBSOCKET_URL
  if (isSet(process.env.NEXT_PUBLIC_WEBSOCKET_URL) && !isWsUrl(process.env.NEXT_PUBLIC_WEBSOCKET_URL)) {
    invalid.push('NEXT_PUBLIC_WEBSOCKET_URL should start with ws://, wss://, http://, or https://');
  }

  // REDIS_URL
  if (isSet(process.env.REDIS_URL) && !/^redis:\/\//i.test(process.env.REDIS_URL)) {
    invalid.push('REDIS_URL should start with redis://');
  }

  // Secrets length and prod advice
  for (const k of ['SESSION_SECRET', 'JWT_SECRET']) {
    const val = process.env[k];
    if (isSet(val)) {
      if (val.length < 16) invalid.push(`${k} should be at least 16 characters`);
      if (!devMode && /^dev[_-]/i.test(val)) recommendations.push(`In production, avoid using development placeholder for ${k}`);
    } else if (devMode) {
      recommendations.push(`Set ${k} to a long random string for local development (e.g., via .env)`);
    }
  }

  // DATABASE_URL basic scheme check
  if (isSet(process.env.DATABASE_URL)) {
    if (!/^(postgres(ql)?|mysql|mysqls|mongodb|file|sqlite):\/\//i.test(process.env.DATABASE_URL)) {
      invalid.push('DATABASE_URL should start with a recognized scheme (postgresql://, postgres://, mysql://, mongodb://, sqlite://)');
    }
  }

  // FLASK_DEBUG and prod
  if (!devMode && process.env.FLASK_DEBUG === '1') {
    invalid.push('In production, FLASK_DEBUG should not be 1');
  }

  // Missing recommended dev values
  if (devMode) {
    if (!isSet(process.env.NEXT_PUBLIC_API_URL)) recommendations.push('For development, NEXT_PUBLIC_API_URL is typically http://localhost:3002/api/v1');
    if (!isSet(process.env.FRONTEND_URL)) recommendations.push('For development, FRONTEND_URL is typically http://localhost:3000');
  }

  // Report
  console.log('Environment check:');
  console.log(`- Mode: ${strict ? 'STRICT' : 'WARN'}`);
  console.log(`- .env present at repo root: ${hasDotEnv ? 'yes' : 'no'}`);
  if (missing.length === 0) {
    console.log('- Required variables: OK');
  } else {
    console.warn(`- Missing required variables (${missing.length}):`);
    for (const m of missing) console.warn(`  • ${m}`);
  }
  if (invalid.length) {
    console.warn(`- Invalid values (${invalid.length}):`);
    for (const i of invalid) console.warn(`  • ${i}`);
  }
  if (warnings.length) {
    console.warn(`- Optional warnings (${warnings.length}):`);
    for (const w of warnings) console.warn(`  • ${w}`);
  }
  if (recommendations.length) {
    console.log(`- Recommendations (${recommendations.length}):`);
    for (const r of recommendations) console.log(`  • ${r}`);
  }

  if (strict && (missing.length > 0 || invalid.length > 0)) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('env:check failed:', err?.stack || err?.message || err);
  process.exitCode = 1;
});
