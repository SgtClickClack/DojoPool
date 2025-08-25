# Duplicate/Backup Files Report

Generated: 2025-08-23T17:00:11.936Z

Criteria:
- Names containing " - Copy" (Windows), "copy of"
- Files containing "backup" or ending with .backup
- Known config duplicates (vite/vitest/next)

Total candidates: 18

- .env.backup-utf16  (reasons: contains-backup)
- .env.local.backup  (reasons: backup-suffix, contains-backup)
- .git-rewrite\backup-refs  (reasons: contains-backup)
- apps\web\server.js.backup  (reasons: backup-suffix, contains-backup)
- BG changes - Copy of Dojo Pool_ Business Plan - July 6, 3_37 AM.docx  (reasons: win-copy, copy-of)
- packages\types\src\types\backup.ts  (reasons: contains-backup)
- src\config\backup.ts  (reasons: contains-backup)
- verify_git - Copy.py  (reasons: win-copy)
- verify_git_config - Copy.py  (reasons: win-copy)
- verify_git_config_final - Copy.py  (reasons: win-copy)
- verify_git_final - Copy.py  (reasons: win-copy)
- verify_git_settings - Copy.py  (reasons: win-copy)
- verify_git_settings_final - Copy.py  (reasons: win-copy)
- websocket-backend - Copy.js  (reasons: win-copy)
- WEBSTORM_PYTHON_SETUP - Copy.md  (reasons: win-copy)
- WEBSTORM_VIRTUAL_ENVIRONMENT_SETUP - Copy.md  (reasons: win-copy)
- White Paper Dojo Pool - Copy.docx  (reasons: win-copy)
- workspace-fixes-summary - Copy.md  (reasons: win-copy)

Review guidance: Verify each file is not referenced by build/test scripts before deletion. Prefer keeping a single source-of-truth config.