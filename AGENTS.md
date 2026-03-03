## Cursor Cloud specific instructions

### Project overview

CASAN Operations Dashboard — a React + Vite frontend SPA for managing EV motorcycle fleet operations (RTO & Rental programs). No backend or database required; all data is mocked client-side via `web/src/bridge/legacyRuntime.js`.

### Services

| Service | Path | Command | URL |
|---------|------|---------|-----|
| React app (Vite dev) | `web/` | `npm run dev -- --host --port 5173` | http://localhost:5173 |

### Standard commands

All commands run from `/workspace/web/`:

- **Dev server:** `npm run dev -- --host --port 5173`
- **Lint:** `npm run lint`
- **Build:** `npm run build`
- **Parity tests (Playwright):** `npm run test:parity`

See `README.md` and `web/README.md` for full documentation.

### Caveats

- ESLint reports ~270 errors from `.vite/deps/` (Vite's pre-bundled dependency cache). These are not source-code issues; the ESLint config does not ignore that directory. Source-level lint warnings are minor (`no-unused-vars` in UI primitives).
- No environment variables are required (`.env.example` confirms this).
- The Applications tab has a pre-existing runtime error (`RtoView is not defined`); all other tabs (Users, Programs, Finance, Vehicles, Renters, Maps, GPS) load correctly.
- Playwright parity tests require browsers to be installed first (`npx playwright install`).
