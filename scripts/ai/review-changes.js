import { getGitDiff, getGitChangedFiles, chatComplete } from './_util.js';

async function main() {
  const diff = getGitDiff({ staged: true });
  if (!diff) {
    console.error('No staged changes found. Stage your changes first.');
    process.exit(2);
  }
  const system = [
    'You are a pragmatic senior code reviewer. Provide actionable review for the diff.',
    'Focus on correctness, readability, security, performance, and style. Include concrete suggestions with small code snippets when helpful.',
  ].join('\n');
  const user =
    'Review the following git diff and provide feedback grouped by file.\n\n' +
    diff;
  const output = await chatComplete({
    system,
    user,
    maxTokens: 2048,
    temperature: 0.2,
  });
  console.log(output.trim());
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
