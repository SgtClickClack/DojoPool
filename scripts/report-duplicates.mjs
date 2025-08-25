#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const OUT = path.join(DOCS, 'duplicates-report.md');

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', 'coverage', 'lcov-report', '.turbo', '.vercel'
]);

const PATTERNS = [
  // explicit backup suffixes
  { name: 'backup-suffix', test: (n) => n.toLowerCase().endsWith('.backup') },
  // files containing 'backup'
  { name: 'contains-backup', test: (n) => n.toLowerCase().includes('backup') },
  // Windows-style copy artifacts
  { name: 'win-copy', test: (n) => n.includes(' - Copy') },
  { name: 'copy-of', test: (n) => n.toLowerCase().includes('copy of') },
  // common config duplicates we care about
  { name: 'vite-config-copy', test: (n) => /vite\.config.*copy/i.test(n) },
  { name: 'vitest-config-copy', test: (n) => /vitest.*config.*copy/i.test(n) },
  { name: 'next-config-backup', test: (n) => /next\.config.*backup/i.test(n) },
];

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      if (IGNORE_DIRS.has(e.name)) continue;
      yield* walk(path.join(dir, e.name));
    } else if (e.isFile()) {
      yield path.join(dir, e.name);
    }
  }
}

function matchPatterns(filePath) {
  const name = path.basename(filePath);
  const matches = PATTERNS.filter(p => p.test(name));
  return matches.map(m => m.name);
}

async function main() {
  const candidates = [];
  for await (const f of walk(ROOT)) {
    const ms = matchPatterns(f);
    if (ms.length) {
      candidates.push({ file: path.relative(ROOT, f), reasons: ms });
    }
  }

  await fs.mkdir(DOCS, { recursive: true });
  const lines = [];
  lines.push('# Duplicate/Backup Files Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('Criteria:');
  lines.push('- Names containing " - Copy" (Windows), "copy of"');
  lines.push('- Files containing "backup" or ending with .backup');
  lines.push('- Known config duplicates (vite/vitest/next)');
  lines.push('');

  if (candidates.length === 0) {
    lines.push('No candidates found.');
  } else {
    lines.push(`Total candidates: ${candidates.length}`);
    lines.push('');
    for (const c of candidates.sort((a,b)=>a.file.localeCompare(b.file))) {
      lines.push(`- ${c.file}  (reasons: ${c.reasons.join(', ')})`);
    }
  }

  lines.push('');
  lines.push('Review guidance: Verify each file is not referenced by build/test scripts before deletion. Prefer keeping a single source-of-truth config.');

  await fs.writeFile(OUT, lines.join('\n'), 'utf8');
  console.log(`Duplicate report written to ${path.relative(ROOT, OUT)}`);
}

main().catch(err => {
  console.error('Failed to build duplicates report:', err?.stack || err?.message || err);
  process.exitCode = 1;
});
