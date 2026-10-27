# Firebase integration blueprint (not connected yet)

This document describes a proposed Firestore migration, **not an implemented integration**. Nothing in the frontend currently makes network requests to Firestore.

## Logical environments

Use separate Firebase projects (or strictly isolated tenancy) for development, staging and production. The app must authenticate personnel with Firebase Authentication and use Firestore Security Rules for authorization. A client-side role flag is not a security control. Audit actor/timestamp should come from authenticated server-side context, not user input.

## Proposed collections

```
organizations/{organizationId}
  sites/{siteId}
    products/{productId}            # sku, name, form, packSize, minorUnit, yieldPct, active
      bomVersions/{versionId}       # effectiveFrom, status, material quantities per approved batch
      routingVersions/{versionId}   # effectiveFrom, validated batch size, stage resource + hours
    materials/{materialId}          # name, unit, procurementLeadDays, active
    materialLots/{lotId}            # materialId, batchNo, physicalQty, expiryDate, qaStatus
    inventoryLedger/{entryId}       # physical receipts, issues, reversals, reservations
    machines/{lineId}               # stage family, daily capacity, availability
      calendars/{calendarId}        # shift windows, holidays, shutdowns
    demands/{demandId}              # forecast, firm orders, FG, incoming, safety, market, due date
    supplyPlans/{planId}            # demandId, snapshot refs, quantity, status, dates, revision
      plannedBatches/{batchId}      # allocated unit quantity, estimated operations
    materialReservations/{id}       # planId, material lot, qty, status
    purchaseSignals/{signalId}      # shortage qty, need-by, status
    auditEvents/{eventId}           # immutable action, actor, server timestamp, revision
  memberships/{uid}                 # member site scope and role
```

Separate externally governed QA/QC source records should be integrated using a validated interface if approvals or test results are displayed. The supply planner should not be granted the ability to synthesize a QA approval.

## Role model (proposed)

| Role | Actions |
|---|---|
| Supply Planner | Create/revise demand, run simulations, draft MPS, request plan release |
| Planning Manager | Approve/release MPS after approved checks |
| Procurement | Read shortage signals; update purchase/order follow-up status |
| Warehouse | Post inventory via inventory service; read batches/availability |
| Production | Record physical execution and timestamps in the designated manufacturing system |
| QC | Record verified test decisions through approved QC workflow |
| QA | Perform approved quality release workflow (separate from MPS release) |
| Admin | Manage configuration and memberships, with site scope |
| Auditor | Read logs and approved history only |

These are preliminary product-design roles. Formal segregation of duties and electronic signature requirements must be specified before a live rollout.

## Essential writes / consistency

- Atomic MPS release: run a server-side transaction to check latest BOM/routing effective version, lot status, expiry, quantities, current reservations and competing plans; lock/reserve the required quantities and commit plan status with an audit event. Reject if concurrent transactions reduce availability.
- Immutable plan revision: persist the input snapshot, computed yield/batch configuration and schedule calculation version. Do not silently recalculate an already released plan when Product Master changes.
- Inventory: book receipts/usage/returns in a transaction-backed ledger. Do not rely on independent mutable `lots.qty` plus client-derived reservations at scale.
- Approval: record identity, reason and timestamps from trusted authentication context, enforce role-specific allowed transitions server-side, and obtain official QA disposition from the QMS.
- Sensitive operations: use least-privilege Firestore rules and optionally trusted Cloud Functions or a controlled backend. Never put Firebase Admin keys in the browser.
- Governance: distinguish plan `released` from batch `qaReleased`, retain deletion/reversal and historical records, prevent unsupported edits to locked plans.

## Performance, indexes & access

- Keep organization/site scope in the document path or an enforced immutable claim; do not fetch all sites into a browser and filter afterward.
- Query `supplyPlans` by `(status, startDate)`, `(productId, startDate)`, and `(demandId)` as needed. Let real query usage determine composite index creation.
- Query `materialLots` by `(materialId, qaStatus, expiryDate)` to compute eligible FEFO inventory, with server-side reservation consistency.
- Use paginated transaction tables, incremental reads, and cached masters rather than reading the entire plan history on every render.

## Frontend migration steps

1. Add Firebase browser SDK initialization and login (no credentials until project is provided).
2. Replace `LocalRepository` in `js/store.js` with async collection-based fetching, live subscriptions, and mutations, preserving the engine and UI modules where practical.
3. Refactor `mutate` / UI form flows to use asynchronous operations, busy states, and server error handling.
4. Enforce validation and permissions in Security Rules / backend code; do not trust the arithmetic or roles enforced in `js/app.js` alone.
5. Add integration tests for simultaneous MPS release, lot expiry, BOM versioning, plan revisions and QC/QA security.
