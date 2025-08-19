import path from 'path';
import { parseArgs, readMaybe, readFromStdin, chatComplete } from './_util.js';

async function main() {
  const args = parseArgs();
  const logPath = args.log || args.l;
  const codePath = args.code || args.c; // optional code snippet file
  const framework = args.framework || args.fw || 'auto';
  const component = args.component || args.cmp || '';

  let logs = await readMaybe(logPath);
  if (!logs && process.stdin.isTTY === false) logs = await readFromStdin();

  const code = await readMaybe(codePath);

  if (!logs && !code) {
    console.error(
      'Provide --log <file> or pipe logs; optionally --code <file> for context.'
    );
    process.exit(2);
  }

  const system = [
    'You are a senior QA engineer. Given logs and optional code, produce minimal, deterministic reproduction steps.',
    'Prefer CLI commands and exact file paths. If framework detected, include framework-native test snippet (e.g., Vitest/Jest/Playwright).',
  ].join('\n');

  const user = [
    framework !== 'auto' ? `Framework: ${framework}` : 'Framework: auto-detect',
    component ? `Component/Module: ${component}` : '',
    logs ? '--- Logs ---\n' + logs : '',
    code ? '\n--- Code ---\n' + code : '',
    '',
    'Output format:',
    '1) Preconditions',
    '2) Step-by-step commands/clicks',
    '3) Expected vs Actual',
    '4) Minimal test case (if applicable)',
  ].join('\n');

  const result = await chatComplete({ system, user, maxTokens: 2048 });
  console.log(result);
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
