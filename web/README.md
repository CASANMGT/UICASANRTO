# CASAN RTO React Migration App

This app is the incremental React + Vite + Tailwind migration shell.

## Run

1. Copy env:
   - `cp .env.example .env` (or create `.env` manually on Windows)
2. Install:
   - `npm install`
3. Start dev server:
   - `npm run dev -- --host`
4. Open:
   - `http://localhost:5173`

## Legacy Bridge

The migration bridge is implemented in `src/bridge/legacyRuntime.js`.

- It uses legacy globals when they exist.
- It falls back to portable seeded runtime data when legacy globals are not present.
- This keeps the app deployable without machine-specific file paths.

## Feature Flags

Feature flags are in `src/config/featureFlags.js`:

- `usersReact`
- `vehiclesReact`
- `financeReact`
- `mapReact`
- `rtoReact`
- `rentersReact`

Turn any flag off to keep that tab in legacy-fallback mode during parity testing.

## Latest UI Notes

- Navigation is left-sidebar first (desktop collapse + mobile drawer).
- Changelog access is now near the `CASAN Operations` sidebar title.
- GPS table uses merged observability columns for denser operational scanning.
- Applications review flow is simplified to a single clear review action with runtime guardrails.
- Pickup board includes location/slot/status filters and pickup lifecycle badges.
- Decision terminology is normalized to `approved`, `rejected`, `pending_docs`, `review`.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
