# Tasks Sync Usage

This repository includes an executable checklist at `docs/tasks.md`. To make the plan actionable in automation/CI, use the sync script to produce structured artifacts.

## Command

```
npm run tasks:sync
```

This will parse `docs/tasks.md` and generate:

- `docs/tasks.json` — machine‑readable structure of sections and tasks with totals
- `docs/tasks_by_section.md` — grouped, summarized Markdown view for quick reviews

## Checklist format rules

- Section headers are level 2 Markdown headers, e.g. `## 1. Architecture and Boundaries`
- Tasks are lines starting with a checkbox and numeric id: `[ ] 6. Define clear module boundaries...`
  - Use `[ ]` for open and `[x]` for done (lowercase `x` preferred)
  - Each task must have a unique numeric id before the description
- Non‑conforming lines will be reported as warnings during sync

## Output JSON shape (excerpt)

```json
{
  "generatedAt": "2025-08-20T21:25:00.000Z",
  "sections": [
    {
      "title": "0. Project Hygiene and Baseline",
      "index": 0,
      "tasks": [
        {
          "id": 1,
          "text": "Consolidate duplicate config files...",
          "checked": false,
          "status": "open"
        }
      ]
    }
  ],
  "totals": { "open": 76, "done": 0 },
  "warnings": []
}
```

## Tips

- Edit `docs/tasks.md` to mark progress. Re‑run `npm run tasks:sync` to refresh outputs.
- You can publish `docs/tasks.json` as a CI artifact or use it to drive dashboards.
- Keep task ids stable; avoid renumbering to preserve history.
