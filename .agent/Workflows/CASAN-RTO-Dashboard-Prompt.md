# CASAN RTO Fleet Management Dashboard — Full Recreation Prompt

> **Purpose:** This prompt contains every specification needed to recreate the CASAN RTO Fleet Management Dashboard from scratch. Hand this to any AI coding agent (Gemini, Claude, GPT, etc.) and it should produce a functionally equivalent single-file HTML dashboard.

---

## 1. PROJECT OVERVIEW

Build a **single-file HTML dashboard** for "CASAN Fleet Management" — a Rent-to-Own (RTO) and Rental fleet management platform for electric motorcycles in the Jabodetabek area (Jakarta + surrounding cities in Indonesia).

**Tech stack:** Single HTML file, vanilla JS, CSS. No frameworks. External CDN only for:
- Leaflet.js 1.9.4 (map) — cdnjs.cloudflare.com
- Leaflet.markercluster 1.5.3 (marker clustering) — cdnjs.cloudflare.com
- Google Fonts: DM Sans (body) + IBM Plex Mono (data/numbers)

**Design:** Dark theme, data-dense, professional fleet operations dashboard. Think Bloomberg Terminal meets modern SaaS.

---

## 2. DESIGN SYSTEM

### Color Palette (CSS Variables)
```
Background layers:  --bg:#07090E  --s1:#0C1018  --s2:#111723  --s3:#1A2234
Borders:            --b1:#1E2A3E  --b2:#2A3A52
Accent (teal):      --ac:#00E5C3  (with 7% and 16% alpha variants)
Status colors:
  Active/Green:     --g:#34D399
  Warning/Yellow:   --w:#FBBF24
  Danger/Red:       --d:#F87171
  Info/Blue:        --bl:#60A5FA
  Purple:           --p:#A78BFA
  Orange:           --o:#FB923C
  Expiring:         --exp:#FF6B35
Text:               --t1:#F0F4F8 (primary)  --t2:#94A3B8 (secondary)  --t3:#5B6B82 (muted)
```

### Typography
- Body: `'DM Sans', sans-serif` — variable weight 300-900
- Mono (data/numbers): `'IBM Plex Mono', monospace` — weights 400-700
- Use class `.m` as shorthand for monospace font

### Animations
- `pulse` — opacity 1→0.35→1 (2.5s, used for live indicator dots)
- `slideUp` — translateY(10px)→0 with opacity (modal/toast entrance)
- `barPulse` — opacity 1→0.5→1 (progress bars)
- `crit` — opacity 1→0.25→1 (1.2s, critical countdown seconds)
- `expPulse` — border-color pulse orange (3s, expiring card border)

### UI Principles
- Border radius: 10px (cards), 7px (inputs/buttons)
- All cards: `background: var(--s1)`, `border: 1px solid var(--b1)`
- Hover states: lighten background to `var(--s2)`, border to `var(--b2)`
- Scrollbar: 3px thin, track transparent, thumb matches border color
- Status badges: small pills with status-colored background at 7% opacity + text in full color

---

## 3. DATA MODEL

### 3.1 Dealers (Operators)
```js
{ id: "tangkas", name: "Tangkas Motors", color: "#A78BFA" }
{ id: "maka",    name: "Maka Motors",    color: "#60A5FA" }
{ id: "united",  name: "United Motors",  color: "#FB923C" }
```
Each dealer has a brand color used throughout for their data.

### 3.2 Programs
Each dealer offers RTO and/or Rental programs:
```js
{
  id: "P-TK-RTO",           // Unique program ID
  name: "Zeeho RTO",        // Full display name
  shortName: "Zeeho RTO",   // Compact display name (for card badges)
  operator: "tangkas",       // Links to dealer
  type: "RTO" | "Rent",     // Program type
  dailyRate: 38000,          // Rp per day (Indonesian Rupiah)
  graceDays: 7,              // Days before immobilization after credits expire
  fee: {
    type: "fixed" | "percent",  // CASAN's commission model
    amount: 3000                // Rp/day if fixed, or % if percent
  }
}
```

**6 programs total** — 2 per dealer (1 RTO + 1 Rent each). Daily rates range Rp 22,000–38,000. Grace periods 5–10 days. CASAN fees either fixed Rp/day or percentage of collection.

