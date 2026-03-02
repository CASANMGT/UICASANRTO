# Data Synchronization & UX Audit

**Date:** 2026-02-28  
**Scope:** CASAN RTO Operations Dashboard (React web app)

---

## 1. Data Synchronization Audit

### 1.1 Architecture Summary

| Layer | Mechanism | Status |
|-------|------------|--------|
| **State source** | `localState` / `window.state` (single source of truth) | ✅ |
| **Mutations** | All via `legacyRuntime` functions | ✅ |
| **Notifications** | `notifyStateChanged()` after every mutation | ✅ |
| **Subscriptions** | `subscribe(listener)` → `LISTENERS_EVENT` | ✅ |
| **View updates** | `useLegacyTick()` + `getState()` / snapshot getters | ✅ |

### 1.2 Sync Flow

```
Mutation (e.g. decideRtoApplication, createGps)
    → notifyStateChanged()
    → window.dispatchEvent(LISTENERS_EVENT)
    → All subscribers receive event
    → useLegacyTick: setTick(t => t+1)
    → Views re-render, useMemo deps [tick] trigger
    → getState() / getRtoSnapshot() / etc. return fresh data
```

### 1.3 Fixes Applied

| Issue | Location | Fix |
|-------|----------|-----|
| **Wrong state key** | `ProgramsView`, `RentersView` | `state.tx` → `state.transactions` |
| **Wrong transaction key** | Same | `tx.userId` → `tx.vehicleId` (transactions are keyed by vehicle) |
| **Wrong lookup** | Same | `txByUserId[user.userId]` → `txByVehicleId[vehicle.id]` |

Transactions in `legacyRuntime` have `vehicleId`, not `userId`. The previous logic always produced empty `userTx`, so `failedTxCount` was always 0. Now failed-payment counts and grace/immobilized estimates are correctly derived from transaction data.

### 1.4 Cross-Entity Consistency

`normalizeDataIntegrity()` runs on every `getState()` and ensures:

- `user.vehicleIds` ↔ `vehicle.userId` bidirectional sync
- `vehicle.customer` / `vehicle.phone` from linked user when missing
- `gps.vehiclePlate` from vehicle when assigned
- `tx.customer` from vehicle when missing
- `rtoApplication.userName` from user when missing
- Handover checklist/photo templates normalized

### 1.5 External Data (localStorage)

- **RTO configs** (`scoreCfg`, `waCfg`): Stored in localStorage, read via `getRtoConfigs()`. `saveRtoConfigs()` calls `notifyStateChanged()` so views re-render and re-fetch configs. ✅

---

## 2. UX Improvement Recommendations

### 2.1 Procedural Flows (High Impact)

| Flow | Current | Recommendation |
|------|---------|----------------|
| **Application review** | Single Review CTA, guardrails in place | Add inline success/error toast after decision |
| **Handover completion** | Modal with checklist, returns boolean | Show toast on success; clear error message if validation fails |
| **GPS create/edit** | Form modal, no feedback | Add "Saved" / "Deleted" toast |
| **Program CRUD** | Modal, no feedback | Add confirmation toast on save/delete |

### 2.2 Empty / Loading / Error States

| View | Gap | Recommendation |
|------|-----|----------------|
| **Users** | No explicit empty state | "No users match filters" when list empty |
| **Renters** | Same | "No renters" with CTA to adjust filters |
| **Finance** | Same | "No transactions" message |
| **GPS** | Same | "No devices" with add CTA |
| **Applications** | Same | "No applications" / "No pickups" |
| **Global** | Loading only in top bar | Consider skeleton loaders for heavy tables |

### 2.3 Filter & Pagination Consistency

- Partner filter in top bar affects all views; ensure labels match (e.g. "All Partners" vs "All").
- Pagination: some views reset page on filter change, others don't. Standardize: reset to page 1 on filter change.
- Add "Clear filters" when any filter is active.

### 2.4 Cross-Tab Consistency

- Sidebar counts update when state changes (via `useLegacyRuntime` in App). ✅
- Ensure badge counts reflect filtered data when partner filter is active (currently they use full counts). Consider scoping counts by `state.filter.partner`.

### 2.5 Mobile & Responsiveness

- Drawer navigation works. Ensure modals are scrollable and buttons reachable on small screens.
- Tables: horizontal scroll is present; consider sticky first column for wide tables.

---

## 3. Implementation Priority

1. **Done:** Fix `state.tx` → `state.transactions` and vehicle-based tx lookup.
2. **Next:** Add toast/feedback for mutations (review, handover, GPS, programs).
3. **Then:** Empty-state messages for all list views.
4. **Later:** Scoped sidebar counts by partner filter; skeleton loaders.

---

## 4. Note on "Cleaning" Context

This workspace is **CASAN RTO** (vehicle fleet / rent-to-own). There is no cleaning/kebersihan module here. If you meant the **Koslock** boarding-house cleaning module, that lives in a different project (`C:\Users\claux\Koslock\koslock-v6.jsx`). For Koslock cleaning sync and UX, open that project in the workspace.
