# CASAN Operations Dashboard - Roadmap

This roadmap tracks delivery from React parity to production-grade platform services.

## Phase 0 - Completed Foundation

- [x] React migration shell with legacy runtime bridge.
- [x] Sidebar-first navigation and responsive drawer behavior.
- [x] Dedicated views for `Users, Programs, Applications, Renters, Finance, Vehicles, Maps, GPS`.
- [x] Shared pagination patterns across major tables.
- [x] Initial visual parity tooling and diff artifacts.

## Phase 1 - Operations UX Hardening (Current)

### Completed

- [x] Applications review enhancements (decision flow, docs review, score handling).
- [x] Pickup scheduling gating based on approval state.
- [x] RTO UX simplification pass:
  - single review CTA path
  - decision guardrails in UI + runtime
  - pickup lifecycle status and richer pickup filters
  - triage columns (`last reviewed`, `assigned vehicle`, `pickup status`)
- [x] Program admin improvements (commission mode, renters/vehicle list support).
- [x] GPS list upgrades (assignment integrity, SIM fields, richer filters).
- [x] Maps reconciliation list with combined status/movement context.
- [x] In-app changelog moved near sidebar title for better visibility.

### In Progress

- [ ] Legacy-level detail parity for all edge interactions in Applications review.
- [ ] Systematic visual parity cleanup for remaining diff hotspots.
- [ ] Unified empty/loading/error states across all tabs.

## Phase 2 - Data Platform Transition

- [ ] Backend persistence for users/programs/vehicles/applications/GPS.
- [ ] Auth + RBAC roles (`Admin`, `Operator`, `Viewer`).
- [ ] API layer for state mutations now handled in `legacyRuntime`.
- [ ] Audit trail and immutable activity logs for decisions and assignments.

## Phase 3 - Real-Time Operations

- [ ] GPS event ingestion pipeline with near-real-time updates.
- [ ] Websocket/subscription model for live map and list refresh.
- [ ] Alerting for stale ping, GPS tamper, and policy breach conditions.
- [ ] Program-level SLA and alert thresholds.

## Phase 4 - Intelligence and Scale

- [ ] Predictive risk and payment propensity scoring.
- [ ] Program profitability and cohort analytics.
- [ ] Operations command center with drill-down diagnostics.
- [ ] Multi-region/multi-tenant readiness.

## Release Notes Discipline

- Detailed shipped scope: `CHANGELOG.md`
- Product intent and requirements: `PRD.md`
- Runtime and system model: `ARCHITECTURE.md`

