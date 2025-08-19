# WebStorm + pnpm Workspace: Diagnose and Fix Dependency Issues

This guide helps you configure WebStorm correctly for the monorepo (pnpm workspace) and fix dependency installation issues that can occur due to misconfiguration or corrupted caches.

Last updated: 2025-08-11

---

## 1) Configure WebStorm's Package Manager (pnpm)

1. Open WebStorm Settings: File > Settings (Ctrl+Alt+S)
2. Go to: Languages & Frameworks > Node.js
3. Set Package manager to: pnpm
4. Click Apply, then OK

This ensures WebStorm uses pnpm for scripts, inspections, and the integrated terminal.

---

## 2) Clean the Project (Full Reset)

Run these commands in WebStorm's Terminal (PowerShell on Windows). Stop any running dev servers first (Ctrl+C).

```powershell
# Remove Node modules and lockfile at repo root
if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
if (Test-Path pnpm-lock.yaml) { Remove-Item -Force pnpm-lock.yaml }

# Remove common build caches
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
if (Test-Path dist) { Remove-Item -Recurse -Force dist }

# Prune pnpm store (global cache)
pnpm store prune
```

Alternatively, you can run the helper script:

```powershell
# From the repository root
powershell -ExecutionPolicy Bypass -File .\scripts\clean-pnpm-workspace.ps1
```

---

## 3) Re-install Dependencies (from inside WebStorm)

Run the install at the repository root:

```powershell
pnpm install
```

If you prefer, you can install per workspace package after the root install.

---

## 4) If Installation Still Fails

- Ensure the Package manager is set to pnpm (Step 1)
- Confirm Node.js interpreter is Node 20+ (Settings > Languages & Frameworks > Node.js)
- Share the exact error output from the WebStorm terminal for further diagnosis

---

## Notes for Monorepo

- Root workspace file: pnpm-workspace.yaml
- Use pnpm run -r <script> to run scripts across all packages
- For CI, prefer caching the pnpm store directory to speed up installs
