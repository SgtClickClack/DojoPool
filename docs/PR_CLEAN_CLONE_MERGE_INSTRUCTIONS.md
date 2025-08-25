# Fresh-Start → Main: Clean Clone Merge Instructions

Use this when a local clone contains large or problematic files that block pushes.

## Prerequisites

- Git installed
- PowerShell 7+ (pwsh) recommended
- Optional: GitHub Personal Access Token (repo scope) if you want to auto-merge via API

## Steps

1. Create a clean clone in a new directory:
   - git clone https://github.com/SgtClickClack/DojoPool.git DojoPool-clean
   - cd DojoPool-clean

2. Fetch all branches (for safety):
   - git fetch --all --prune

3. Verify branches exist on remote:
   - git branch -r | findstr /I "fresh-start main"

4. Prepare PR body and automation script (already in repo):
   - Confirm files exist:
     - PR_FRESH_START_MERGE.md
     - scripts/create_and_merge_pr.ps1

5. Create the PR (Option A: manual in GitHub UI):
   - Base: main
   - Compare: fresh-start
   - Title: Fresh start: Merge clean foundation into main
   - Body: Paste contents of PR_FRESH_START_MERGE.md
   - Create PR and merge via squash after checks pass.

6. Create and merge via API (Option B: automated):
   - Set a PAT temporarily (repo scope):
     - $env:GITHUB_TOKEN = 'ghp_xxx' # replace with your token
   - Run script:
     - pwsh scripts/create_and_merge_pr.ps1 -RepoOwner SgtClickClack -RepoName DojoPool -HeadBranch fresh-start -BaseBranch main -Title "Fresh start: Merge clean foundation into main" -BodyFile PR_FRESH_START_MERGE.md -AutoMerge

7. After merge:
   - Communicate to the team that all new work must branch from main.
   - Archive/delete stale branches.
   - Ensure CI is green on main.
