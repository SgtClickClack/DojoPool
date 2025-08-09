import { getGitDiff, chatComplete } from './_util.js';

async function main() {
  const diff = getGitDiff({ staged: true });
  if (!diff) {
    console.error('No staged changes found. Stage your changes first.');
    process.exit(2);
  }
  const system = [
    'You generate concise Conventional Commits messages from diffs.',
    'Return a single commit message with type(scope): subject on first line (<=72 chars), followed by wrapped body if needed.',
  ].join('\n');
  const user = 'Diff:\n' + diff + '\n\nGenerate the commit message now.';
  const msg = await chatComplete({ system, user, maxTokens: 512, temperature: 0.2 });
  console.log(msg.trim());
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});