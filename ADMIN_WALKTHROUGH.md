# RTO Admin Walkthrough Validation

## Goal

Validate that morning triage can be completed using the updated filter/column model across core admin tabs.

## Scenario 1: Applications triage (RTO)

- Open `Applications` tab.
- Verify top stats: total, pending, approved, rejected.
- Apply filters:
  - Decision: `review`
  - Score: `Low (<60)`
  - Docs: `Missing`
  - SLA: `Overdue (>3d)`
- Confirm columns show:
  - Score
  - Missing docs count
  - Age (days)
  - Reviewer
  - Last reviewed timestamp
  - Assigned vehicle
  - Pickup status
  - Decision
- Open one row and confirm there is a single clear `Review` action.
- In review modal, verify:
  - `Approved` requires assigned vehicle.
  - `Needs Docs` requires at least one required document.
  - `Reject` requires rejection reason.

## Scenario 2: GPS incident queue

- Open `GPS` tab.
- Verify top stats and filter controls include:
  - SIM expiry state
  - Ping age
  - Incident-only
- Apply filters:
  - Incident-only = `Yes`
  - Ping age = `Stale`
  - SIM expiry = `Expired`
- Confirm row severity pill appears and can be scanned quickly.

## Scenario 3: Fleet movement monitoring

- Open `Maps` tab.
- Verify top stats and second-level filters include:
  - Program
  - GPS status
  - Ping age
  - Speed band
- Apply filters:
  - Movement = `Running`
  - Connectivity = `Offline`
  - Ping age = `Stale`
- Confirm movement list updates and pagination reflects filtered rows.

## Scenario 4: Vehicle exception handling

- Open `Vehicle` tab.
- Verify filters include:
  - Program
  - Connectivity
  - Credit bucket
  - Assignment
  - Status chips
- Apply:
  - Credit bucket = `Critical`
  - Assignment = `Assigned`
- Confirm columns display:
  - Arrears risk
  - Last ping
  - Action buttons for lock/release/credit.

## Scenario 5: User profile support

- Open `Users` tab and click `Profile`.
- Confirm profile modal opens with key identity, risk, contact, and vehicle details.

## Scenario 6: Pickup scheduling board

- Open `Applications` -> `pickup`.
- Verify filters include:
  - Date bucket
  - Location
  - Time slot
  - Pickup status
- Set one approved application slot and verify pickup status transitions and badge update.
- Confirm row action label is contextual (`Set Slot` vs `Edit Slot`).

## Build/Lint

- Build check: pass (`npm run build`).
- Lint diagnostics on edited files: no IDE lint errors.
