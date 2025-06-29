# Codebase Cleanup Plan

## Issues Identified

### 1. Multiple Development Tracking Files
- **Problem**: Multiple development tracking files scattered across the codebase
- **Files Found**:
  - `DojoPoolCombined/DEVELOPMENT_TRACKING.md` (✅ CANONICAL - Keep this one)
  - `docs/DEVELOPMENT_TRACKING.md` (❌ DUPLICATE - Remove)
  - `docs/DEVELOPMENT_TRACKING.md.backup` (❌ BACKUP - Remove)
  - `DEVELOPMENT_TRACKING_PART_03.md` (❌ OLD VERSION - Remove)
  - `docs/planning/archive/DEVELOPMENT_TRACKING_CONSOLIDATED.md` (❌ ARCHIVED - Remove)

### 2. Multiple Package.json Files
- **Problem**: 20+ package.json files scattered across the codebase
- **Action**: Review and consolidate where possible, keep only necessary ones

### 3. Multiple Environment Files
- **Problem**: 26+ .env files with various suffixes
- **Files Found**:
  - `.env` (✅ MAIN - Keep)
  - `.env.example` (✅ TEMPLATE - Keep)
  - `.env.full`, `.env.final`, `.env.merged`, `.env.minimal`, `.env.template`, `.env.development`, `.env.local` (❌ CLEANUP NEEDED)

### 4. Misplaced Component Files
- **Problem**: React components in root directory
- **Files**:
  - `TournamentDetail.tsx` (❌ Should be in `src/components/tournament/`)
  - `TournamentList.tsx` (❌ Should be in `src/components/tournament/`)

### 5. Misplaced HTML File
- **Problem**: `index.html` in root should be in `public/`
- **Action**: Move to `public/`

### 6. Multiple Project Directories
- **Problem**: Confusing directory structure
- **Directories**:
  - `DojoPool/` (❌ EMPTY - Remove)
  - `DojoPoolMobile/` (✅ MOBILE APP - Keep)
  - `DojoPoolCombined/` (✅ TRACKING - Keep)

### 7. Bad File Names
- **Problem**: Files with confusing prefixes/suffixes
- **Files**:
  - `[PKG]package.json` (❌ BAD NAMING)
  - `[PY]run.py` (❌ BAD NAMING)
  - `[TEST]ExperimentPage.tsx` (❌ BAD NAMING)
  - `[BUILD]build-wasm.js` (❌ BAD NAMING)
  - `[CONFIG].babelrc` (❌ BAD NAMING)
  - `[CONFIG]config-overrides.js` (❌ BAD NAMING)
  - `[CONFIG]jsconfig.json` (❌ BAD NAMING)

### 8. Duplicate Configuration Files
- **Problem**: Multiple config files for same purpose
- **Files**:
  - `jest.config.js` and `jest.setup.ts` and `jest.setup.dom.ts` (Review)
  - `vitest.config.ts` and `vitest.integration.config.ts` (Review)
  - `tsconfig.json` (Multiple locations)

### 9. Temporary/Backup Files
- **Problem**: Files that should be cleaned up
- **Files**:
  - `untracked_backup/` (❌ REMOVE)
  - `pocket_pick_backup.db` (❌ REMOVE)
  - `package-lock-DESKTOP-4VU5UQ2.json` (❌ REMOVE)
  - Various `.env.*` files (❌ CLEANUP)

## Cleanup Actions

### Phase 1: Remove Duplicate Development Tracking
1. Keep only `DojoPoolCombined/DEVELOPMENT_TRACKING.md`
2. Remove all other development tracking files
3. Update any references to point to the canonical file

### Phase 2: Clean Environment Files
1. Keep `.env` and `.env.example`
2. Remove all other `.env.*` files
3. Update documentation to reference correct files

### Phase 3: Move Misplaced Files
1. Move `TournamentDetail.tsx` to `src/components/tournament/`
2. Move `TournamentList.tsx` to `src/components/tournament/`
3. Move `index.html` to `public/`

### Phase 4: Remove Bad File Names
1. Rename files with bad prefixes/suffixes
2. Remove empty directories
3. Clean up temporary files

### Phase 5: Consolidate Configuration
1. Review and consolidate duplicate config files
2. Keep only necessary package.json files
3. Clean up test configuration files

## Expected Outcome
- Clean, organized codebase structure
- Single source of truth for development tracking
- Proper file organization
- Removed duplicates and temporary files
- Clear naming conventions 