### 3.3 Vehicles
Generate **100 vehicles** with realistic distribution:
```js
{
  id: "CSN-001",              // Sequential ID: CSN-001 through CSN-100
  plate: "B 1234 EVA",        // Indonesian plate format (or "—" if available)
  model: "Zeeho Aegis",       // Must match dealer's brand models
  operator: "tangkas",        // Dealer who owns this vehicle
  program: "P-TK-RTO",       // Must match operator's program
  status: "active",           // See status lifecycle below
  hasGPS: true,               // ~82% of assigned vehicles have GPS
  lastPing: timestamp,        // Last GPS signal time
  lat: -6.186, lng: 106.846,  // Current position in Jabodetabek
  speed: 35,                  // km/h (0 if not active or no GPS)
  battery: 72,                // Battery percentage
  customer: "Ahmad Rizki",    // Assigned rider name (null if available)
  phone: "+62 812-3456-7890", // Indonesian phone format
  daysCredit: 15,             // Remaining credit days
  totalDays: 21,              // Current cycle total days
  dailyRate: 38000,           // From program
  graceExpiry: ISO_string,    // When grace period ends (null if not in grace)
  creditExpiry: ISO_string,   // When credits expire — for live countdown (null if >24h)
  paidCycles: 3,              // Number of completed payment cycles
  totalCycles: 12,            // Total expected cycles
  holiday: {                  // Holiday pause data (null if not paused)
    start: "2025-02-10",
    end: "2025-02-17",
    reason: "mudik" | "sakit" | "liburan" | "lainnya",
    status: "approved",
    notes: ""
  }
}
```

### 3.4 Status Distribution (of 100 vehicles)
- **55 Active** — vehicle is rented, credits > 0. ~12 of these are "expiring" (credits < 24h remaining, have `creditExpiry` timestamp)
- **15 Grace** — credits expired, countdown to immobilization. Has `graceExpiry` timestamp
- **12 Immobilized** — grace period expired, vehicle locked, awaiting payment
- **8 Paused** — on approved holiday, credits frozen
- **10 Available** — no customer assigned, ready for rental

### 3.5 Status Lifecycle
```
Active (credits > 0)
  ↓ credits reach 0
Expiring (< 24h remaining, live HH:MM countdown)
  ↓ credits hit 0
Grace Period (countdown: configurable 5-10 days per program)
  ↓ grace period expires
Immobilized (vehicle locked, red alert)
  ↓ payment received
Active (credits restored)

At any point Active → Paused (holiday) → Active (resume)
```

### 3.6 Online/Offline Logic
- **Online:** has GPS AND last ping < 1 hour ago
- **Offline:** no GPS, OR last ping > 1 hour ago
- Display offline duration: "Offline 3h ago", "Offline 2d ago"

### 3.7 Transactions
Generate transaction history from each vehicle's payment cycles:
```js
{
  id: "TX-1001",
  vehicleId: "CSN-001",
  customer: "Ahmad Rizki",
  phone: "+62 812-3456-7890",
  operator: "tangkas",
  operatorName: "Tangkas Motors",
  operatorColor: "#A78BFA",
  program: "P-TK-RTO",
  programName: "Zeeho RTO",
  programType: "RTO",
  days: 14,                    // Days purchased
  dailyRate: 38000,
  amount: 532000,              // days × dailyRate
  casanFee: 42000,             // CASAN's commission
  operatorEarning: 490000,     // amount - casanFee
  status: "paid" | "pending" | "overdue",
  date: ISO_string,
  method: "bank" | "qris" | "cash" | "—"
}
```

### 3.8 Geographic Areas
Scatter vehicles across 10 areas of Jabodetabek with realistic coordinates:
- Jakarta Pusat (-6.186, 106.846), Jakarta Selatan (-6.261, 106.810)
- Jakarta Barat (-6.168, 106.765), Jakarta Timur (-6.225, 106.900)
- Jakarta Utara (-6.138, 106.843), Tangerang (-6.178, 106.630)
- Tangerang Selatan (-6.314, 106.691), Bekasi (-6.238, 106.990)
- Depok (-6.392, 106.824), Bogor (-6.595, 106.816)

Each area has a radius for random offset (0.018–0.028 degrees).

---

## 4. PAGE LAYOUT

