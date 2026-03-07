# CASAN Operations Dashboard

Operations dashboard for CASAN RTO and Rental programs.  
This repository contains the legacy SPA and the active React migration app used for feature-parity rollout.

## Live

- Production: `https://casanrto.vercel.app`

## Current Stack

- UI: React + Vite
- Styling: Tailwind utilities + shared shadcn-style component primitives
- Runtime bridge: `web/src/bridge/legacyRuntime.js`
- Map: Leaflet
- Hosting: Vercel

## Plan: Fully Tailwind-Native

Goal: remove legacy CSS dependencies and make all React views use a consistent Tailwind design system without visual regressions.

### Phase 1 - Audit and Baseline (1-2 days)

- Inventory all legacy style imports and class usage from `web/src/legacy-theme.css` and legacy `css/` files.
- Tag components by migration complexity: low (`Users`, `Finance`) / medium (`Programs`, `Vehicles`, `GPS`) / high (`Applications`, `Map`).
- Freeze current parity baseline using `web/scripts/visual-parity.mjs` output.

### Phase 2 - Design Tokens and UI Primitives (2-3 days)

- Define Tailwind tokens in `web/tailwind.config.*` for color, spacing, radius, typography, and state badges.
- Build shared primitives (`Badge`, `Table`, `Modal`, `FormField`, `Tabs`, `EmptyState`) in React.
- Map old semantic styles (`active`, `grace`, `immobilized`, score bands) to tokenized Tailwind variants.

### Phase 3 - Component-by-Component Refactor (1-2 weeks)

- Migrate one view at a time and remove legacy classes as each view passes parity checks.
- Suggested order: `Users` -> `Finance` -> `Vehicles` -> `Programs` -> `GPS` -> `Applications` -> `Map`.
- Keep behavior unchanged; only refactor styling and layout structure.

### Phase 4 - Cutover and Cleanup (2-3 days)

- Remove `web/src/legacy-theme.css` and obsolete legacy CSS imports from React path.
- Keep legacy app files only as archive/reference, not as runtime dependency for React UI.
- Update docs and changelog with final cutover notes.

### Exit Criteria (Definition of Done)

- No React view depends on legacy CSS imports.
- Shared UI primitives are used across all tabs.
- Visual parity diff is within agreed threshold for every migrated tab.
- Responsive behavior (desktop + mobile drawer) remains intact.
- Build and smoke tests pass before release.

### Immediate Next Sprint

- Deliver token system + shared primitives.
- Fully Tailwind-migrate `Users` and `Finance` as pilot modules.
- Publish parity-before/after screenshots and diff metrics in `web/artifacts/visual-parity`.

### Migration Progress

- Tailwind-native pilot complete for:
  - `web/src/components/UsersView.jsx`
  - `web/src/components/FinanceView.jsx`
- Tailwind-native migration complete for:
  - `web/src/components/VehiclesView.jsx`
  - `web/src/components/RentersView.jsx`
- Tailwind-native migration complete for:
  - `web/src/components/ProgramsView.jsx`
- Tailwind-native migration complete for:
  - `web/src/components/GpsView.jsx`
- Tailwind-native migration complete for:
  - `web/src/components/RtoView.jsx`
- Tailwind-native migration complete for:
  - `web/src/components/MapView.jsx`
- shadcn-style UI component setup complete:
  - `web/src/components/ui/button.jsx`
  - `web/src/components/ui/input.jsx`
  - `web/src/components/ui/select.jsx`
  - `web/src/components/ui/dialog.jsx`
  - `web/src/components/ui/table.jsx`
- legacy-compatible shadcn variants added:
  - `legacyPrimary`, `legacyGhost`, `legacyDanger`, `legacyPill` (Button)
  - `legacy` variant (Input/Select), `legacy` tone/density (Table/Dialog)
- shared form/checkbox constants (v3.1.0):
  - `FORM_CONTROL_CLS` and `CHECKBOX_CLS` in `page.jsx` for consistent modal styling
- GPS is now component-driven via shadcn-style primitives:
  - `web/src/components/GpsView.jsx`
- Remaining views pending full Tailwind-native refactor:
  - none (all main views migrated)

## Repo Layout

```text
casan_rto/
├─ web/                    # Primary app (React migration)
│  ├─ src/
│  ├─ scripts/
│  └─ README.md
├─ index.html              # Legacy app shell
├─ js/ css/                # Legacy modules/styles
├─ PRD.md                  # Product requirements
├─ ARCHITECTURE.md         # System architecture
├─ ROADMAP.md              # Delivery roadmap
├─ Skills.md               # Operator capability matrix
└─ CHANGELOG.md            # Release log
```

## Branches & Releases

- `main` — Production release branch (deployed to Vercel).
- `feat/*` — Feature branches. Create with `git checkout -b feat/your-feature`, commit changes, then open a PR to merge into `main`.

To work with the latest program modals pagination (v3.2.0):

```powershell
git fetch origin
git checkout feat/program-modals-pagination   # or merge into main
```

## Local Development

### React App (recommended)

```powershell
cd web
npm install
npm run dev -- --host --port 5173
```

Then open `http://localhost:5173`.

### Legacy App (reference)

```powershell
.\server.ps1
```

Then open `http://localhost:5501`.

## Build and Deploy

### Production build

```powershell
cd web
npm run build
```

### Deploy to Vercel

```powershell
vercel --prod
```

`main` is the release branch and is connected to Vercel production.

## Program Modals (Vehicle List & RTO List)

The **Programs** view shows each program with action buttons:

- **Vehicle List** — Opens a popout listing all vehicles assigned to that program. Use **Prev** / **Next** to paginate (10 vehicles per page). The footer shows `Page X of Y (N vehicles)`.
- **Renters List (RTO List)** — Opens a popout listing all renters (RTO users) for that program. Filter by tab (All, Online, Offline, Running, Stopped, Grace, Immobilized). Use **Prev** / **Next** to paginate (10 renters per page). The footer shows `Page X of Y (N renters)`.

When opening either modal or switching RTO List tabs, pagination resets to page 1.

## Product Scope (Current)

- Sidebar-first operations UI: `Users, Programs, Applications, Renters, Finance, Vehicles, Maps, GPS`.
- Applications review workflow with:
  - single primary review action
  - document thumbnails + enlarged preview modal
  - manual score adjustments and reviewer notes
  - decision guardrails for approve/reject/pending docs
- Pickup scheduling workflow with approval-only gating and pickup lifecycle states (`planned`, `confirmed`, `rescheduled`, `completed`, `no_show`).
- Program admin with commission modes (`%` or fixed amount), renters list, and vehicle list.
- Program records include pickup location defaults and program filter labels using `Program Name • Type`.
- GPS operations with assignment integrity (GPS assigned to vehicle only), SIM lifecycle fields, and filtered assignment flow.
- Map observability with movement/status filters and paginated movement list; clicking a list row zooms to the matching marker.
- Cross-tab badge consistency for status and score signals.

## Documentation

- Product requirements: `PRD.md`
- Architecture and data flow: `ARCHITECTURE.md`
- Delivery plan: `ROADMAP.md`
- Operator competencies: `Skills.md`
- Release history: `CHANGELOG.md`

