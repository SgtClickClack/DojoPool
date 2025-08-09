import fs from 'fs/promises';
import path from 'path';
import { parseArgs, ensureDir, timestampSlug, safeBasename, writeText, proposeFullFileRewrite, unifiedDiff } from './_util.js';

async function main() {
  const args = parseArgs();
  const filePath = args.file || args.f;
  const mode = (args.mode || 'simplify').toLowerCase(); // simplify | optimize | readability
  const apply = Boolean(args.apply || args.a);

  if (!filePath) {
    console.error('Usage: node scripts/ai/refactor.js --file <path> [--mode simplify|optimize|readability] [--apply]');
    process.exit(2);
  }

  const absPath = path.resolve(process.cwd(), filePath);
  const code = await fs.readFile(absPath, 'utf8');

  const goals = {
    simplify: 'Refactor to simplify control flow, reduce nesting, and extract clear helpers. No behavior changes.',
    optimize: 'Optimize for performance and memory without altering behavior. Prefer O(n) over O(n^2), efficient data structures, and early-exit guards.',
    readability: 'Improve readability: clearer names, small functions, remove dead code, and consistent style. No behavior changes.',
  };

  const instruction = [
    goals[mode] || goals.simplify,
    '',
    'Constraints:',
    '- Preserve imports/exports and public API.',
    '- Keep types and tests compatible.',
    '- Add small guard clauses and inline docs (short JSDoc) where it increases clarity.',
  ].join('\n');

  const updated = await proposeFullFileRewrite({ filePath, code, instruction });

  const outDir = path.resolve(process.cwd(), 'reports', 'ai-refactors', timestampSlug());
  await ensureDir(outDir);
  const base = safeBasename(filePath);
  const originalPath = path.join(outDir, `${base}.orig`);
  const proposedPath = path.join(outDir, `${base}.proposed`);
  await writeText(originalPath, code);
  await writeText(proposedPath, updated);

  const diffText = await unifiedDiff(originalPath, proposedPath);
  const diffPath = path.join(outDir, `${base}.diff`);
  await writeText(diffPath, diffText || '');

  if (apply) {
    const backupPath = `${absPath}.bak.${timestampSlug()}`;
    await writeText(backupPath, code);
    await writeText(absPath, updated);
    console.log(`Applied refactor to ${filePath}. Backup at ${path.relative(process.cwd(), backupPath)}.`);
  } else {
    console.log('Proposed refactor written to:');
    console.log('  ' + path.relative(process.cwd(), proposedPath));
    console.log('Diff:');
    console.log(diffText || '(no diff)');
    console.log('\nTo apply automatically: add --apply');
  }
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});