### 4.1 Shell Structure
```
┌─────────────────────────────────────────────────────┐
│ HEADER: Logo | "CASAN Fleet Management" | Dealer Select | LIVE dot │
├─────────────────────────────────────────────────────┤
│ NAV TABS: [🗺️ Fleet & Tracking] [💰 Finance]       │
├─────────────────────────────────────────────────────┤
│ STATS BAR: 7 metric cards in a row                  │
├─────────────────────────────────────────────────────┤
│ MAIN CONTENT (switches based on active tab)         │
│  Fleet: Map (left) + Vehicle Panel (right)          │
│  Finance: Program Sidebar (left) + Finance Main     │
└─────────────────────────────────────────────────────┘
```

Full viewport height on desktop (`height:100vh`, `overflow:hidden`).
Max width: 1640px, centered.

### 4.2 Header
- Left: Logo square (gradient teal→cyan, "C" letter) + title + subtitle "RTO & Rental — Jabodetabek"
- Right: Dealer dropdown selector (filters everything globally) + LIVE indicator (pulsing green dot + "LIVE" text)

### 4.3 Stats Bar
7 metric cards in equal grid:
1. **Fleet** — total vehicle count (white)
2. **Active** — active count (green)
3. **Expiring** — expiring within 24h count (orange)
4. **Grace** — in grace period count (yellow)
5. **Immobilized** — locked count (red)
6. **Online** — "X/Y" format (teal, smaller text)
7. **Revenue** — total paid revenue in Rp (purple, smaller text)

---

## 5. FLEET & TRACKING TAB

### 5.1 Layout
Desktop: CSS Grid `1fr 400px` — map takes remaining space, vehicle panel is 400px sidebar.
Tablet/Mobile: Single column stack — map on top, panel below.

### 5.2 Map (Leaflet.js)
- Dark theme: Apply CSS filter to tile pane: `invert(1) hue-rotate(180deg) brightness(.6) contrast(1.2) saturate(.2)`
- Tile source: OpenStreetMap via `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Center: `-6.25, 106.845` (Jakarta), zoom 11
- No attribution control, zoom control at bottom-left
- **Graceful fallback:** If Leaflet fails to load, show placeholder "🗺️ Map Unavailable"

#### Markers
- Colored dots (10px circle) with 2px dark border and matching glow shadow
- Color logic:
  - **Offline** (not online): `#FF6B6B` (red)
  - **Expiring** (active + credits < 24h): `#FF6B35` (orange)
  - **All others**: Status color (green for active, yellow for grace, etc.)
- Click marker → select that vehicle in the panel, fly to zoom 15

#### Marker Clustering
- Use `L.markerClusterGroup` with `maxClusterRadius: 35`
- Style clusters: dark semi-transparent background with backdrop blur, teal numbered circle
- Graceful fallback: if markercluster plugin not available, add markers directly to map

#### Map Filter Buttons
- 8 toggle buttons overlaid top-right of map:
  Active, Expiring, Grace, Immobilized, Paused, Available, Online, Offline
- Each has a colored dot indicator + label
- Toggle on/off to show/hide that category on map
- Active filters have colored border, inactive have default border

#### Map Legend
- Bottom-left overlay: "X Online" (green dot) + "Y Offline" (red dot)

### 5.3 Vehicle Panel

#### Search
- Full-width text input: "Search ID, plate, customer, phone..."
- Filters vehicle list in real-time
- Desktop: standard input. Mobile: larger 14px font, more padding.

#### Filter Bar
- **Desktop:** 8 inline filter buttons with counts: All (N), Active (N), Expiring (N), Grace (N), Immob. (N), Paused (N), Offline (N), Online (N)
- **Mobile:** Replace buttons with a native `<select>` dropdown showing same options with counts
- Each filter has its own color when active (matching status color)
- "Expiring" filter: shows vehicles with `creditExpiry` !== null
- "Offline" filter: shows vehicles where `!isOnline && status !== 'available'`
- "Online" filter: shows vehicles where `isOnline`

#### Vehicle List
- Scrollable list of vehicle cards
- **20 vehicles per page** with pagination
- Sort order (priority): Immobilized → Grace → Expiring → Active → Paused → Available

#### Vehicle Card — Compact View (Desktop)
Single-row flex layout:
```
[●] CSN-001 | ACTIVE RTO | Zeeho RTO | Ahmad Rizki | 14d | 🟢 Online | [▼]
     ↑ ID      ↑ badges     ↑ program   ↑ customer   ↑ credits ↑ online  ↑ expand
```

