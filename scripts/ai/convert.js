import fs from 'fs/promises';
import path from 'path';
import {
  parseArgs,
  proposeFullFileRewrite,
  writeText,
  safeBasename,
  ensureDir,
  timestampSlug,
} from './_util.js';

async function main() {
  const args = parseArgs();
  const filePath = args.file || args.f;
  const from = (args.from || args.src || '').toLowerCase();
  const to = (args.to || args.dst || '').toLowerCase();

  if (!filePath || !to) {
    console.error(
      'Usage: node scripts/ai/convert.js --file <path> [--from ts|js|py|java] --to py|ts|js|java'
    );
    process.exit(2);
  }

  const absPath = path.resolve(process.cwd(), filePath);
  const code = await fs.readFile(absPath, 'utf8');

  const instruction = [
    `Convert this code ${from ? `from ${from.toUpperCase()} ` : ''}to ${to.toUpperCase()} with equivalent behavior.`,
    'Follow ecosystem norms and package idioms. Include docstrings or type hints where idiomatic.',
    'Do not include explanations; return only the converted code.',
  ].join('\n');

  const updated = await proposeFullFileRewrite({ filePath, code, instruction });

  const outDir = path.resolve(
    process.cwd(),
    'reports',
    'ai-conversions',
    timestampSlug()
  );
  await ensureDir(outDir);
  const baseNoExt = safeBasename(filePath).replace(/\.[^.]+$/, '');
  const extMap = {
    js: '.js',
    ts: '.ts',
    py: '.py',
    java: '.java',
    jsx: '.jsx',
    tsx: '.tsx',
  };
  const outExt = extMap[to] || '.txt';
  const outPath = path.join(outDir, `${baseNoExt}${outExt}`);
  await writeText(outPath, updated);
  console.log(
    'Converted file written to ' + path.relative(process.cwd(), outPath)
  );
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
