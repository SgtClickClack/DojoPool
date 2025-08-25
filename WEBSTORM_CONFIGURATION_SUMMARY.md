# WebStorm Configuration Summary

## Overview

This document summarizes the WebStorm configurations that have been implemented for the DojoPool project to enhance development productivity and code quality.

## Configurations Implemented

### 1. Run/Debug Configuration

- Created a Run Configuration named "Start DojoPool" for the `npm run dev` script
- Configuration file: `.idea/runConfigurations/Start_DojoPool.xml`
- This allows starting the development server with a single click

### 2. Code Quality Tools

#### ESLint Integration

- Configured automatic ESLint integration
- Configuration file: `.idea/jsLinters/eslint.xml`
- Set to use the project's ESLint configuration file
- Enabled automatic error highlighting and fix-on-save

#### Prettier Integration

- Configured Prettier for automatic code formatting
- Configuration file: `.idea/prettier.xml`
- Enabled format-on-save and format-on-reformat
- Set to apply to all relevant file types (JS, TS, JSX, TSX, CSS, etc.)

### 3. Git Integration

- Verified Git integration is properly configured
- Configuration file: `.idea/vcs.xml`
- The Git tool window is active and accessible at the bottom of the screen
- Allows managing branches, commits, and other Git operations directly from WebStorm

### 4. Database Connection

- Configured PostgreSQL database connection
- Configuration file: `.idea/dataSources.xml`
- Connection details:
  - Host: localhost
  - Port: 5432
  - Database: dojopool
  - Username: dojopool
- The Database tool window is accessible on the right-hand sidebar
- Allows browsing tables, running SQL queries, and managing data directly in WebStorm

### 5. Node.js and Package Management

- Verified Node.js interpreter configuration (Node.js 20)
- Package manager set to pnpm workspace
- Configuration file: `.idea/jsPackageManagers.xml`

### 6. TypeScript Settings

- IDE uses the workspace TypeScript from `node_modules/typescript`
- Path aliases (e.g., `@/*`) are resolved from `tsconfig.json`
- Configuration file: `.idea/TypeScript.xml`

### 7. Actions on Save

- Reformat with Prettier on save
- Run ESLint --fix on save
- Optimize imports on the fly
- Trim trailing whitespace (via `.editorconfig`)
- Configuration files: `.idea/prettier.xml`, `.idea/jsLinters/eslint.xml`, `.idea/codeStyles/Project.xml`, `.editorconfig`

### 8. AI Assistant Directives

- Added project-wide directives for AI tools to adhere to NestJS (backend), Next.js (frontend), and Prisma (DB)
- Prefer modern patterns (React function components with Hooks)
- Documentation file: `AI_ASSISTANT_DIRECTIVES.md`

## Documentation

A comprehensive guide has been created to help developers use these configurations:

- Documentation file: `docs/webstorm_configuration_guide.md`
- Includes detailed instructions for using each feature
- Provides keyboard shortcuts and troubleshooting tips
- Troubleshooting includes AI Assistant connectivity error: "Failed to resolve JetBrains AI cloud URL" with firewall/DNS fixes
- For pnpm workspace setup and dependency fix steps, see `WEBSTORM_PNPM_WORKSPACE_SETUP.md` and the helper script `.\\scripts\\clean-pnpm-workspace.ps1`

## Benefits

These configurations provide the following benefits:

1. **Improved Developer Experience**: Single-click application startup and integrated tools
2. **Consistent Code Quality**: Automatic linting and formatting
3. **Streamlined Version Control**: Integrated Git operations
4. **Efficient Database Management**: Direct database access within the IDE
5. **Reduced Context Switching**: Less need to switch between the IDE and external tools

## Next Steps

Developers should:

1. Review the `docs/webstorm_configuration_guide.md` file for detailed usage instructions
2. For dependency install errors in WebStorm, follow `WEBSTORM_PNPM_WORKSPACE_SETUP.md` and consider running `.\\scripts\\clean-pnpm-workspace.ps1`
3. Enter their database password when prompted on first connection
4. Customize any personal preferences as needed while maintaining project-wide configurations

## Right-Click Paste (Show Context Menu) Configuration

Some users reported that right-click paste was not working in certain IDE areas (including the Junie chat input). This behavior depends on WebStorm’s keymap. To ensure consistent right-click paste across all tool windows, map the standard right-click to the “Show Context Menu” action.

### Option A: Prompt for Junie (Automated attempt)

You can ask Junie to try to configure this automatically. Copy and paste the following prompt:

