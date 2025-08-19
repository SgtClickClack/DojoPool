# Qodana Local Setup and Usage (Windows-friendly)

This guide shows how to analyze the DojoPool code locally with JetBrains Qodana CLI as requested.

Configuration is already included at the repository root in `qodana.yaml` (linter: `jetbrains/qodana-js:2025.1`).

## 1) Install the Qodana CLI

Windows (PowerShell with Scoop):

```
scoop bucket add jetbrains https://github.com/JetBrains/scoop-utils
scoop install qodana
```

Alternative via Go (cross-platform):

```
go install github.com/JetBrains/qodana-cli@latest
```

Tip: If `scoop` is not installed, see https://scoop.sh/.

## 2) Run the scan

Set your Qodana token (if you have one) and start a scan from the repo root.

PowerShell:

```
$env:QODANA_TOKEN = "<your-token>"
qodana scan
```

Alternatively, use the provided npm scripts:

```
npm run qodana:scan
```

Or open the report automatically in your browser:

```
npm run qodana:ui
```

Or use the Windows helper script (installs Qodana via Scoop if missing):

```
.\run_qodana.ps1 -Token "<your-token>" -ShowReport
```

You can also pass extra CLI arguments:

```
.\run_qodana.ps1 -AdditionalArgs @('--results-dir=.qodana', '--baseline=.qodana.baseline')
```

## 3) View the results

- With `--show-report`, Qodana opens the UI in your default browser.
- Reports are stored under the `.qodana` directory. You can also open the generated HTML report from there.

## Troubleshooting

- "qodana is not recognized":
  - Ensure Qodana CLI is installed (see step 1) or run the helper script which attempts installation via Scoop.
- PowerShell script execution policy:
  - If blocked, run in the current session: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
- Proxy/network issues with Scoop:
  - Install Qodana via Go instead: `go install github.com/JetBrains/qodana-cli@latest`

## Notes

- Qodana configuration lives in `qodana.yaml`. Adjust inspections or linter as needed.
- For IDE-based usage, see `WEBSTORM_CONFIGURATION_SUMMARY.md` and the Qodana tab in JetBrains IDEs.
