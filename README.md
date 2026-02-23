# CASAN RTO — Fleet Management Dashboard

A web-based fleet operations dashboard for managing EV motorcycles on **RTO (Rent-to-Own)** and **Rental** programs. Built for CASAN platform operators, OEM dealers, and GPS partners.

---

## 🌐 Live Demo

**[https://gleeful-medovik-5ded90.netlify.app](https://gleeful-medovik-5ded90.netlify.app/)**

---

## 📁 Project Structure

```
casan_rto/
├── index.html                  # Main app shell (SPA)
├── netlify.toml                # Netlify deployment config
├── server.ps1                  # Local dev server (PowerShell)
├── css/
│   ├── layout.css              # Grid, flex, app shell layout
│   ├── components.css          # Cards, buttons, modals, stats bar
│   ├── style.css               # Global design tokens & typography
│   ├── finance_strip.css       # Finance program earnings strip
│   ├── credit_bar.css          # Credit day progress bar
│   └── map_controls.css        # Map filter overlay & legend
└── js/
    ├── app.js                  # App routing, event bus, view switching
    ├── debug.js                # Dev helper utilities
    └── modules/
        ├── store.js            # Data layer — vehicles, transactions, GPS, programs
        ├── ui.js               # Render functions — all tab views
        ├── map.js              # Leaflet map, directional markers, filters
        ├── finance.js          # Finance stats & transaction calculations
        ├── gps.js              # GPS device CRUD & status helpers
        ├── rto.js              # RTO Application & Pickup management
        └── utils.js            # Shared helpers (formatRupiah, timeAgo, etc.)
```

---

## ✨ Features

### 🗺️ Live Fleet Map
| Feature | Status |
|---------|--------|
| Dark tile map (CartoDB, no API key) | ✅ |
| All markers shown individually (no clustering) | ✅ |
| **Directional arrow markers** rotating by bearing | ✅ |
| Running vehicles → glowing SVG arrow | ✅ |
| Stopped vehicles → colored circle with glow | ✅ |
| **Status filter buttons** with emoji icons | ✅ |
| **☑️ All / 🚫 None** quick-select filter toggles | ✅ |
| **Running 🏃 / Stopped 🅿️** movement filters | ✅ |
| Popup: credit days remaining + cycle days | ✅ |
| Popup: grace period rest days remaining | ✅ |
| Popup: speed (km/h) + compass direction | ✅ |
| Popup: locked / expiring banners | ✅ |
| Legend: Online / Offline / Running counts | ✅ |
| Focus on vehicle from sidebar | ✅ |

### 👤 Rider KYC & Profiles
| Feature | Status |
|---------|--------|
| **High-Density Program Strip:** Filter by cards (consistent with Finance) | ✅ |
| **Program-Level KPI Detail:** Live active/grace/immob counts per scheme | ✅ |
| **Behavioral Summary Card:** Contextual health stats for active filter | ✅ |
| **Risk-Based Data Correlation:** incidents linked to user risk label | ✅ |
| **Quick Filter Badges:** Click table Program → filter list instantly | ✅ |
| Export CSV for filtered rider list | ✅ |
| Global search (Name, Phone, NIK) | ✅ |
| Sorting by Name, Risk, and Join Date | ✅ |

### 🏢 Station & Infrastructure
| Feature | Status |
|---------|--------|
| **Card-Based Station UX:** High-density monitoring cards | ✅ |
| **Hierarchical Device List:** Devices & sockets grouped by station | ✅ |
| **Live Connectivity Audit:** IMEI/SIM status per device | ✅ |
| **Map Integration:** "View on Map" direct focus action | ✅ |

### � Programs & Collections Management
| Feature | Status |
|---------|--------|
| **Multi-Scheme Sidebar** for partner programs | ✅ |
| **Collections Audit:** Visual badges (🔒/⚠️) for incidents | ✅ |
| **Risk Audit:** Executive reasoning and color coding | ✅ |
| **Interactive Analytics:** Health & Maturity popouts | ✅ |
| **Data Audit Breakdown:** Logic transparency overlays | ✅ |
| **Full CRUD** for pricing, grace, and holiday rules | ✅ |
| **CSV Export** for fleet and scheme auditing | ✅ |

### 📋 RTO Application Management
| Feature | Status |
|---------|--------|
| **Consolidated Sidebar UI:** Applications, Pickup, Score, WA | ✅ |
| **Unified Application Queue:** Real-time filtering and search | ✅ |
| **Automated Point System:** Configurable score dimensions | ✅ |
| **Pickup Scheduling:** Calendar-based driver appointments | ✅ |
| **WA Template Persistence:** Editable scenarios with LocalStorage | ✅ |
| **Interactive WA Preview:** Verification modal before sending | ✅ |

### �📊 Executive Stats Bar
| Feature | Status |
|---------|--------|
| High-density 6-column grid | ✅ |
| **Context-Aware KPIs** switching per navigation tab | ✅ |
| Active, Grace, Immobilized, Paused counts | ✅ |
| KYC Status, Success Rate, and Online/Offline counts | ✅ |
| Secondary trend indicators and coloring | ✅ |
| Compact horizontal scroll on mobile | ✅ |

### 💰 Finance Tab
| Feature | Status |
|---------|--------|
| Paginated transactions (25/page) | ✅ |
| **Transaction Summaries:** Paid, Pending, Failed KPI cards | ✅ |
| **CREDIT DAYS column** (1, 2, 3, 5, 7, 15 days packages) | ✅ |
| Payment method column | ✅ |
| Program filter (per-program revenue & stats) | ✅ |
| Clickable program earnings strip | ✅ |
| Payment modal | ✅ |
| Partner filter across fleet + finance | ✅ |

### 📡 GPS Tab
| Feature | Status |
|---------|--------|
| GPS device list with status | ✅ |
| **Vehicle brand & model** shown per device | ✅ |
| **IMEI number** shown in SIM column | ✅ |
| SIM carrier, data usage %, status | ✅ |
| Location with lat/lng + last ping time | ✅ |
| Address lookup (mock) | ✅ |
| Add / Edit / Delete GPS device modals | ✅ |

---

## 📈 Operational Intelligence

The Programs dashboard uses data-driven logic to evaluate scheme performance.

### ⚖️ Collection Health Logic
Collection health represents the ratio of **performing** vs **non-performing** assets within a scheme.
- **Formula:** `(Active Units / Total Assigned Units) × 100`
- **[Performing] Healthy Active:** Assets with positive credit balance (`active`).
- **[Non-Performing]:** Assets in `grace` (expired credit) or `immobilized` (locked/non-payment).

**Executive Benchmarks:**
- **● GOOD (>95%):** Operational Excellence. Payments are synchronized with daily usage.
- **● WARNING (90-95%):** Risk Alert. Requires immediate collection rigor and rider follow-up.
- **● CRITICAL (<90%):** Intervention Phase. Review rider risk profiles and consider asset recovery.

### 🏗️ Fleet Maturity Logic
Maturity reflects the average equity recovery across the program's lifecycle.
- **Formula:** `Average(RTO Progress %)` across all assigned vehicles.
- **0-25% (Early):** Growth & deployment phase. High upfront capital exposure.
- **25-75% (Mid):** Operational stability phase. Positive cashflow recovery.
- **>75% (High):** Impending ownership transfer. Final lifecycle stage.

---

## 🗂️ Data Model (Mock / Generated)

All data is generated client-side in `store.js` — no backend required.

| Entity | Key Fields |
|--------|-----------|
| **Vehicle** | `id`, `status`, `programId`, `partnerId`, `credits`, `bearing`, `speed`, `isOnline`, `isRunning`, `rider`, `plate` |
| **User** | `userId`, `name`, `gender` (90% M / 10% F), `nik`, `phone`, `riskLabel`, `vehicleId` (Strict 1:1) |
| **Transaction** | `id`, `vehicleId`, `date`, `amount`, `method`, `status`, `creditDays` (1, 2, 3, 5, 7, 15) |
| **GPS Device** | `id`, `imei`, `vehicleId`, `vehiclePlate`, `sim`, `status`, `lat`, `lng` |
| **Program** | `id`, `name`, `type` (RTO/Rent), `price/day`, `graceDays` (Standardized to 1) |
| **Partner** | `id`, `name`, `color` |

---

## 🚀 Deployment

### Netlify Drop (one-time, no CLI)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the `casan_rto/` folder onto the page
3. Live URL generated instantly

### GitHub → Netlify Auto-Deploy *(recommended)*
1. Ensure `netlify.toml` is at the **root** of the repo
2. In Netlify: **Site settings → Build & deploy → Link repository**
3. Set:
   - Build command: *(blank)*
   - Publish directory: `casan_rto`
4. Every `git push` to `main` auto-deploys ✅

### Local Development
```powershell
# From the casan_rto folder in PowerShell:
.\server.ps1
# Open: http://localhost:5501
```

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (ES Modules — no build step)
- **Map:** [Leaflet.js](https://leafletjs.com) — individual markers (no clustering)
- **Map tiles:** CartoDB Dark Matter (free, no API key)
- **Hosting:** Netlify (static deploy)
- **Fonts:** IBM Plex Mono (via CSS import)

---

## 🔮 Roadmap

The project follows a multi-phase evolution strategy focusing on scale, data-integrity, and industrial observability.

**[View Detailed Roadmap →](roadmap.md)**

- **Phase 1:** Feature Completion (Program Management, Dealer Portal).
- **Phase 2:** Backend Migration (Real-time DB & Auth).
- **Phase 3:** High-Density Analytics & Industrial Observability.

---

## 🛠️ Operator Skills

The system is designed for high-density operations. See **[Skills.md](Skills.md)** for the operator competency framework.

---

## 📋 Repository

[github.com/CASANMGT/UICASANRTO](https://github.com/CASANMGT/UICASANRTO)