> Hello Junie. Please configure the IDE's keymap settings. I need you to ensure that the standard right-click mouse action is mapped to "Show Context Menu" across all tool windows, including your own chat input field. This will enable the right-click paste functionality.

Note: This relies on IDE-level capabilities and may or may not succeed in your environment.

### Option B: Manual Method (Recommended)

This is the reliable approach and takes less than a minute:

1. Open Settings
   - Windows/Linux: File > Settings
   - macOS: WebStorm > Settings
2. Go to Keymap.
3. Use the search box and type: Show Context Menu.
4. In the results, right-click “Show Context Menu” and choose Add Mouse Shortcut.
5. In the “Enter Mouse Shortcut” dialog, right-click once inside the box. It should register as Button2 Click.
6. Click OK, then Apply, then OK to close the settings.

If WebStorm warns that Button2 is already assigned to another action, you can safely remove the conflicting assignment. This mapping applies across the IDE, including tool windows and the AI/Junie chat input.

### Notes

- This is an IDE preference and is not controlled by application code. We keep these instructions in the repository so every developer can quickly configure their environment.
- If your OS or mouse software customizes right-click behavior globally, confirm that right-click is not being intercepted before it reaches WebStorm.
- Keymaps can be exported/imported via File > Manage IDE Settings > Export/Import Settings if you want to share this configuration with teammates.

### Troubleshooting: Right‑click paste still not working

If mapping Button2 to "Show Context Menu" didn’t help, try the following in order:

1. Check for conflicting mouse shortcuts
   - Open Settings > Keymap.
   - In the search box, type: Button2 Click
   - Expand results. If any actions (other than Show Context Menu) have Button2 assigned, right‑click them and Remove Mouse Shortcut.
   - Also search for: Context Menu and verify your mapping exists under both “Editor Actions > Show Context Menu” and “Other > Show Context Menu” if present in your IDE version.

2. Map related context menu actions (varies by IDE build)
   - In Keymap search, look for and add Button2 Click to:
     - Editor Actions > Show Context Menu
     - Console Actions > Show Context Menu (sometimes called "Show Console Context Menu")
     - Tool Windows > Show Context Menu
     - Version Control > Show Context Menu (optional)
   - Not all actions exist in all builds; add where available.

3. Verify Advanced Settings and UI options
   - Settings > Advanced Settings:
     - Ensure options related to context menus are enabled (search for "context menu"). Some builds include “Use context menu on right click in tool windows.” Enable it.
   - Settings > Appearance & Behavior:
     - If using the New UI, ensure no custom mouse gesture plugin is overriding right‑click behavior.

4. Plugin or config interference
   - IdeaVim: If enabled, open ~/.ideavimrc and ensure there’s no `set mouse=a` or similar capturing mouse events. Temporarily disable IdeaVim and retry.
   - Mouse/gesture plugins: Temporarily disable any mouse gesture or productivity plugins that remap mouse buttons.

5. OS or driver interception
   - Windows: In Pen & Touch settings, disable “Press and hold for right‑click” if using a touchscreen/stylus. In mouse/vendor software, ensure Button2 isn’t remapped.
   - macOS: System Settings > Mouse/Trackpad: ensure secondary click is configured as “Click Right Side” (or two‑finger click on trackpads). Avoid third‑party remappers capturing right‑click.
   - Linux: Check desktop environment mouse settings for secondary button remaps.

6. Restart the IDE after changes
   - Some keymap changes apply immediately, but a restart ensures all tool windows pick them up.

7. Verification checklist
   - In Editor: Right‑click in a code file — context menu opens.
   - In Terminal tool window: Right‑click — context menu opens.
   - In Git tool window: Right‑click — context menu opens.
   - In AI/Junie chat input: Right‑click — context menu opens; Paste is available.
   - If context menu opens but Paste is disabled, confirm text is present in clipboard and that security policies or clipboard managers aren’t blocking the IDE.

8. Fallback shortcuts
   - Ctrl+V (Cmd+V on macOS) always pastes.
   - Shift+Insert also pastes on Windows/Linux in many contexts.

If it still doesn’t work, see docs/webstorm_right_click_paste_troubleshooting.md and share your OS, WebStorm version, Keymap scheme, and a list of active plugins.

## Performance Tuning: Prompt for Junie (WebStorm)

Use this prompt when WebStorm feels sluggish or gets stuck in large projects, even after increasing the memory heap. Paste the prompt below into Junie’s chat in WebStorm to get a structured, actionable list of features/plugins you can safely disable and exact steps to do so.

