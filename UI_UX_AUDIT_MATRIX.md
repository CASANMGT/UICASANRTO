# RTO Admin UI/UX Audit Matrix

This matrix classifies each tab's filters and columns into `Keep`, `Add`, and `Remove/Refactor` for RTO admin operations.

## Users

- **Keep**
  - Search (name/phone/NIK)
  - Program filter
  - Risk filter
  - Sort by + direction
  - Core columns: user, contact, risk, joined, actions
- **Add**
  - Missed payments threshold filter
  - Vehicle status filter
  - Join date range filter
  - Columns: last payment date, days since payment, total paid, enforcement state
- **Remove/Refactor**
  - Replace ambiguous progress semantics with payment/contract progress

## Renters

- **Keep**
  - Search, program, status filters
  - Core columns: renter, program, vehicle, status, contact
- **Add**
  - Risk band filter
  - Credits bucket filter
  - GPS online/offline filter
  - Missing KYC filter
  - Columns: credits remaining, missed payments, last payment date, GPS freshness
- **Remove/Refactor**
  - Compact contact + KYC if additional ops columns are added

## Vehicles

- **Keep**
  - Search and status filters
  - Action controls (lock/release/credit extension)
- **Add**
  - Program filter
  - GPS connectivity filter
  - Credit threshold filter
  - Assigned/unassigned filter
  - Columns: last ping age, arrears risk, last action timestamp
- **Remove/Refactor**
  - Remove static STNK placeholder unless backed by expiry data

## Programs

- **Keep**
  - Search
  - Existing management actions
  - Core stats strip
- **Add**
  - Filters: partner, type, health preset
  - Columns: utilization, delinquency rate, immobilized ratio, MTD revenue/arrears
- **Remove/Refactor**
  - Reduce repeated identity columns where density is high

## Applications (RTO)

- **Keep**
  - Decision filter + search
  - Review flow and scheduling surfaces
- **Add**
  - Filters: score band, docs completeness, reviewer, assigned vehicle, SLA overdue
  - Pickup filters: date range, slot, location, status
  - Columns: app age/SLA timer, last review by/at, assigned vehicle details
- **Remove/Refactor**
  - Consolidate duplicate review actions into one clear primary path

## GPS

- **Keep**
  - Assignment, SIM, brand/model, status filters
  - Existing telemetry-oriented columns
- **Add**
  - Filters: stale ping age, SIM expiry state, incident-only
  - Columns: severity, SIM days-to-expiry, firmware health, signal quality
- **Remove/Refactor**
  - Remove duplicated ID/ping representation across columns

## Maps

- **Keep**
  - Status, connectivity, movement filters
  - Movement list and map synchronization
- **Add**
  - Filters: partner/program, GPS status, ping age, speed band, severity
  - Columns: geofence/zone, relative ping age, incident flag
- **Remove/Refactor**
  - De-emphasize focus chips when fleet size is large

## Finance

- **Keep**
  - Program filter
  - Revenue stats strip
  - Transaction list baseline
- **Add**
  - Filters: date range, status, method, free-text search, unresolved-only
  - Columns: partner share, net breakdown, aging, reconciliation ref
- **Remove/Refactor**
  - Avoid duplicating counts in multiple places of the same view

## RTO Review & Pickup Acceptance Checklist

- Single row-level review CTA (`Review`) with no duplicate action buttons for the same flow.
- One decision input mechanism in review modal.
- Guardrails enforced:
  - `approved` requires assigned vehicle
  - `pending_docs` requires required-doc selection
  - `rejected` requires rejection reason
- Pickup board provides filters for date, location, slot, and pickup status.
- Pickup lifecycle status is visible in both applications and pickup tables.
- Decision vocabulary is canonical and consistent: `approved`, `rejected`, `pending_docs`, `review`.
