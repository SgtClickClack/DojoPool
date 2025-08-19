# Development Tracking Validator Command

## Purpose

This command ensures that development tracking updates are made to the correct files and provides validation to prevent errors.

## Usage

Before updating any development tracking files, run this validation command to ensure you're updating the correct files.

## Command Template

```bash
# Check current tracking file status
node scripts/dev-tracking-validator.js status

# Validate a specific file before updating
node scripts/dev-tracking-validator.js check <file-path>

# Get the next file that should be updated
node scripts/dev-tracking-validator.js next

# Create a template for the next update
node scripts/dev-tracking-validator.js template "Feature Name" "Description"
```

## Validation Rules

### ✅ CORRECT FILES TO UPDATE

- `docs/planning/tracking/index.md` - Index file
- `docs/planning/tracking/part-01.md` - Part 1
- `docs/planning/tracking/part-02.md` - Part 2
- `docs/planning/tracking/part-03.md` - Part 3
- etc.

### ❌ LEGACY FILES (DO NOT UPDATE)

- `DEVELOPMENT_TRACKING_PART_03.md` (root level)
- `DEVELOPMENT_TRACKING_PART_04.md` (root level)
- `docs/DEVELOPMENT_TRACKING.md` (legacy consolidated)

## Workflow

1. **Before making any tracking updates:**

   ```bash
   node scripts/dev-tracking-validator.js status
   ```

2. **When updating a specific file:**

   ```bash
   node scripts/dev-tracking-validator.js check docs/planning/tracking/part-03.md
   ```

3. **To get the next file to update:**

   ```bash
   node scripts/dev-tracking-validator.js next
   ```

4. **To create a template for the next update:**
   ```bash
   node scripts/dev-tracking-validator.js template "Tournament Social Features" "Implemented tournament social features and community engagement system"
   ```

## Error Prevention

This validator will catch common mistakes:

- Attempting to update legacy files
- Updating files in wrong directories
- Using incorrect file names
- Missing required tracking structure

## Integration with Development Workflow

Add this to your development checklist:

- [ ] Run tracking validator before making updates
- [ ] Verify correct file is being updated
- [ ] Use template for consistent formatting
- [ ] Update tracking file after completing features

## Example Output

```
🔍 Development Tracking File Status
==================================================

✅ CORRECT FILES TO UPDATE:
  📄 index.md -> /path/to/docs/planning/tracking/index.md
  📄 part-01.md -> /path/to/docs/planning/tracking/part-01.md
  📄 part-02.md -> /path/to/docs/planning/tracking/part-02.md
  📄 part-03.md -> /path/to/docs/planning/tracking/part-03.md

⚠️  LEGACY FILES (DO NOT UPDATE):
  🚫 /path/to/DEVELOPMENT_TRACKING_PART_03.md
  🚫 /path/to/docs/DEVELOPMENT_TRACKING.md

📋 VALIDATION RESULTS:
  Has index file: ✅
  Has part files: ✅

==================================================
```
