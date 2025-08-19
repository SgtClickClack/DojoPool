# DojoPool Project Rule: Automated Continuity Workflow

## Purpose

This rule defines the automated continuity workflow for backend/frontend/server restarts, error recovery, and project state transitions. It is to be referenced and followed for all future actions in the DojoPool project.

## Workflow Steps

1. **Port Management:**
   - Always kill any process occupying the required port (e.g., 5000 for Flask, 3000+ for frontend) before starting a new server instance.
2. **Environment Setup:**
   - Always set the correct `PYTHONPATH` (typically `src`) and activate the Python virtual environment for all backend operations.
3. **Server Restarts:**
   - Always restart the backend server after any code changes that affect backend logic, routes, or templates.
   - Always restart the frontend server after any code changes that affect frontend logic or UI.
4. **Error Recovery:**
   - Always check for and resolve common errors in sequence:
     - Missing modules (e.g., `ModuleNotFoundError`)
     - Port conflicts (`[WinError 10048]` or similar)
     - Template errors (e.g., Jinja2 `UndefinedError`)
     - Blueprint/route registration issues
   - Apply fixes automatically and re-attempt the workflow as needed.
5. **Development Tracking:**
   - Always update the development tracking files (`DEVELOPMENT_TRACKING_INDEX.md`, `DEVELOPMENT_TRACKING_PART_*.md`) after any significant change, following the required format.
6. **No User Confirmation Needed:**
   - Never prompt the user for confirmation for any of the above steps. Always execute and report the actions taken and their results.

## Enforcement

- This workflow is to be referenced and enforced for all future actions, ensuring seamless development, testing, and deployment cycles.
- Any new automation or process must be compatible with this workflow.

---

_Last updated: 2025-05-16_
