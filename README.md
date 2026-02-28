# CASAN RTO — Vehicle & Renter Management Dashboard

A web-based operations dashboard for managing EV motorcycles on **RTO (Rent-to-Own)** and **Rental** programs. Built for CASAN platform operators, OEM dealers, and GPS partners. Supports **Vehicle Inventory** management and **Renter Program** administration in a unified interface.

---

## 🌐 Live Demo

**[https://uicasanrto.vercel.app/](https://uicasanrto.vercel.app/)**

---

## 📁 Project Structure

```
casan_rto/
├── index.html                  # Main app shell (SPA)
├── netlify.toml                # Netlify deployment config
├── server.ps1                  # Local dev server (PowerShell)
├── css/
│   ├── layout.css              # 60/40 Vertical Panoramic Grid
│   ├── components.css          # High-density Cards, Expandable Status Guide
│   ├── style.css               # Global design tokens & IBM Plex Mono
│   ├── finance_strip.css       # Finance program earnings strip
│   ├── credit_bar.css          # Unified progress bars (RTO & KYC)
│   └── map_controls.css        # Map filter overlay & legend
└── js/
    ├── app.js                  # Simulation Loop & Event Bus
    ├── debug.js                # Dev helper utilities
    └── modules/
        ├── store.js            # Movement Simulation Engine (v2.0.0)
        ├── ui.js               # Render functions (v2.0.0)
        ├── map.js              # Leaflet 1:1 directional markers
        ├── finance.js          # Revenue analytics
        ├── gps.js              # GPS hardware auditing
        ├── rto.js              # RTO Applications & Pickup
        └── utils.js            # Shared formatters & helpers
```

---

## ✨ Features

### 🗺️ Live Fleet Map
| Feature | Status |
|---------|--------|
| Dark tile map (CartoDB, no API key) | ✅ |
| All markers shown individually (no clustering) | ✅ |
| **Directional arrow markers** rotating by bearing | ✅ |
| **Running 🏃** vehicles → glowing SVG arrow | ✅ |
| **Stopped 🅿️** vehicles → colored circle with glow | ✅ |
| **Real-time Movement Engine** (3s updates) | ✅ |
| **Vertical Panoramic Layout** (60/40 Split) | ✅ |
| **Expandable Status Guide** (Top-aligned) | ✅ |
| **Status filter buttons** with emoji icons | ✅ |
| **Available** vehicle filter in sidebar | ✅ |
| **☑️ All / 🚫 None** quick-select filter toggles | ✅ |
| Popup: credit days remaining + cycle days | ✅ |
| Popup: Running / Stopped / Offline status | ✅ |
| Legend: Real-time unit counts per state | ✅ |
| Focus on vehicle from sidebar | ✅ |

### 👤 Rider KYC & Profiles
| Feature | Status |
|---------|--------|
| **High-Density Program Strip:** Filter by cards (consistent with Finance) | ✅ |
| **Program-Level KPI Detail:** Live active/grace/immob counts per scheme | ✅ |
| **Behavioral Summary Card:** Contextual health stats for active filter | ✅ |
| **Unified Progress Design:** Linked to RTO Fleet progress bars | ✅ |
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
| **Commission Dual-Mode:** Toggle between % or Fixed Rp/day | ✅ |
| **Deep Program Insights:** Live breakdown stats (Active/Grace/Locked) | ✅ |
| **Collection & Maturity KPIs:** Score-based progress bars | ✅ |
| **Program Details Drawer:** High-density operational slide panel | ✅ |
| **Promotions Management:** Integrated incentives engine with image support | ✅ |
| **Full CRUD** for pricing, grace, and scheme details | ✅ |
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
| **Fleet Tracking:** Running, Stopped, No Signal, Risk, Idle | ✅ |
| **RTO/Applications:** Approved, Pending, Scoring stats | ✅ |
| **Finance:** Revenue, Arrears, Success Rate | ✅ |
| Secondary trend indicators and coloring | ✅ |
| Compact horizontal scroll on mobile | ✅ |

### 💰 Finance Tab
| Feature | Status |
|---------|--------|
| Paginated transactions (25/page) | ✅ |
| **Transaction Summaries:** Paid, Pending, Failed KPI cards | ✅ |
| **CASAN FEE column** (Replacing Credit Days for revenue clarity) | ✅ |
| **Smart Program Strips:** Shows % or Rp/day per program mode | ✅ |
| Payment method column | ✅ |
| Program filter (per-program revenue & stats) | ✅ |
| Clickable program earnings strip | ✅ |
| Payment modal | ✅ |
| Partner filter across fleet + finance | ✅ |

### 📡 GPS Tab
| Feature | Status |
|---------|--------|
| GPS device list with status | ✅ |
| **Combined Column:** GPS ID + status + relative last ping in one cell | ✅ |
| **Vehicle Identity Merge:** Plate plus brand/model in one cell | ✅ |
| **Vehicle brand & model** shown per device | ✅ |
| **IMEI number** shown in SIM column | ✅ |
| SIM carrier, data usage %, status | ✅ |
| Location with lat/lng + last ping time | ✅ |
| Address lookup (mock) | ✅ |
| Add / Edit / Delete GPS device modals | ✅ |
| **Duplicate stats bar removal** (tab optimized) | ✅ |

### 🎨 Navigation & Architecture
| Feature | Status |
|---------|--------|
| **Terminology Split:** Vehicles (Inventory) vs. Renters (Program Participants) | ✅ |
| **Sidebar:** Users → Programs (Admin) → Applications → Renters → Finance → Vehicles → Maps → GPS | ✅ |
| **Sidebar Changelog:** Changelog surfaced near `CASAN Operations` title | ✅ |
| **Renamed: Renters** (Active program participants — formerly Assets) | ✅ |
| **Renters Overhaul:** Removed top KPI bar, added prominent "+ Add Renter" | ✅ |
| **Inline Editing:** "Edit" button for renter profiles in row | ✅ |
| **Renamed: Vehicles** (Physical motorcycle inventory) | ✅ |
| **Renamed: Maps** (Fleet Tracking) | ✅ |
| **Renamed: GPS** (GPS List) | ✅ |
| **Vertical Viewports:** Maximized vertical height | ✅ |
| **Sub-Nav Layout Fix:** No stats bar occlusion | ✅ |
| **In-App Changelog Modal:** Versioned updates (v2.0.0) | ✅ |

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
| **Vehicle** *(Inventory)* | `id`, `status`, `programId`, `partnerId`, `credits`, `bearing`, `speed`, `isOnline`, `isRunning`, `rider`, `plate` |
| **User** *(Renter/KYC)* | `userId`, `name`, `gender` (90% M / 10% F), `nik`, `phone`, `riskLabel`, `vehicleId` (Strict 1:1) |
| **Transaction** | `id`, `vehicleId`, `date`, `amount`, `method`, `status`, `creditDays` (1, 2, 3, 5, 7, 15) |
| **GPS Device** | `id`, `imei`, `vehicleId`, `vehiclePlate`, `sim`, `status`, `lat`, `lng` |
| **Program** | `id`, `name`, `type` (RTO/Rent), `price/day`, `graceDays`, `commissionType` (%/Fixed), `commissionFixed`, `minSalary`, `targetScore`, `contractDuration`, `eligibleModels` |
| **RTO Application** | `id`, `userId`, `programId`, `status`, `score`, `assignedVehicleId`, `pickupDate` |
| **Partner** | `id`, `name`, `color` |

---

## 🚀 Deployment (Vercel)
 
### GitHub → Vercel Auto-Deploy *(recommended)*
1. Push your code to a GitHub repository.
2. In Vercel: **Add New Project → Import Repository**.
3. Vercel will automatically detect the static project.
4. Set the **Output Directory** to `root` or leave default if using the folder structure.
5. Every `git push` to `main` auto-deploys ✅
 
### Manual Deploy (Vercel CLI)
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` from the root directory.
3. Follow the prompts to link and deploy.

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
- **Hosting:** Vercel (static deploy via GitHub)
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
