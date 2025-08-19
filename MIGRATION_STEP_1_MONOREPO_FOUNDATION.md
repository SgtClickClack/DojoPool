# Migration Step 1: Create the Monorepo Foundation

This document provides step-by-step Windows PowerShell commands to initialize a pnpm/TurboRepo monorepo and create placeholder apps (web, api) and key packages (prisma, types, config).

Notes:
- These commands are idempotent where possible (they check for existing files/folders before creating).
- They assume you are at the repository root.
- Adjust organization/package names if needed.

## 0) Prerequisites

```powershell
# Ensure Node.js 20+ is installed
node -v

# Install pnpm if not installed
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) { npm i -g pnpm } ; pnpm -v
```

## 1) Initialize workspace + Turborepo

```powershell
# Initialize package.json if missing
if (-not (Test-Path package.json)) { npm init -y }

# Ensure monorepo tools are present (workspace root)
pnpm add -D -w turbo typescript prettier eslint

# Set package manager and type in package.json (optional if already set)
# You can edit package.json manually or run a quick jq/sed replacement if desired.
```

## 2) Create pnpm-workspace.yaml

```powershell
$workspace = @"packages:
  - apps/*
  - services/*
  - packages/*
"@
if (-not (Test-Path .\pnpm-workspace.yaml)) { Set-Content -Path .\pnpm-workspace.yaml -Value $workspace -Encoding UTF8 }
```

## 3) Create turbo.json

```powershell
$turbo = @"{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", "build/**", ".next/**"] },
    "dev": { "cache": false, "persistent": true, "dependsOn": ["^build"] },
    "lint": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] },
    "type-check": { "dependsOn": ["^build"] },
    "start": { "dependsOn": ["build"] }
  }
}
"@
if (-not (Test-Path .\turbo.json)) { Set-Content -Path .\turbo.json -Value $turbo -Encoding UTF8 }
```

## 4) Scaffold folders

```powershell
# Create workspace folders if missing
mkdir apps -ErrorAction SilentlyContinue | Out-Null
mkdir services -ErrorAction SilentlyContinue | Out-Null
mkdir packages -ErrorAction SilentlyContinue | Out-Null

# Create app and service directories
mkdir apps\web -ErrorAction SilentlyContinue | Out-Null
mkdir services\api -ErrorAction SilentlyContinue | Out-Null

# Create key packages
mkdir packages\prisma -ErrorAction SilentlyContinue | Out-Null
mkdir packages\types -ErrorAction SilentlyContinue | Out-Null
mkdir packages\config -ErrorAction SilentlyContinue | Out-Null
```

## 5) Minimal package.json files for apps and packages

```powershell
# apps/web
$webPkg = @"{
  "name": "@dojopool/web",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "eslint .",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "15.3.5",
    "react": "18.2.0",
    "react-dom": "18.2.0"
  }
}
"@
if (-not (Test-Path .\apps\web\package.json)) { Set-Content -Path .\apps\web\package.json -Value $webPkg -Encoding UTF8 }

# services/api
$apiPkg = @"{
  "name": "@dojopool/api",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "test": "vitest run"
  },
  "dependencies": {
    "express": "4.21.2"
  },
  "devDependencies": {
    "typescript": "5.8.3",
    "ts-node": "10.9.2",
    "nodemon": "3.1.9"
  }
}
"@
if (-not (Test-Path .\services\api\package.json)) { Set-Content -Path .\services\api\package.json -Value $apiPkg -Encoding UTF8 }

# packages/prisma
$prismaPkg = @"{
  "name": "@dojopool/prisma",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "generate": "prisma generate",
    "migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@prisma/client": "6.6.0",
    "prisma": "6.6.0"
  }
}
"@
if (-not (Test-Path .\packages\prisma\package.json)) { Set-Content -Path .\packages\prisma\package.json -Value $prismaPkg -Encoding UTF8 }

# packages/types
$typesPkg = @"{
  "name": "@dojopool/types",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "exports": { ".": "./src/index.ts" }
}
"@
if (-not (Test-Path .\packages\types\package.json)) { Set-Content -Path .\packages\types\package.json -Value $typesPkg -Encoding UTF8 }

# packages/config
$configPkg = @"{
  "name": "@dojopool/config",
  "private": true,
  "version": "0.0.0",
  "type": "module"
}
"@
if (-not (Test-Path .\packages\config\package.json)) { Set-Content -Path .\packages\config\package.json -Value $configPkg -Encoding UTF8 }
```

## 6) Minimal source stubs (optional but helpful)

```powershell
# web index and tsconfig
if (-not (Test-Path .\apps\web\src)) { mkdir .\apps\web\src | Out-Null }
$webIndex = @"export default function Home() { return null }
"@
if (-not (Test-Path .\apps\web\src\index.tsx)) { Set-Content -Path .\apps\web\src\index.tsx -Value $webIndex -Encoding UTF8 }

# api index and tsconfig
if (-not (Test-Path .\services\api\src)) { mkdir .\services\api\src | Out-Null }
$apiIndex = @"import express from 'express';
const app = express();
app.get('/health', (_req, res) => res.json({ ok: true }));
app.listen(8080, () => console.log('API listening on 8080'));
"@
if (-not (Test-Path .\services\api\src\index.ts)) { Set-Content -Path .\services\api\src\index.ts -Value $apiIndex -Encoding UTF8 }
```

## 7) Root scripts (turbo)

```powershell
# Add useful root scripts (edit package.json if needed)
# dev:    turbo run dev
# build:  turbo run build
# start:  turbo run start
```

## 8) Install and verify

```powershell
pnpm install

# Build all
pnpm run build

# Dev (in one terminal)
pnpm run dev

# Or run individually
pnpm --filter @dojopool/web dev
pnpm --filter @dojopool/api dev
```

That’s it. You now have a pnpm/TurboRepo monorepo with placeholder apps (web, api) and key packages (prisma, types, config).
