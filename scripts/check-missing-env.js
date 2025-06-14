const fs = require('fs');

const envTemplate = fs.readFileSync('.env.template', 'utf8').split(/\r?\n/);
const envActual = fs.readFileSync('.env', 'utf8').split(/\r?\n/);

const actualMap = {};
for (const line of envActual) {
  if (/^[A-Z0-9_]+=/.test(line)) {
    const [key, ...rest] = line.split('=');
    actualMap[key] = rest.join('=');
  }
}

const missing = [];
for (const line of envTemplate) {
  if (/^[A-Z0-9_]+=/.test(line)) {
    const key = line.split('=')[0];
    if (!(key in actualMap) || actualMap[key].trim() === '') {
      missing.push(key);
    }
  }
}

if (missing.length === 0) {
  console.log('All environment variables are set!');
} else {
  console.log('Missing or blank environment variables:');
  for (const key of missing) {
    console.log('- ' + key);
  }
} 