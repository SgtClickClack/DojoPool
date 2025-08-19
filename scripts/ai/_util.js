import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function ensureApiKey() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
  if (!apiKey) {
    console.error(
      'Missing OPENAI_API_KEY env var. Set it before running this command.'
    );
    process.exit(1);
  }
  return apiKey;
}

export function getModel() {
  return process.env.AI_MODEL || 'gpt-4o-mini';
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const [key, maybeVal] = token.replace(/^--/, '').split('=');
      if (maybeVal !== undefined) {
        args[key] = maybeVal;
      } else {
        const next = argv[i + 1];
        if (!next || next.startsWith('--')) {
          args[key] = true;
        } else {
          args[key] = next;
          i += 1;
        }
      }
    } else if (!args._) {
      args._ = [token];
    } else {
      args._.push(token);
    }
  }
  return args;
}

export async function readMaybe(filePath) {
  if (!filePath) return '';
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return '';
  }
}

export async function readFromStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
  });
}

export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
  return dirPath;
}

export function timestampSlug() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return [
    d.getUTCFullYear(),
    pad(d.getUTCMonth() + 1),
    pad(d.getUTCDate()),
    pad(d.getUTCHours()),
    pad(d.getUTCMinutes()),
    pad(d.getUTCSeconds()),
  ].join('');
}

export function safeBasename(p) {
  if (!p) return 'unknown';
  return path.basename(p).replace(/[^a-zA-Z0-9_.-]/g, '_');
}

export async function writeText(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf8');
  return filePath;
}

export async function readJsonMaybe(filePath) {
  try {
    const txt = await fs.readFile(filePath, 'utf8');
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

export function runGit(command) {
  try {
    return execSync(`git ${command}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return '';
  }
}

export function getGitDiff({ staged = false } = {}) {
  const cmd = staged
    ? 'diff --staged --patch --minimal'
    : 'diff --patch --minimal';
  return runGit(cmd) || '';
}

export function getGitChangedFiles({ staged = false } = {}) {
  const cmd = staged ? 'diff --staged --name-only' : 'diff --name-only';
  const out = runGit(cmd);
  return out ? out.split('\n').filter(Boolean) : [];
}

export async function createOpenAIClient() {
  const apiKey = ensureApiKey();
  return new OpenAI({ apiKey });
}

export async function chatComplete({
  system,
  user,
  model = getModel(),
  temperature = 0.2,
  maxTokens = 2048,
}) {
  const client = await createOpenAIClient();
  const res = await client.chat.completions.create({
    model,
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  return res.choices?.[0]?.message?.content?.trim() || '';
}

export async function proposeFullFileRewrite({
  filePath,
  code,
  instruction,
  model = getModel(),
  temperature = 0.1,
  maxTokens = 4096,
}) {
  const system = [
    'You are an expert software engineer. When asked to modify a file, return ONLY the full updated file content.',
    'Do not include explanations or code fences. Preserve project conventions and imports.',
  ].join('\n');
  const user = [
    `File path: ${filePath}`,
    'Instruction:',
    instruction,
    '--- Current file content ---',
    code,
    '--- End current file content ---',
  ].join('\n');
  return chatComplete({ system, user, model, temperature, maxTokens });
}

export async function explainText({
  title = 'Issue',
  text,
  model = getModel(),
  style = 'plain',
}) {
  const system = [
    'You explain software errors and logs in concise, plain language, with actionable advice.',
    'Return clear bullet points and short sections. Prefer high-signal, low-noise guidance.',
  ].join('\n');
  const user = [
    `Title: ${title}`,
    'Content:',
    text || '(no content provided)',
    '',
    'Please provide:',
    '1) Summary (1-2 lines).',
    '2) Likely root causes.',
    '3) Concrete fixes (code-level where possible).',
    '4) Prevention tips.',
    '5) If applicable, minimal reproduction steps.',
  ].join('\n');
  return chatComplete({
    system,
    user,
    model,
    temperature: 0.2,
    maxTokens: 2048,
  });
}

export async function unifiedDiff(oldPath, newPath) {
  try {
    const out = execSync(
      `git --no-pager diff --no-index --minimal -- ${oldPath} ${newPath}`,
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }
    );
    return out;
  } catch (err) {
    // If exit code non-zero when differences exist, still capture output from err.stdout if available
    try {
      return err.stdout?.toString?.() || '';
    } catch {
      return '';
    }
  }
}
