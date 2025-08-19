# WebStorm Right-Click Paste Troubleshooting

If mapping right-click (Button2) to "Show Context Menu" didn’t enable paste in all areas (including the AI/Junie chat input), follow this guide.

## 1) Remove conflicting Button2 mappings
- Open Settings > Keymap.
- Search for: `Button2 Click`.
- Expand results and remove Button2 from any actions that don’t need it (right-click the action > Remove Mouse Shortcut).
- Also search for: `Context Menu` and ensure Button2 is assigned wherever available.

## 2) Add Button2 to related actions (varies by build)
Add a `Button2 Click` mouse shortcut to these actions, if they exist in your IDE version:
- Editor Actions > Show Context Menu
- Console Actions > Show Context Menu (a.k.a. Show Console Context Menu)
- Tool Windows > Show Context Menu
- Version Control > Show Context Menu (optional)

Not all actions are present in all builds; add where available. If Button2 is already assigned elsewhere, remove the conflicting assignment.

## 3) Advanced and UI settings
- Settings > Advanced Settings:
  - Enable options related to context menus (search for "context"). Some builds include “Use context menu on right click in tool windows.” Enable it.
- Settings > Appearance & Behavior:
  - If using the New UI, ensure no mouse gesture plugin overrides the right-click.

## 4) Plugin interference
- IdeaVim:
  - Temporarily disable the plugin to test.
  - If you use ~/.ideavimrc, ensure it doesn’t capture mouse events (avoid `set mouse=a`).
- Mouse gesture/productivity plugins:
  - Temporarily disable and test.

## 5) OS/driver interception
- Windows:
  - Pen & Touch: disable “Press and hold for right‑click” (if using touch/stylus).
  - Vendor mouse software: ensure right-click (Button2) isn’t remapped.
- macOS:
  - System Settings > Mouse/Trackpad: ensure secondary click is set (right-side click or two‑finger click).
  - Avoid third‑party remappers capturing secondary click.
- Linux:
  - Check desktop environment mouse settings for secondary button overrides.

## 6) Restart WebStorm
Some contexts pick up keymap changes only after a restart.

## 7) Verification checklist
- Editor: right‑click shows context menu.
- Terminal tool window: right‑click shows context menu.
- Git tool window: right‑click shows context menu.
- AI/Junie chat input: right‑click shows context menu and Paste is enabled.

If the context menu opens but Paste is disabled, ensure you actually have text in the system clipboard and no clipboard security software is blocking IDE access.

## 8) Fallback shortcuts
- Windows/Linux: Ctrl+V or Shift+Insert
- macOS: Cmd+V

## 9) Still not working?
Please report with:
- OS and version
- WebStorm version and Keymap scheme (Windows/Mac OS X/Default copy)
- List of active plugins (especially IdeaVim or mouse/gesture tools)
- Whether the context menu opens in Editor/Terminal/AI chat

This information helps us reproduce and refine the guidance.
