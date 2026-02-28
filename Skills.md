# CASAN Operations - Skills Matrix

This document defines operator competencies for effective daily usage of the dashboard.

## 1) Core Operational Skills

### Application Review Operations

- Evaluate document completeness and quality.
- Apply correct review decision (`approved`, `rejected`, `pending_docs`, `review`).
- Record review note and score adjustment rationale.
- Enforce review guardrails before finalizing decision:
  - approved -> assigned vehicle required
  - pending docs -> required docs list required
  - rejected -> reason required
- Schedule pickup only for approved applications.
- Maintain pickup lifecycle updates (`planned`, `confirmed`, `rescheduled`, `completed`, `no_show`).

### Program Administration

- Configure program economics (price, grace, commission type/value).
- Interpret program-level renter and vehicle distribution.
- Maintain accurate assignment and eligibility context.

### GPS and Fleet Control

- Register and maintain GPS devices with or without SIM.
- Assign GPS to the correct unbound vehicle.
- Monitor SIM lifecycle (number, expiry, assignment state).
- Use filters for assignment, brand, model, and operational status.

### Map and Movement Monitoring

- Reconcile map markers with bottom movement list.
- Investigate stale pings and status anomalies.
- Validate immobilized behavior and flag movement violations.

### Finance and Collections Visibility

- Track transaction outcomes and CASAN fee signals.
- Review trend shifts per program and take operational follow-up actions.

## 2) Proficiency Levels

| Level | Role | Capability |
|---|---|---|
| L1 | Viewer | Reads dashboards and escalates anomalies. |
| L2 | Operator | Handles daily CRUD, review workflows, and scheduling. |
| L3 | Senior Operator | Manages policy decisions, exceptions, and recovery flows. |
| L4 | Admin | Owns program configuration and release readiness checks. |

## 3) Operational Guardrails

- Never schedule pickup for non-approved applications.
- Never bind one vehicle to multiple GPS devices.
- Always provide reviewer identity and decision context.
- Treat missing user/program links as integrity incidents and fix immediately.

## 4) Suggested Enablement

- Weekly review calibration for application decisions.
- Monthly drill for GPS incident response and stale telemetry handling.
- Quarterly refresher for program economics and commission governance.

