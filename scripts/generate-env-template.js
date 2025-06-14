const fs = require('fs');
const glob = require('glob');

const patterns = [
  /process\.env\.([A-Z0-9_]+)/g,
  /os\.environ\[['"]([A-Z0-9_]+)['"]\]/g,
  /os\.getenv\(['"]([A-Z0-9_]+)['"]/g,
];

const files = glob.sync('**/*.{js,ts,tsx,jsx,py}', { ignore: ['node_modules/**', '.venv*/**', 'coverage/**', 'dist/**', 'build/**'] });
const vars = new Set();

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content))) {
      vars.add(match[1]);
    }
  }
}

const sorted = Array.from(vars).sort();
const output = sorted.map(v => `${v}=`).join('\n');
fs.writeFileSync('.env.template', output);
console.log('Generated .env.template with all detected environment variables.'); 