- **ID:** Monospace, bold, min-width 52px
- **Badges:** Status pill (colored) + Type pill (RTO=purple, Rent=blue) + "⚠ EXPIRING" pulse badge (if applicable) + "⏸" holiday badge (if paused)
- **Program:** Short name, truncated to 72px, muted color
- **Customer:** Flex-grow, truncated with ellipsis
- **Credits:** Monospace bold. Color: red if 0, orange if expiring, yellow if ≤3, green otherwise
  - If expiring (< 24h): Show **live countdown** `HH:MMm` format (e.g., "14h32m") in orange, updates every second
  - Normal: Show "14d" format
- **Online status:** Green dot + "Online" OR red dot + "Offline 3h ago"
- **Expand button:** Small ▼ toggle

#### Vehicle Card — Compact View (Mobile ≤768px)
**4-row stacked grid layout** using CSS Grid (`grid-template-columns: 1fr auto; grid-template-rows: auto auto auto auto`):
```
┌──────────────────────────────────────┐
│ CSN-001                          [▼] │  Row 1: ID (14px bold) + expand button (36×36)
│ ACTIVE  RTO  Zeeho RTO  ⚠ EXPIRING │  Row 2: all badges including program name badge
│ Ahmad Rizki                          │  Row 3: full customer name (never truncated)
│ 14d                    🟢 Online     │  Row 4: credits (left) + online status (right)
└──────────────────────────────────────┘
```

Key mobile rules:
- Program name text (`.vc-prog`) is hidden; instead show program short name as a badge in the badges row
- Customer name: `white-space:normal; overflow:visible` — NEVER truncate
- Credits + Online wrapped in a flex container with `justify-content:space-between`
- Expand button: `36×36px`, positioned at grid-column 2, grid-row 1
- Badges row + customer row + credits row all span `grid-column:1/-1` (full width)

#### Vehicle Card — Expanded Detail
When expanded, show below the compact view:

1. **Info Grid** (3-column desktop, 2-column mobile):
   Model, Plate, Phone, Dealer (colored), CASAN Fee, Battery %

2. **Credits Block** (dark inset):
   - Credits remaining (large number) + daily rate
   - Progress bar (remaining / total days)
   - Grace period info + cycle count (e.g., "3/12 cycles")

3. **Status-specific Countdown Block:**
   - **Expiring:** Orange warning box — "⚠ EXPIRING — GRACE STARTS IN" + live HH:MM:SS countdown (seconds animate with critical pulse)
   - **Grace:** Yellow warning box — "⚡ GRACE — IMMOBILIZE IN" + DD:HH:MM:SS countdown + progress bar (time remaining / grace period, gradient yellow→red)
   - **Immobilized:** Red alert box — pulsing red dot + "IMMOBILIZED — AWAITING PAYMENT"
   - **Paused:** Blue info box — "⏸ HOLIDAY — [REASON]" + date range + days remaining

4. **GPS Metadata Row:**
   📍 coordinates | ⚡ speed km/h | 📡 Online/Offline duration

5. **Action Buttons:**
   - 💰 Credit / 🔓 Unlock (green) — opens payment modal
   - 🏖️ Holiday / ▶️ Resume (blue) — opens holiday modal or resumes
   - 🔒 Lock (red) — manual immobilize
   - 📱 WA (teal) — WhatsApp link

### 5.4 Pagination
- Show page numbers with ellipsis for large page counts
- Prev/Next arrows
- "1–20 of 100" info display
- Mobile: larger touch targets (8px×12px padding, min-width 36px)

---

## 6. FINANCE TAB

### 6.1 Layout
Desktop: CSS Grid `240px 1fr` — program sidebar + main finance area.
Mobile: Single column — programs as horizontal scrollable cards, then main content below.

### 6.2 Program Sidebar
- List of program cards (one per program, filtered by dealer selection)
- Each card shows: Program name, dealer name (colored), RTO/Rent badge, vehicle count, active count, operator earnings, CASAN fees
- Click to filter transactions by that program
- Selected card gets teal border highlight

### 6.3 Expiring Alert Banner
- Orange alert at top of finance content (only shows if expiring count > 0)
- "⚠️ X vehicles expiring within 24h — credits running out, will enter grace period soon"
- Count badge on the right

### 6.4 Summary Cards (4-column grid, 2-column on mobile)
1. **Revenue** — total paid amount (white) + "N paid" subtitle (green)
2. **Op. Earnings** — total operator earnings (purple) + percentage subtitle
3. **CASAN** — total CASAN fees (teal) + percentage subtitle
4. **Outstanding** — total overdue amount (red) + "N overdue" subtitle (yellow)

