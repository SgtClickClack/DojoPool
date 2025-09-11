#!/usr/bin/env node
/**
 * Development Tracking Validator
 * Ensures correct tracking files are updated and provides validation.
 */

const fs = require('fs');
const path = require('path');

class DevTrackingValidator {
  constructor(projectRoot = '.') {
    this.projectRoot = path.resolve(projectRoot);
    this.correctTrackingDir = path.join(
      this.projectRoot,
      'docs',
      'planning',
      'tracking'
    );
    this.milestonesDir = path.join(this.projectRoot, 'docs', 'milestones');
    this.legacyFiles = [
      path.join(this.projectRoot, 'DEVELOPMENT_TRACKING_PART_03.md'),
      path.join(this.projectRoot, 'DEVELOPMENT_TRACKING_PART_04.md'),
      path.join(this.projectRoot, 'docs', 'DEVELOPMENT_TRACKING.md'),
      path.join(
        this.projectRoot,
        'DojoPoolCombined',
        'DEVELOPMENT_TRACKING.md'
      ),
    ];
  }

  getCorrectTrackingFiles() {
    const files = {};
    if (fs.existsSync(this.correctTrackingDir)) {
      const items = fs.readdirSync(this.correctTrackingDir);
      items.forEach((item) => {
        if (
          item.endsWith('.md') &&
          (item.startsWith('part-') || item === 'index.md')
        ) {
          files[item] = path.join(this.correctTrackingDir, item);
        }
      });
    }
    if (fs.existsSync(this.milestonesDir)) {
      const items = fs.readdirSync(this.milestonesDir);
      items.forEach((item) => {
        if (item.endsWith('.md')) {
          files[`milestones/${item}`] = path.join(this.milestonesDir, item);
        }
      });
    }
    return files;
  }

  getLegacyFiles() {
    return this.legacyFiles.filter((file) => fs.existsSync(file));
  }

  validateTrackingStructure() {
    const result = {
      correctFiles: this.getCorrectTrackingFiles(),
      legacyFiles: this.getLegacyFiles(),
      hasIndex: false,
      hasParts: false,
      warnings: [],
    };

    // Check for index file
    if (result.correctFiles['index.md']) {
      result.hasIndex = true;
    }

    // Check for part files
    const partFiles = Object.keys(result.correctFiles).filter((name) =>
      name.startsWith('part-')
    );
    if (partFiles.length > 0) {
      result.hasParts = true;
    }

    // Generate warnings
    if (!result.hasIndex) {
      result.warnings.push('Missing index.md in tracking directory');
    }
    if (!result.hasParts) {
      result.warnings.push('No part-*.md files found in tracking directory');
    }
    if (result.legacyFiles.length > 0) {
      result.warnings.push(
        `Found ${result.legacyFiles.length} legacy files that should NOT be updated`
      );
    }

    return result;
  }

  printStatus() {
    console.log('🔍 Development Tracking File Status');
    console.log('='.repeat(50));

    const validation = this.validateTrackingStructure();

    console.log('\n✅ CORRECT FILES TO UPDATE:');
    if (Object.keys(validation.correctFiles).length > 0) {
      Object.entries(validation.correctFiles).forEach(([name, filePath]) => {
        console.log(`  📄 ${name} -> ${filePath}`);
      });
    } else {
      console.log('  ❌ No correct tracking files found!');
    }

    console.log('\n⚠️  LEGACY FILES (DO NOT UPDATE):');
    if (validation.legacyFiles.length > 0) {
      validation.legacyFiles.forEach((filePath) => {
        console.log(`  🚫 ${filePath}`);
      });
    } else {
      console.log('  ✅ No legacy files found');
    }

    console.log('\n📋 VALIDATION RESULTS:');
    console.log(`  Has index file: ${validation.hasIndex ? '✅' : '❌'}`);
    console.log(`  Has part files: ${validation.hasParts ? '✅' : '❌'}`);

    if (validation.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      validation.warnings.forEach((warning) => {
        console.log(`  • ${warning}`);
      });
    }

    console.log('\n' + '='.repeat(50));
  }

  getNextPartFile() {
    const correctFiles = this.getCorrectTrackingFiles();
    const partFiles = Object.entries(correctFiles)
      .filter(([name]) => name.startsWith('part-'))
      .sort(([a], [b]) => a.localeCompare(b));

    if (partFiles.length === 0) {
      return null;
    }

    return partFiles[partFiles.length - 1][1];
  }

