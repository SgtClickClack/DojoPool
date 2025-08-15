import fs from 'fs/promises';
import path from 'path';
import { parseArgs, readMaybe, ensureDir, timestampSlug, safeBasename, writeText, proposeFullFileRewrite, unifiedDiff } from './_util.js';

async function main() {
  const args = parseArgs();
  const filePath = args.file || args.f;
  const errorText = args.error || args.e || (await readMaybe(args.log)) || '';
  const apply = Boolean(args.apply || args.a);
  const mode = args.mode || 'fix';

  if (!filePath) {
    console.error('Usage: node scripts/ai/fix-with-ai.js --file <path> [--error "..."] [--apply]');
    process.exit(2);
  }

  const absPath = path.resolve(process.cwd(), filePath);
  const code = await fs.readFile(absPath, 'utf8');

  const instruction = [
    `Task: ${mode === 'refactor' ? 'Refactor to simplify and improve readability without changing behavior.' : 'Fix the described issue with minimal change while improving safety.'}`,
    '',
    'Constraints:',
    '- Preserve imports and exports.',
    '- Keep public API stable unless absolutely necessary.',
    '- Add targeted guards and clear naming where helpful.',
    '- Include tests if the file contains inline test code; otherwise, keep changes scoped to this file only.',
    '',
    errorText ? 'Error/context:\n' + errorText : '(no explicit error context provided)'
  ].join('\n');

  const updated = await proposeFullFileRewrite({ filePath, code, instruction });

  // Output artifacts
  const outDir = path.resolve(process.cwd(), 'reports', 'ai-fixes', timestampSlug());
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
    // Backup and apply in-place
    const backupPath = `${absPath}.bak.${timestampSlug()}`;
    await writeText(backupPath, code);
    await writeText(absPath, updated);
    console.log(`Applied AI changes to ${filePath}. Backup saved at ${path.relative(process.cwd(), backupPath)}.`);
  } else {
    console.log('Proposed changes written to:');
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