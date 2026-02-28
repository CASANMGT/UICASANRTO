# PRD - CASAN Operations Dashboard

## 1) Product Summary

CASAN Operations Dashboard is an internal web app for managing end-to-end EV motorcycle operations across RTO and Rental programs.  
It provides operational control for onboarding, program management, application review, GPS assignment, fleet monitoring, and finance visibility in one interface.

## 2) Goals

- Deliver React-based parity with legacy operations flow.
- Reduce operator decision time for applications and pickup scheduling.
- Improve GPS-to-vehicle assignment integrity and SIM lifecycle tracking.
- Standardize visual language (status and score badges) across all modules.
- Maintain local-first mock runtime while preparing backend-ready architecture.

## 3) Personas

- Operations Admin: manages programs, applications, and policy decisions.
- Fleet Controller: monitors maps, GPS, movement state, and immobilization.
- Collection/Finance Operator: tracks payments, fee visibility, and program health.

## 4) Core Workflows

### 4.1 Applications

- Review application row and open detailed review modal.
- Check submitted documents with thumbnail preview.
- Set decision (`approved`, `rejected`, `pending_docs`, `review`).
- Assign vehicle is required when approved.
- Schedule pickup date, time, and location after approval only.
- Maintain pickup lifecycle status (`planned`, `confirmed`, `rescheduled`, `completed`, `no_show`).
- Capture review notes and score adjustment rationale.

### 4.2 Programs

- Create/edit program with commission mode (`percentage` or `fixed amount`).
- View per-program renters list and vehicle list.
- Track aggregate stats (assigned vehicles, active renters, average commission context).

### 4.3 GPS

- Create/edit GPS devices with optional SIM.
- Assign device only to vehicles not already bound to another GPS.
- Filter by assignment, SIM assignment, brand, and model.
- Surface status, relative last ping, SIM number/expiry, and vehicle identity.

### 4.4 Maps

- View fleet markers with status and movement context.
- Apply combined filters (movement + vehicle status).
- Use paginated bottom list for reconciliation against map state.
- Enforce immobilized vehicle movement rule (non-moving in operational views).

## 5) Functional Requirements

- Tab navigation order: `Users, Programs, Applications, Renters, Finance, Vehicles, Maps, GPS`.
- Pagination consistency across major table views.
- Cross-tab status and score badge palette consistency.
- Data integrity normalization for linked entities:
  - application -> user/program/vehicle
  - GPS -> vehicle -> program/user
  - renter/user relationships
- In-app changelog must be visible near the sidebar title area.

## 6) Non-Functional Requirements

- Responsive layout for desktop and mobile drawer navigation.
- Fast startup in local mode using seeded runtime.
- Deterministic mock data for testing UX parity workflows.
- Clear migration boundary between React modules and legacy runtime bridge.

## 7) Success Metrics

- Application review completion time reduced versus legacy baseline.
- Zero invalid GPS assignments (duplicate GPS-to-vehicle bindings).
- High navigation discoverability (changelog and key actions visible).
- Visual/behavioral parity pass rate trend improves over releases.

## 8) Out of Scope (Current Phase)

- Full production backend integration and auth/RBAC.
- External partner portal and financial settlement automation.
- Native mobile app.

## 9) Release Cadence

- Source of truth for shipped scope: `CHANGELOG.md`.
- Strategic milestones and sequencing: `ROADMAP.md`.

