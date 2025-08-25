# DojoPool Dev Startup Guide

This document describes a single, consistent way to run DojoPool in development and how ports are used across services.

## One-command startup

- Command: `npm run dev`
  - Starts Vite frontend on http://localhost:3000
  - Starts Node/Express backend with TypeScript watcher on http://localhost:8080
  - You can optionally run Flask (Python) services on http://localhost:5000 using the provided scripts (see Python README or run_flask.py).

Alternative (Next.js dev):
- Command: `npm run dev:next`
  - Starts Next.js dev server on http://localhost:3001
  - Note: In this repo, Vite is preferred for local development speed; Next is used for production builds.

## Ports and Proxies

- Frontend (Vite): 3000
- Backend (Node/Express): 8080
- Flask (Python services): 5000
- WebSocket (Socket.io): 8080

Recommended proxy behavior:
- Vite development should proxy API calls (e.g., `/api`, `/socket.io`) to `http://localhost:8080`
- Any AI/ML endpoints (e.g., `/ai/*`) can be proxied to `http://localhost:5000`

Refer to `vite.config.ts` for dev proxies and `next.config.js` for production rewrites and security headers.

## Environment variables

- Copy `docs/.env.example` to `.env` (backend) and `.env.local` (frontend) as needed.
- Validate your environment variables:
  - Non-strict (warn only): `npm run env:check`
  - Strict (CI-fail on missing): `npm run env:check:strict`

## Common issues

- Port conflicts: ensure 3000, 5000, and 8080 are free.
- Environment not loaded: ensure `.env` is present and that your terminal is restarted if you just created it.
- Backend not building: run `npm run build:backend` to perform a one-off compile; dev mode uses TypeScript watcher automatically.

## Production preview

- Build: `npm run build` (Next.js)
- Preview: `npm run preview` (Next.js)

This uses Next.js for production build and server behavior, as per the project guidelines.
