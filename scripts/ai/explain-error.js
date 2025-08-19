import fs from 'fs/promises';
import path from 'path';
import { parseArgs, readMaybe, readFromStdin, explainText } from './_util.js';

async function main() {
  const args = parseArgs();
  const logPath = args.log || args.l;
  const title = args.title || args.t || 'Error Report';
  const textArg = args.text || args.e || '';

  let inputText = textArg;
  if (!inputText && logPath) {
    inputText = await readMaybe(logPath);
  }
  if (!inputText && process.stdin.isTTY === false) {
    inputText = await readFromStdin();
  }
  if (!inputText) {
    // Default to repository test error output if present
    inputText = await readMaybe(
      path.resolve(process.cwd(), 'test_error_output.txt')
    );
  }
  if (!inputText) {
    console.error(
      'No error text provided. Use --log <file> or --text "..." or pipe input.'
    );
    process.exit(2);
  }

  const explanation = await explainText({ title, text: inputText });
  console.log(explanation);
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
