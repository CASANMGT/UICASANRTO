# Architecture - CASAN Operations Dashboard

## 1) High-Level Architecture

The system currently runs as a frontend-first application with an incremental migration model:

- Legacy SPA (HTML/CSS/JS modules) remains available for reference/parity.
- React app (`web/`) is the primary active surface.
- A runtime bridge (`legacyRuntime`) provides compatible state access and mutation methods.

## 2) Main Layers

### 2.1 Presentation Layer

- `web/src/App.jsx`: shell layout, sidebar/nav orchestration, topbar, in-app changelog placement.
- View modules in `web/src/components/`:
  - `UsersView`, `ProgramsView`, `RtoView` (Applications), `RentersView`,
  - `FinanceView`, `VehiclesView`, `MapView`, `GpsView`.

### 2.2 Application Layer

- View-local state for filters, pagination, modal lifecycle, and selection.
- Shared UI semantics via common badge tone helpers and table conventions.
- Feature flag control in `web/src/config/featureFlags.js`.

### 2.3 Runtime/Data Layer

- `web/src/bridge/legacyRuntime.js` exposes:
  - state getters/subscribers
  - create/update/delete handlers
  - normalization and seed logic
- Data normalization ensures linked entities remain valid and render-safe.

## 3) Data Flow

1. Component reads state through bridge helpers.
2. User action triggers mutation handler in bridge.
3. Bridge updates state and emits change notification.
4. Subscribers re-render with normalized snapshots.

This evented flow keeps React views synchronized while preserving compatibility with legacy assumptions.

## 4) Key Integrity Rules

- GPS assignment is vehicle-based (not user-based).
- Vehicle can have at most one assigned GPS device.
- Applications must gate pickup scheduling until approved.
- Canonical application decisions are: `approved`, `rejected`, `pending_docs`, `review`.
- Approval requires assigned vehicle at both UI and runtime guard layers.
- Program, vehicle, and renter links are repaired/filled during normalization when possible.

## 5) RTO Decision and Pickup State Model

- Review mutations run through `decideRtoApplication()` in `legacyRuntime`.
- Pickup mutations run through `scheduleRtoPickup()` and are blocked unless application is approved.
- Pickup schedule state carries operational lifecycle status:
  - `unscheduled` -> `planned` -> `confirmed` -> `rescheduled` -> `completed` / `no_show`
- Legacy decision alias (`declined`) is normalized to `rejected` for compatibility.

## 6) Mapping and Telemetry Model

- Map markers are enriched from vehicle + user + program + GPS joins.
- Movement state and status are computed for UI clarity.
- Immobilized vehicles are represented as non-moving in list/map operational outputs.
- Bottom movement table provides reconcilable telemetry surface with pagination.

## 7) Deployment Architecture

- Build: Vite (`web`).
- Hosting: Vercel production alias (`casanrto.vercel.app`).
- Branch strategy: `main` is deploy branch.

## 8) Evolution Path

- Short term: maintain parity and operator UX hardening.
- Mid term: introduce backend source of truth (auth, RBAC, persistence).
- Long term: observability stack and predictive analytics integration.

