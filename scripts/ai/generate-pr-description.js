import { runGit, getGitDiff, chatComplete } from './_util.js';

async function main() {
  const baseRef = process.env.PR_BASE || 'origin/main';
  let log =
    runGit(`log --pretty=format:%h\\ %s ${baseRef}..HEAD`) ||
    runGit('log -5 --pretty=format:%h %s');
  let stat =
    runGit(`diff --stat ${baseRef}..HEAD`) ||
    runGit('diff --stat HEAD~5..HEAD') ||
    getGitDiff();

  const system = [
    'You write clear, structured PR descriptions for engineers and reviewers.',
    'Sections: Summary, Changes, Risks, Testing, Rollback, Related Issues.',
    'Keep it concise and high-signal.',
  ].join('\n');
  const user = [
    'Recent commits:',
    log || '(no commit log)',
    '',
    'Diff stat:',
    stat || '(no diff stat)',
    '',
    'Write the PR description now.',
  ].join('\n');

  const desc = await chatComplete({
    system,
    user,
    maxTokens: 1024,
    temperature: 0.2,
  });
  console.log(desc.trim());
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