### 6.5 Commission by Dealer
- Stacked horizontal bar chart per dealer
- Each bar shows: Dealer name (colored) | progress bar (operator % + CASAN %) | Rp values
- Operator earnings in dealer color, CASAN fees in teal

### 6.6 Transaction Table
- Full data table with columns: TX ID, Date, Customer, Dealer, Program, Method (with emoji), Days, Amount, Op. Earning, CASAN Fee, Status badge
- **Table must have `min-width:800px`** to prevent column squishing — wrapper has `overflow-x:auto` for horizontal scroll on mobile
- Filter buttons above: All, Paid, Overdue, Pending
- **📥 CSV export button** — exports filtered transactions as CSV file
- **Pagination:** 20 per page, same style as vehicle list

---

## 7. MODALS

### 7.1 Payment Modal
- Title: "💰 Record Payment"
- Shows vehicle info: ID, model, customer, current status, credits remaining, daily rate
- If immobilized: shows "Unlocks on payment" message
- Fields:
  - Method: Bank / QRIS / Cash / Other (dropdown, shows different sub-fields per method)
  - Bank fields: Bank name + Reference number
  - QRIS field: QRIS reference
  - Other field: Description
  - Days (number input, default 7)
  - Amount (auto-calculated: days × dailyRate, formatted as Rupiah)
  - Notes (optional)
- Cancel + Confirm buttons
- On confirm: add credits, change status to active if was grace/immobilized, create transaction record, show toast

### 7.2 Holiday Modal
- Title: "🏖️ Holiday Pause"
- Shows vehicle info: credits remaining, "Credits freeze" effect
- Fields:
  - Start date + End date (date pickers)
  - Reason: Mudik (🏠) / Medical (🏥) / Vacation (✈️) / Other (📝)
  - Notes (optional)
- Live preview: "⏸ Xd pause: start → end"
- Cancel + Approve buttons
- On approve: set status to paused, store holiday data, show toast

### 7.3 Modal Behavior
- Desktop: Centered overlay with backdrop blur
- **Mobile: Bottom sheet** — slides up from bottom, rounded top corners, full width
- Backdrop: `rgba(0,0,0,.6)` with `backdrop-filter:blur(3px)`
- Content: `slideUp` animation on open

---

## 8. TOAST NOTIFICATIONS
- Fixed bottom-right (desktop) or full-width bottom (mobile)
- Green for success, red for error
- Auto-dismiss after 3 seconds
- Slide-up animation on appear

---

## 9. LIVE UPDATES

### Real-time Countdown Behavior
- **1-second interval** updates card list when fleet tab is active
- Grace countdown: DD:HH:MM:SS — seconds digit pulses when < 6 hours remaining
- Expiring countdown: HH:MMm in compact view, HH:MM:SS in expanded view — seconds always pulse
- Efficient DOM patching: only update countdown text elements by ID, don't re-render entire card list unless structure changed

### Card List Rendering Strategy
- Track card IDs + state hash to detect changes
- If no structural change (same vehicles, same statuses, same selection/expansion): only patch countdown elements
- If structural change: full re-render with scroll position preservation

---

## 10. RESPONSIVE DESIGN

### Breakpoints
- **>1200px:** Full desktop layout (map + sidebar, finance grid)
- **≤1200px:** Single column (map stacks above panel, finance stacks)
- **≤768px:** Full mobile optimization (see below)
- **≤400px:** Ultra-compact (2-column stats, single-column finance summary)

### Mobile (≤768px) — Complete Specification

**Body:** `overflow:auto` (enable natural scrolling), shell `height:auto; min-height:100vh`

**Header:** Stack vertically, dealer select + LIVE on own row full width

**Nav:** Full-width equal tabs (`flex:1`), 10px padding, 11px font

**Stats:** 2×4 grid, 14px values, 7px labels

**Map:** 240-300px height, filter buttons move to bottom-center as centered strip

**Search:** 14px font, 11px padding, 8px border-radius

**Filter:** Hide button bar (`display:none`), show native `<select>` dropdown

**Vehicle Cards:** CSS Grid 4-row layout (described in section 5.3 mobile)

**Pagination:** 8px×12px buttons, 11px font, min-width 36px

**Finance Programs:** Horizontal scrollable strip of cards (flex-direction:row, min-width 200px each, no wrap)

