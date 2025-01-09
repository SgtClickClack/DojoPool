#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');

// Configuration
const REQUIRED_FILES = [
  'README.md',
  'package.json',
  'tsconfig.json',
  '.eslintrc.js',
  '.prettierrc',
  '.gitignore'
];

const REQUIRED_SCRIPTS = [
  'build',
  'test',
  'lint',
  'type-check'
];

const REQUIRED_DEPENDENCIES = [
  'typescript',
  'eslint',
  'prettier',
  'jest'
];

// Utility functions
function checkFile(file) {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(
    `${exists ? chalk.green('✓') : chalk.red('✗')} ${file}`
  );
  return exists;
}

function checkPackageJson() {
  const pkg = require(path.join(process.cwd(), 'package.json'));
  
  // Check scripts
  const missingScripts = REQUIRED_SCRIPTS.filter(
    script => !pkg.scripts[script]
  );
  
  if (missingScripts.length) {
    console.log(chalk.red('\nMissing required scripts:'));
    missingScripts.forEach(script => {
      console.log(chalk.red(`  - ${script}`));
    });
  }
  
  // Check dependencies
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies
  };
  
  const missingDeps = REQUIRED_DEPENDENCIES.filter(
    dep => !allDeps[dep]
  );
  
  if (missingDeps.length) {
    console.log(chalk.red('\nMissing required dependencies:'));
    missingDeps.forEach(dep => {
      console.log(chalk.red(`  - ${dep}`));
    });
  }
  
  return !missingScripts.length && !missingDeps.length;
}

function checkTypeScript() {
  try {
    execSync('npm run type-check', { stdio: 'inherit' });
    return true;
  } catch (error) {
    return false;
  }
}

function checkLinting() {
  try {
    execSync('npm run lint', { stdio: 'inherit' });
    return true;
  } catch (error) {
    return false;
  }
}

function checkTests() {
  try {
    execSync('npm run test', { stdio: 'inherit' });
    return true;
  } catch (error) {
    return false;
  }
}

function checkGitHooks() {
  const hooksPath = path.join(process.cwd(), '.git', 'hooks');
  const requiredHooks = ['pre-commit', 'pre-push'];
  
  const missingHooks = requiredHooks.filter(
    hook => !fs.existsSync(path.join(hooksPath, hook))
  );
  
  if (missingHooks.length) {
    console.log(chalk.red('\nMissing Git hooks:'));
    missingHooks.forEach(hook => {
      console.log(chalk.red(`  - ${hook}`));
    });
  }
  
  return !missingHooks.length;
}

function checkDocumentation() {
  const docs = path.join(process.cwd(), 'docs');
  const requiredDocs = [
    'README.md',
    'CONTRIBUTING.md',
    'CODE_OF_CONDUCT.md'
  ];
  
  const missingDocs = requiredDocs.filter(
    doc => !fs.existsSync(path.join(docs, doc))
  );
  
  if (missingDocs.length) {
    console.log(chalk.red('\nMissing documentation:'));
    missingDocs.forEach(doc => {
      console.log(chalk.red(`  - ${doc}`));
    });
  }
  
  return !missingDocs.length;
}

// Main execution
console.log(chalk.blue('Checking project standards...\n'));

console.log(chalk.yellow('Required Files:'));
const filesOk = REQUIRED_FILES.every(checkFile);

console.log(chalk.yellow('\nPackage Configuration:'));
const pkgOk = checkPackageJson();

console.log(chalk.yellow('\nType Checking:'));
const typesOk = checkTypeScript();

console.log(chalk.yellow('\nLinting:'));
const lintOk = checkLinting();

console.log(chalk.yellow('\nTests:'));
const testsOk = checkTests();

console.log(chalk.yellow('\nGit Hooks:'));
const hooksOk = checkGitHooks();

console.log(chalk.yellow('\nDocumentation:'));
const docsOk = checkDocumentation();

// Summary
console.log('\n' + chalk.blue('Summary:'));
console.log(`Files: ${filesOk ? chalk.green('✓') : chalk.red('✗')}`);
console.log(`Package: ${pkgOk ? chalk.green('✓') : chalk.red('✗')}`);
console.log(`Types: ${typesOk ? chalk.green('✓') : chalk.red('✗')}`);
console.log(`Lint: ${lintOk ? chalk.green('✓') : chalk.red('✗')}`);
console.log(`Tests: ${testsOk ? chalk.green('✓') : chalk.red('✗')}`);
console.log(`Hooks: ${hooksOk ? chalk.green('✓') : chalk.red('✗')}`);
console.log(`Docs: ${docsOk ? chalk.green('✓') : chalk.red('✗')}`);

// Exit with appropriate code
const success = 
  filesOk && 
  pkgOk && 
  typesOk && 
  lintOk && 
  testsOk && 
  hooksOk && 
  docsOk;

if (success) {
  console.log(chalk.green('\n✨ All standards met!'));
  process.exit(0);
} else {
  console.log(chalk.red('\n❌ Some standards are not met.'));
  process.exit(1);
} 