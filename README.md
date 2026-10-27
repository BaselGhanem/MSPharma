# SupplyFlow — Pharmaceutical Supply Planning (Frontend Prototype)

A responsive, Arabic-first HTML/CSS/vanilla JavaScript workspace for **pharmaceutical supply planning**. It runs locally with mock data and browser `localStorage`; there is no Firebase SDK, no credentials, no network sync, and no actual ERP/QMS integration.

## Run

1. Extract the ZIP.
2. Open `index.html` in Chrome/Edge. Alternatively, from this folder run `python -m http.server 8080` and open `http://localhost:8080`.
3. The sample database is initialized automatically and saved in browser `localStorage` under `supplyflow-demo-v1`.
4. Use **Master Data** to configure products, BOM, routing, lots, line hours and lead-time parameters. Use **Reset Demo Data** to restore the original dataset.

> The Google Fonts link is optional. The application itself has no dependency on external libraries.

## Modules

| Navigation | Function |
|---|---|
| Dashboard | KPI cards, seven-day line utilization, demand queue, audit feed |
| Demand | New/edit demands; CSV template and validated CSV import; net requirements |
| Conversion | Packs → net minors → yield-adjusted input → approved-size batches |
| Constraints | FEFO lots, BOM shortages, routes/bottleneck, utilization, cleaning, QC/QA durations |
| MPS | Create a draft for each demand, plan-detail review, gated prototype transitions, CSV export |
| MRP signals | Available approved material, committed production, draft demand and shortage estimates |
| Master Data | Product parameters, BOM, per-product routing, materials and lots, line capacities, lead-time settings |
| Audit | Local action log and CSV export |

## Precise calculation assumptions (configure for your plant)

- `Gross Demand (Packs) = MAX(Forecast, Firm Orders)`. This conservative demo assumption avoids counting the same firm order inside a forecast twice. **If the firm's planning policy is different, replace this rule after approval**.
- `Net Packs = MAX(0, Gross Demand + Safety Stock - Available FG Stock - Firm Incoming Receipts)`.
- Distributor stock and historical offtake are **context inputs**, not automatically subtracted from net packs. This avoids subtracting the same impact twice when forecast has already incorporated them.
- `Net Minors = Net Packs × Minors per Pack`.
- `Yield-adjusted Input = CEIL(Net Minors / Yield Ratio)`.
- `Batches = CEIL(Yield-adjusted Input / Validated Batch Size)`. The configured batch size represents **input minors per validated batch**, with a standard yield applied to estimate good units. **All batch sizes and yields are sample assumptions, not validated manufacturing records**.
- `BOM required = Qty per Batch × Batches`; usable stock is from lots with `status=RELEASED` and `expiry >= planned start date`. FEFO orders the proposals by expiry. Other released/in-production plans' committed quantities are deducted before checking free stock.
- The scheduler is **indicative**: it books stage hours into calendar-day line-capacity buckets with per-product routing, applying a standard cleaning allowance whenever a line changes product across the scheduling sequence. There is no shift calendar, exact hour-by-hour precedence, downtime, changeover matrix, resource labor constraints, or validated finite-capacity APS model.
- `Estimated QC complete = Production finish + QC days`, `Estimated QA release = QC complete + QA days` (calendar days). These are target dates, **not test results or QA permissions**.
- MPS release is *plan release*, not *batch quality release*. Subsequent production/QC/QA states are demo-only manual clicks that do **not** constitute compliant electronic approval, signed production records, or QMS/ERP execution.

## Repository abstraction and future Firebase integration

```
supply-planning/
├── index.html
├── css/styles.css             # Responsive interface
├── js/seed.js                 # Illustrative (fictional) master and transaction data
├── js/engine.js               # Pure planning arithmetic and constraints
├── js/store.js                # LocalRepository + repository/mutation contract
├── js/app.js                  # View rendering, forms, CSV and UI events
├── samples/demand-import.csv
└── README.md
```

Current storage contract is `repository.load(): state`, `repository.save(state): void`, `repository.reset(): state`. For Firebase, implement an asynchronous Firestore repository, change the application loader/mutations to `await` persistence, and add an auth/roles layer. **Do not put an admin SDK or service-account key in browser JavaScript.** Firebase API config may be public, but Security Rules must enforce company/plant boundaries and permissions.

Suggested collections when moving beyond prototype:

- `users`, `roles`, `sites`, `products`, `boms`, `routings`, `machines`, `machineCalendars`
- `materials`, `materialLots`, `inventoryLedger`, `demands`, `supplyPlans`, `planOperations`, `purchaseSignals`, `auditEvents`
- `qcResults`, `qaDecisions` **must be linked to validated QMS workflows** (the frontend cannot be the system of record).

At production scope, consider server-side validation and transactional inventory allocation, immutable BOM and routing versions, effective dates, multiple sites, market-specific packaging BOMs, detailed FEFO rules / shelf-life-at-use, partial goods receipt, holidays/shifts, unique batch IDs, traceability, audit actor identity, approvals, concurrency/locking, and official quality signatures.

## Import format

The template is UTF-8 CSV with headers:

```
product_sku,market,forecast_packs,firm_orders_packs,fg_stock_packs,incoming_packs,safety_packs,agent_stock_packs,historical_packs,due_date,priority,notes
```

Use dates `YYYY-MM-DD`, nonnegative whole packs, defined SKU, and priority `HIGH`, `NORMAL`, or `LOW`. Max import 1,000 rows / 2 MB. Imports are additive; the prototype does not deduplicate forecast revisions.

## Operating boundaries

**For demonstration and requirements prototyping only.** Not a validated production planning engine, cGMP-compliant system, QMS, official ERP, inventory ledger, electronic batch record, or electronic-signature system. Actual batch manufacturing and QA approvals remain external until formal verification, validation, permissions and integration are implemented.
