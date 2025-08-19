import { execSync } from 'child_process';
import { explainText } from './_util.js';

function run(cmd) {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    const out = err.stdout?.toString?.() || '';
    const e = err.stderr?.toString?.() || '';
    return [out, e].filter(Boolean).join('\n');
  }
}

async function main() {
  const ts = run('npm run -s type-check');
  const lint = run('npm run -s lint');
  const combined = ['[TypeScript Type Check]', ts, '', '[ESLint]', lint].join(
    '\n'
  );
  const explanation = await explainText({
    title: 'Static Analysis Report',
    text: combined,
  });
  console.log(explanation);
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
