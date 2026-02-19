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

### 📋 Fleet Sidebar
| Feature | Status |
|---------|--------|
| Vehicle list with status badges | ✅ |
| Clickable rows → focus vehicle on map | ✅ |
| Grace/Immobilized countdown timers | ✅ |
| Expiry credit-day warning bar | ✅ |

### 📊 Stats Bar
| Feature | Status |
|---------|--------|
| Active, Grace, Immobilized, Paused, Available counts | ✅ |
| Online / Offline indicators | ✅ |
| Compact horizontal scroll on mobile | ✅ |

### 💳 Finance Tab
| Feature | Status |
|---------|--------|
| Paginated transactions (25/page) | ✅ |
| **CREDIT DAYS column** (7 / 14 / 30 days per transaction) | ✅ |
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

## 🗂️ Data Model (Mock / Generated)

All data is generated client-side in `store.js` — no backend required.

| Entity | Key Fields |
|--------|-----------|
| **Vehicle** | `id`, `status`, `programId`, `partnerId`, `credits`, `bearing`, `speed`, `isOnline`, `isRunning`, `rider`, `plate`, `brand`, `model` |
| **Transaction** | `id`, `vehicleId`, `date`, `amount`, `method`, `status`, `creditDays` (7/14/30) |
| **GPS Device** | `id`, `imei`, `vehicleId`, `vehiclePlate`, `vehicleBrand`, `vehicleModel`, `sim`, `status`, `lat`, `lng` |
| **Program** | `id`, `name`, `type` (RTO/Rent), `price/day`, `graceDays` |
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

- **Program List tab** — full terms, rates, grace/holiday/buyout rules
- **Partner/Dealer tab** — locations, banking, CASAN contract, metrics
- **Fleet Detail modal** — STNK/BPKB docs, battery SoH, vehicle lifecycle
- **Alerts panel** — STNK expiry, PKB tax due, GPS offline, battery degraded
- **Real backend** — Supabase / Firebase for live data sync

---

## 📋 Repository

[github.com/CASANMGT/UICASANRTO](https://github.com/CASANMGT/UICASANRTO)
