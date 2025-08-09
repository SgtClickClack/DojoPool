import path from 'path';
import { readJsonMaybe, readMaybe, explainText, parseArgs } from './_util.js';

async function main() {
  const args = parseArgs();
  const reportPath = args.report || 'coverage/test-results.json';
  const altLog = args.log || 'test_error_output.txt';

  const report = await readJsonMaybe(reportPath);
  if (report) {
    const text = JSON.stringify(report, null, 2);
    const explanation = await explainText({ title: 'Test Results Summary', text });
    console.log(explanation);
    return;
  }

  const logText = await readMaybe(altLog);
  if (logText) {
    const explanation = await explainText({ title: 'Test Failures Summary', text: logText });
    console.log(explanation);
    return;
  }

  console.error('No test results found at ' + reportPath + ' or log at ' + altLog);
  process.exit(2);
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});