**Transaction Table:** `overflow-x:auto` wrapper with `-webkit-overflow-scrolling:touch`, table `min-width:800px`

**Modals:** Bottom sheet style (align-items:flex-end on overlay, border-radius 16px 16px 0 0, full width)

**Form Inputs:** 14px font, 12px padding, 8px border-radius

**Action Buttons:** 10px font, 10px padding, 8px border-radius, min-width 70px

**Toast:** Full-width bottom bar on mobile

---

## 11. KEY INTERACTIONS

| Action | Trigger | Result |
|---|---|---|
| Dealer filter | Header dropdown change | Filters all data globally (vehicles, map, stats, finance) |
| Tab switch | Nav button click | Show/hide fleet vs finance views, re-render, invalidate map size |
| Status filter | Filter button/dropdown | Filter vehicle list, reset to page 1 |
| Search | Text input | Real-time filter by ID, plate, customer name, phone |
| Map marker click | Click marker on map | Select vehicle in panel, fly to zoom 15 |
| Vehicle card click | Click card body | Select/deselect, fly map to vehicle location |
| Expand card | Click ▼ button | Toggle expanded detail section |
| Record payment | Click 💰 Credit / 🔓 Unlock | Open payment modal pre-filled with vehicle data |
| Approve holiday | Click 🏖️ Holiday | Open holiday modal |
| Resume from holiday | Click ▶️ Resume | Immediately set status to active, clear holiday data |
| Program select | Click program card in finance | Filter transactions by that program |
| Transaction filter | Click All/Paid/Overdue/Pending | Filter transaction table |
| CSV export | Click 📥 CSV | Download filtered transactions as CSV |

---

## 12. CURRENCY & LOCALE

- All amounts in Indonesian Rupiah: `Rp 38,000` format
- Use `toLocaleString('id-ID')` for number formatting
- Dates: `DD Mon YYYY` format using `toLocaleDateString('id-ID')`
- Phone numbers: `+62 8XX-XXXX-XXXX` format

---

## 13. IMPLEMENTATION NOTES

### Single File Architecture
Everything must be in one `.html` file:
- `<style>` block with all CSS (including responsive media queries)
- `<body>` with HTML structure
- `<script>` block with all JS (data generation, rendering, interactions)

### Data Generation
All data is generated client-side on page load using seeded random distributions. No API calls. The dashboard is a fully self-contained demo/prototype.

### Performance
- 100 vehicles, ~500+ transactions — must render smoothly
- 1-second countdown interval should only update DOM elements that changed
- Map marker clustering prevents rendering 100+ individual markers at low zoom
- Pagination (20/page) prevents large DOM for vehicle and transaction lists

### Error Handling
- Leaflet fails to load: Show "Map Unavailable" placeholder
- MarkerCluster fails to load: Add markers directly to map (no clustering)
- All modals: Validate inputs before processing

### Currency Formatting Helper
```js
const formatRupiah = (n) => 'Rp ' + n.toLocaleString('id-ID');
```

### Time Helpers
```js
// Time ago display
function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'Now';
  if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago';
  return Math.floor(diff/86400000) + 'd ago';
}

// Countdown from ISO date
function getCountdown(isoDate) {
  const remaining = new Date(isoDate).getTime() - Date.now();
  if (remaining <= 0) return { expired: true };
  return {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor((remaining % 86400000) / 3600000),
    minutes: Math.floor((remaining % 3600000) / 60000),
    seconds: Math.floor((remaining % 60000) / 1000),
    total: remaining
  };
}
```

---

## 14. ACCEPTANCE CRITERIA

The finished dashboard must:

- [ ] Render 100 vehicles with correct status distribution across 3 dealers
- [ ] Show live map with dark theme, clustered markers, and 8 filter toggles
- [ ] Display vehicle cards with all information readable on both desktop and mobile
- [ ] Show live countdowns (updating every second) for expiring and grace vehicles
- [ ] Support full payment workflow: open modal → fill → confirm → credits update → status change
- [ ] Support holiday workflow: approve → pause → resume
- [ ] Finance tab shows revenue breakdown, commission split, and paginated transaction table
- [ ] CSV export works for filtered transaction data
- [ ] All elements are usable on 375px mobile screens (no truncated text, proper tap targets)
- [ ] Dealer dropdown globally filters all views
- [ ] Toast notifications appear on actions
- [ ] Page loads and renders within 2 seconds
- [ ] Single HTML file, no build step required
