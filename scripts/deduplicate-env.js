const fs = require('fs');

const lines = fs.readFileSync('.env.merged', 'utf8').split(/\r?\n/);
const seen = new Set();
const output = [];

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

fs.writeFileSync('.env.final', output.join('\n'));
console.log('Deduplicated .env.final created.');