```
Act as a WebStorm expert. My IDE is experiencing performance issues and getting stuck frequently. I have a large project and have already increased the memory heap size. I want to improve performance and responsiveness.

List all of the features and plugins that can be safely disabled or are generally considered less essential for a standard development workflow in a large project. For each one, provide a brief explanation of what it does and why disabling it might improve performance.

After listing them, please provide the step-by-step instructions on how to disable them in WebStorm's settings. Be specific about the menu paths and where to find the relevant checkboxes.
```

Notes:

- This prompt is designed to produce a two-part answer: 1) a list of items to disable (with rationale), and 2) precise menu paths and checkboxes to toggle.
- Consider saving the resulting recommendations to a local checklist so your team can standardize their WebStorm performance settings.

### Manual: Disable non‑essential features/plugins (step‑by‑step)

Use the following steps to manually turn off non‑essential features. Only disable what you do not use in this project. You can re‑enable items later.

1. Disable unnecessary plugins

- Path: File > Settings > Plugins
- Actions:
  - Open the Installed tab, use the search box, and toggle Disable for plugins you don’t use. Common candidates:
    - CoffeeScript, Stylus, HAML, Jade/Pug, EJS/Handlebars, AngularJS (legacy), Cordova, PhoneGap, Mercury/Space/TeamCity integrations, Kubernetes, Subversion (SVN), Perforce, Mercurial, HTTP Client (if unused), Database Tools (if unused), Markdown (only if not editing markdown in IDE), AI Assistant alternatives you don’t use, Keymap/Language packs not needed.
  - Restart IDE when prompted.

2. Minimize background indexing load

- Path: File > Settings > Directories (or Project Structure > Modules)
- Actions:
  - Mark large non‑source folders as Excluded (e.g., node_modules copies, build, dist, coverage, .next, .turbo, .cache, .venv, logs, tmp). This reduces indexing.

3. Reduce inspections and code analysis scope

- Path: File > Settings > Editor > Inspections
- Actions:
  - Uncheck inspections you don’t rely on (e.g., duplicates of ESLint rules).
  - Optionally set Profile to a lighter profile for large projects.
- Path: File > Settings > Editor > Code Folding / General
- Actions:
  - Disable Breadcrumbs, Method separators, and other visual helpers you don’t need.

4. Prefer ESLint/Prettier over IDE analysis where possible

- Path: File > Settings > Languages & Frameworks > JavaScript > Code Quality Tools
- Actions:
  - Ensure ESLint is enabled and “Run for files” covers JS/TS; disable overlapping IDE inspections that duplicate ESLint rules.

5. Disable resource‑intensive UI effects

- Path: File > Settings > Appearance & Behavior > Appearance
- Actions:
  - Disable animations and unnecessary UI effects (e.g., enable Use compact mode, turn off window blur/transparency if present).
- Path: File > Settings > Editor > Inlay Hints
- Actions:
  - Turn off parameter/name hints for languages you don’t need.

6. Limit Version Control background activity

- Path: File > Settings > Version Control
- Actions:
  - Ensure only the actual project root is listed. Remove extra/mounted folders to avoid scanning.
- Path: File > Settings > Version Control > Background
- Actions:
  - Reduce or disable background operations you don’t need (e.g., background commit checks) if they add latency.

7. File Watchers and Tools

- Path: File > Settings > Tools > File Watchers
- Actions:
  - Disable watchers you don’t use (e.g., Sass/Less/TS watchers if your build runs them). Rely on the project’s build (Vite/Next) where possible.

8. Terminal and npm scripts indexing

- Path: File > Settings > Tools > Terminal
- Actions:
  - Disable shell integration features you don’t use.
- Path: File > Settings > Advanced Settings
- Actions:
  - Search for npm/yarn/pnpm script scanning and disable auto‑detection if it slows the IDE, relying on package.json/manual runs.

9. Power Save Mode (temporary boost)

- Toggle: File > Power Save Mode (or via Find Action: Ctrl+Shift+A then type "Power Save Mode")
- Notes: Turns off code analysis and inspections temporarily for maximum responsiveness when editing huge files.

10. Memory and process hygiene

- Help > Change Memory Settings: ensure the IDE heap is reasonable for your RAM (e.g., 2–4 GB).
- Invalidate caches if index corruption is suspected: File > Invalidate Caches… > Invalidate and Restart.

Verification checklist

- Indexing completes faster after exclusions; typing latency reduced; CPU usage stable while editing.
- Opening large TS/TSX files no longer stalls.
- Running ESLint via the project toolchain still works; IDE duplicate inspections are reduced.

Re‑enable as needed

- If a feature you rely on stops working, re‑enable its plugin from File > Settings > Plugins and restart.