  createUpdateTemplate(featureName, description) {
    const nextFile = this.getNextPartFile();
    if (!nextFile) {
      return '❌ No tracking files found!';
    }

    const currentDate = new Date().toISOString().split('T')[0];

    return `### ${currentDate}: ${featureName}

**Description:**
${description}

**Core Components Implemented:**
- Component 1 - Description
- Component 2 - Description
- Component 3 - Description

**Key Features:**
- Feature 1
- Feature 2
- Feature 3

**Integration Points:**
- Integrates with existing service X
- Connects with component Y
- Supports integration Z

**File Paths:**
- src/path/to/component1.ts
- src/path/to/component2.tsx
- src/pages/path/to/page.tsx

**Technical Implementation:**
- Technical detail 1
- Technical detail 2
- Technical detail 3

**Next Priority Task:**
Implement next feature

Expected completion time: X hours

`;
  }

  checkFileExists(filePath) {
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.projectRoot, filePath);
    return fs.existsSync(fullPath);
  }

  suggestCorrectFile(attemptedFile) {
    const attemptedPath = path.resolve(attemptedFile);

    // If it's a legacy file, suggest the correct one
    if (this.legacyFiles.includes(attemptedPath)) {
      return this.getNextPartFile();
    }

    // If it's not in the correct directory, suggest the correct one
    if (!attemptedPath.startsWith(this.correctTrackingDir)) {
      return this.getNextPartFile();
    }

    return null;
  }

  validateUpdate(filePath) {
    const attemptedPath = path.resolve(filePath);
    const correctFiles = this.getCorrectTrackingFiles();
    const legacyFiles = this.getLegacyFiles();

    console.log('🔍 Validating tracking file update...');
    console.log(`Attempted file: ${attemptedPath}`);

    // Check if it's a legacy file
    if (legacyFiles.includes(attemptedPath)) {
      console.log('❌ ERROR: Attempting to update a legacy file!');
      console.log('✅ SUGGESTION: Use one of these files instead:');
      Object.entries(correctFiles).forEach(([name, correctPath]) => {
        console.log(`  📄 ${name} -> ${correctPath}`);
      });
      return false;
    }

    // Check if it's in the correct directory
    if (!attemptedPath.startsWith(this.correctTrackingDir)) {
      console.log('❌ ERROR: File not in correct tracking directory!');
      console.log(`Expected directory: ${this.correctTrackingDir}`);
      console.log('✅ SUGGESTION: Use one of these files instead:');
      Object.entries(correctFiles).forEach(([name, correctPath]) => {
        console.log(`  📄 ${name} -> ${correctPath}`);
      });
      return false;
    }

    // Check if it's a valid tracking file
    const fileName = path.basename(attemptedPath);
    if (!correctFiles[fileName]) {
      console.log('❌ ERROR: Not a valid tracking file!');
      console.log('✅ SUGGESTION: Use one of these files instead:');
      Object.entries(correctFiles).forEach(([name, correctPath]) => {
        console.log(`  📄 ${name} -> ${correctPath}`);
      });
      return false;
    }

    console.log('✅ SUCCESS: Valid tracking file!');
    return true;
  }
}

// Command line interface
if (require.main === module) {
  const validator = new DevTrackingValidator();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    validator.printStatus();
  } else {
    const command = args[0];

    switch (command) {
      case 'status':
        validator.printStatus();
        break;
      case 'template':
        if (args.length < 3) {
          console.log(
            'Usage: node dev-tracking-validator.js template "Feature Name" "Description"'
          );
          process.exit(1);
        }
        const template = validator.createUpdateTemplate(args[1], args[2]);
        console.log(template);
        break;
      case 'next':
        const nextFile = validator.getNextPartFile();
        if (nextFile) {
          console.log(`Next file to update: ${nextFile}`);
        } else {
          console.log('No tracking files found!');
        }
        break;
      case 'validate':
        const validation = validator.validateTrackingStructure();
        if (validation.warnings.length > 0) {
          console.log('❌ Validation failed!');
          validation.warnings.forEach((warning) => {
            console.log(`  • ${warning}`);
          });
          process.exit(1);
        } else {
          console.log('✅ Validation passed!');
        }
        break;
      case 'check':
        if (args.length < 2) {
          console.log(
            'Usage: node dev-tracking-validator.js check <file-path>'
          );
          process.exit(1);
        }
        validator.validateUpdate(args[1]);
        break;
      default:
        console.log(
          'Unknown command. Use: status, template, next, validate, or check'
        );
        process.exit(1);
    }
  }
}

module.exports = DevTrackingValidator;
