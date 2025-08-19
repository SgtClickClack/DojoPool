const fs = require('fs');
const glob = require('glob');

const envFiles = glob
  .sync('.env*', { nodir: true })
  .filter(
    (f) =>
      !f.endsWith('.final') &&
      !f.endsWith('.template') &&
      !f.endsWith('.merged')
  );
const seen = new Set();
const output = [];

for (const file of envFiles) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (/^[A-Z0-9_]+=/.test(line)) {
      const key = line.split('=')[0];
      if (!seen.has(key)) {
        output.push(line);
        seen.add(key);
      }
    } else if (line.trim() === '' || line.trim().startsWith('#')) {
      output.push(line);
    }
  }
}

fs.writeFileSync('.env.final', output.join('\n'));
console.log('Merged and deduplicated .env.final created from all .env* files.');
