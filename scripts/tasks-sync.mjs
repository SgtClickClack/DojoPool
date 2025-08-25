#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs');
const TASKS_MD = path.join(DOCS_DIR, 'tasks.md');
const TASKS_JSON = path.join(DOCS_DIR, 'tasks.json');
const TASKS_BY_SECTION_MD = path.join(DOCS_DIR, 'tasks_by_section.md');

function normalizeTitle(raw) {
  return raw.replace(/^#+\s*/, '').trim();
}

function parseTasksMarkdown(md) {
  const lines = md.split(/\r?\n/);
  const sections = [];
  let current = { title: 'Uncategorized', index: null, tasks: [] };
  const duplicates = new Set();
  const seenIds = new Set();
  const warnings = [];

  const sectionHeaderRe = /^##\s+(.+?)\s*$/; // second-level headers
  const taskLineRe = /^\[( |x|X)\]\s+(\d+)\.\s+(.+?)\s*$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const sh = line.match(sectionHeaderRe);
    if (sh) {
      // push previous section if it has any meaningful content
      if (
        current &&
        (current.index !== null ||
          current.tasks.length > 0 ||
          current.title !== 'Uncategorized')
      ) {
        sections.push(current);
      }
      const title = normalizeTitle(sh[0]).replace(/^##\s+/, '');
      const idxMatch = title.match(/^(\d+)\./);
      const index = idxMatch ? parseInt(idxMatch[1], 10) : null;
      current = { title, index, tasks: [] };
      continue;
    }

    const task = line.match(taskLineRe);
    if (task) {
      const checked = task[1].toLowerCase() === 'x';
      const id = parseInt(task[2], 10);
      const text = task[3].trim();
      if (seenIds.has(id)) {
        duplicates.add(id);
      }
      seenIds.add(id);
      current.tasks.push({
        id,
        text,
        checked,
        status: checked ? 'done' : 'open',
        line: i + 1,
      });
      continue;
    }

    // non-empty lines that look like tasks but malformed
    if (line.trim().startsWith('[') && !task) {
      warnings.push(`Line ${i + 1}: Malformed task line -> ${line}`);
    }
  }

  // push last section
  if (
    current &&
    (current.index !== null ||
      current.tasks.length > 0 ||
      current.title !== 'Uncategorized')
  ) {
    sections.push(current);
  }

  const totals = sections.reduce(
    (acc, s) => {
      for (const t of s.tasks) {
        if (t.checked) acc.done++;
        else acc.open++;
      }
      return acc;
    },
    { open: 0, done: 0 }
  );

  if (duplicates.size > 0) {
    warnings.push(
      `Duplicate task IDs detected: ${Array.from(duplicates)
        .sort((a, b) => a - b)
        .join(', ')}`
    );
  }

  return { sections, totals, warnings };
}

function buildGroupedMarkdown(parsed) {
  const lines = [];
  lines.push('# DojoPool Tasks by Section');
  const now = new Date().toISOString();
  lines.push('');
  lines.push(`Generated: ${now}`);
  lines.push('');
  lines.push(`Totals: Open ${parsed.totals.open}, Done ${parsed.totals.done}`);
  lines.push('');

  for (const s of parsed.sections) {
    const open = s.tasks.filter((t) => !t.checked).length;
    const done = s.tasks.filter((t) => t.checked).length;
    const title = s.title || 'Untitled Section';
    lines.push(`## ${title} (Open ${open} / Done ${done})`);
    for (const t of s.tasks) {
      lines.push(`${t.checked ? '[x]' : '[ ]'} ${t.id}. ${t.text}`);
    }
    lines.push('');
  }

  if (parsed.warnings.length) {
    lines.push('---');
    lines.push('Notes:');
    for (const w of parsed.warnings) lines.push(`- ${w}`);
  }

  return lines.join('\n');
}

async function main() {
  try {
    const md = await fs.readFile(TASKS_MD, 'utf8');
    const parsed = parseTasksMarkdown(md);
    const payload = {
      generatedAt: new Date().toISOString(),
      sections: parsed.sections.map((s) => ({
        title: s.title,
        index: s.index,
        tasks: s.tasks.map(({ id, text, checked, status }) => ({
          id,
          text,
          checked,
          status,
        })),
      })),
      totals: parsed.totals,
      warnings: parsed.warnings,
      source: path.relative(ROOT, TASKS_MD),
    };

    // Ensure docs directory exists
    await fs.mkdir(DOCS_DIR, { recursive: true });

    await fs.writeFile(TASKS_JSON, JSON.stringify(payload, null, 2), 'utf8');
    await fs.writeFile(
      TASKS_BY_SECTION_MD,
      buildGroupedMarkdown(parsed),
      'utf8'
    );

    // Console summary
    const summary = `Tasks sync complete. Open: ${payload.totals.open}, Done: ${payload.totals.done}`;
    if (payload.warnings.length) {
      console.warn(summary);
      for (const w of payload.warnings) console.warn('[warn]', w);
    } else {
      console.log(summary);
    }
  } catch (err) {
    console.error('Failed to sync tasks:', err?.message || err);
    process.exitCode = 1;
  }
}

main();
