# CASAN RTO — Fleet Management Dashboard

A web-based fleet operations dashboard for managing EV motorcycles on RTO (Rent-to-Own) and Rental programs. Built for CASAN platform operators, OEM dealers, and GPS partners.

---

## 🌐 Live Demo

**[https://gleeful-medovik-5ded90.netlify.app](https://69965db0baa068f1603696ef--gleeful-medovik-5ded90.netlify.app/)**

---

## 📁 Project Structure

```
casan_rto/
├── index.html              # Main app shell
├── netlify.toml            # Netlify deployment config
├── server.ps1              # Local dev server (PowerShell)
├── css/
│   ├── layout.css          # Grid, flex, app shell layout
│   ├── components.css      # Cards, buttons, modals, stats bar
│   └── finance_strip.css   # Finance program strip styles
└── js/
    ├── app.js              # Main app logic, event listeners, routing
    └── modules/
        ├── store.js        # Data layer — vehicles, transactions, programs, partners
        ├── ui.js           # Render functions — all views
        ├── map.js          # Leaflet map, clustering, markers, filters
        ├── finance.js      # Finance calculations — stats, program earnings, transactions
        └── utils.js        # Shared helpers (formatRupiah, dates, etc.)
```

---

## ✨ Features

| Feature | Status |
|---------|--------|
| Live fleet map (Leaflet + clustering) | ✅ |
| Vehicle sidebar with status filters | ✅ |
| Real-time countdown for Grace/Immobilized | ✅ |
| Stats bar (Active, Grace, Immobilized, etc.) | ✅ |
| Finance tab — 25/page paginated transactions | ✅ |
| Program filter (per-program revenue/stats) | ✅ |
| Clickable program earnings strip | ✅ |
| Payment modal, Holiday pause modal | ✅ |
| Partner filter across fleet + finance | ✅ |
| Programs tab (full rules + metrics) | 🔜 |
| Partners/Dealer tab | 🔜 |
| GPS Device management tab | 🔜 |

---

## 🚀 Deployment

### Netlify Drop (one-time, no CLI)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the `casan_rto/` folder onto the page
3. Live URL generated instantly

### GitHub → Netlify Auto-Deploy (recommended)
1. Upload `netlify.toml` to the **root** of this repo
2. In Netlify: **Site settings → Build & deploy → Link repository**
3. Select `CASANMGT/UICASANRTO`, set:
   - Build command: *(blank)*
   - Publish directory: `casan_rto`
4. Every `git push` to `main` auto-deploys ✅

### Local Development
```powershell
# In PowerShell from this folder:
.\server.ps1
# Then open: http://localhost:5501
```

---

## 🗂️ Data Model (Mock / Generated)

All data is generated client-side in `store.js` — no backend required for this demo.

| Entity | Key Fields |
|--------|-----------|
| **Vehicle** | id, status, programId, partnerId, creditsRemaining, rider |
| **Transaction** | id, vehicleId, date, amount, method, status |
| **Program** | id, name, type (RTO/Rent), price/day, grace days |
| **Partner** | id, name, color |

---

## 🔮 Roadmap (v2 — see `casan-lists.md`)

Based on full platform spec:
- **Program List tab** — full terms, rates, grace/holiday/buyout rules
- **Partner/Dealer tab** — locations, banking, CASAN contract, metrics
- **GPS Devices tab** — IMEI, SIM status, firmware, immobilization log
- **Fleet Detail modal** — STNK/BPKB, battery SoH, lifecycle stage, vehicle financials
- **Alerts panel** — STNK expiry, PKB tax due, GPS offline, battery degraded
- **Real backend** — Supabase / Firebase for live data

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (ES Modules)
- **Map:** [Leaflet.js](https://leafletjs.com) + [MarkerCluster](https://github.com/Leaflet/Leaflet.markercluster)
- **Map tiles:** CartoDB (free, no API key required)
- **Hosting:** Netlify (static, no build step)
- **Fonts:** IBM Plex Mono (via inline CSS)

---

## 📋 GitHub Repo

[github.com/CASANMGT/UICASANRTO](https://github.com/CASANMGT/UICASANRTO)
