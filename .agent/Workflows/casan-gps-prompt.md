# CASAN GPS Device Management — Full Feature Prompt for Antigravity

---

## PROMPT START — COPY EVERYTHING BELOW THIS LINE

---

You are building a **GPS Device Management** tab/module for the CASAN RTO Fleet Management platform. CASAN manages electric motorcycle Rent-to-Own (RTO) and Rental programs for OJOL (ride-hailing) drivers across Jabodetabek, Indonesia. This GPS module is a critical operational tool — it tracks every physical GPS tracking device in the system, their connectivity, SIM cards, installation status, and real-time location on a map.

---

## CONTEXT — WHAT CASAN DOES

CASAN is a platform that connects electric motorcycle OEMs → Dealers → OJOL riders through RTO programs. Every vehicle in the program has a GPS tracking device installed that enables:
- Real-time location tracking of the motorcycle
- Remote immobilization (cut motor) when rider doesn't pay
- Speed monitoring, geofencing, tamper alerts
- Battery voltage monitoring from the vehicle

GPS devices are purchased in bulk, stored in inventory, then installed on vehicles when they enter the fleet. Some devices are assigned to vehicles, some are in stock (unassigned), some are faulty and awaiting RMA (return for repair/replacement). The SIM cards inside each device need data to communicate — when a SIM runs out of data or expires, the device goes "offline" even though the hardware is fine. This is the #1 cause of false "offline" alerts and must be managed proactively.

---

## DESIGN SYSTEM — MUST MATCH EXISTING CASAN UI

Use this exact design language (matches the existing CASAN Fleet Management dashboard):

```
COLORS:
--bg: #07090E (background)
--s1: #0C1018 (surface 1 — cards, panels)
--s2: #111723 (surface 2 — hover states)
--s3: #1A2234 (surface 3 — active states)
--b1: #1E2A3E (border 1)
--b2: #2A3A52 (border 2 — hover borders)
--ac: #00E5C3 (accent — teal/cyan — CASAN brand)
--g: #34D399 (green — online, active, healthy)
--w: #FBBF24 (warning — amber/yellow)
--d: #F87171 (danger — red — offline, critical)
--bl: #60A5FA (blue — informational)
--p: #A78BFA (purple — special states)
--o: #FB923C (orange)
--t1: #F0F4F8 (text primary — white-ish)
--t2: #94A3B8 (text secondary — muted)
--t3: #5B6B82 (text tertiary — labels)

FONTS:
- Primary: 'DM Sans' — all UI text
- Monospace: 'IBM Plex Mono' — IDs, numbers, codes, IMEI, serial numbers, timestamps, badges

COMPONENTS:
- Cards: background var(--s1), border 1px solid var(--b1), border-radius 10px
- Badges: font-size 7-8px, font-weight 700, padding 2px 6px, border-radius 3px, IBM Plex Mono
- Buttons: border 1px solid, transparent background, transition all 0.12s
- Status dots: 4-6px circles with box-shadow glow matching status color
- Tables: sticky headers, var(--s3) header background, monospace for data columns
- Scrollbars: 3px wide, var(--b1) thumb, transparent track
- Animations: pulse for live dots, slideUp for modals/toasts
```

Map styling: Use **Leaflet.js** with OpenStreetMap tiles, dark-mode inverted filter:
```css
filter: invert(1) hue-rotate(180deg) brightness(.6) contrast(1.2) saturate(.2)
```
Use **MarkerCluster** for grouping dense markers. Cluster background: rgba(7,9,14,.7) with backdrop-filter blur(4px). Cluster count badge: var(--ac) background with var(--bg) text.

---

## LAYOUT STRUCTURE

This is a **new tab** called "📡 GPS Devices" in the top navigation bar, alongside the existing "🗺️ Fleet & Tracking" and "💰 Finance" tabs.

### Layout: Split View (same pattern as Fleet tab)
```
┌─────────────────────────────────────────────────────────┐
│ HEADER — CASAN Fleet Management                         │
├─────────────────────────────────────────────────────────┤
│ NAV: [🗺️ Fleet & Tracking] [💰 Finance] [📡 GPS Devices]│
├─────────────────────────────────────────────────────────┤
│ STATS BAR — 7 summary cards across full width           │
├────────────────────────────────┬────────────────────────┤
│                                │                        │
│         GPS MAP                │    DEVICE LIST         │
│     (Leaflet map showing       │    (scrollable list    │
│      all GPS device            │     of GPS device      │
│      positions with            │     cards with         │
│      color-coded markers       │     status, IMEI,      │
│      and cluster groups)       │     vehicle link,      │
│                                │     signal, SIM info)  │
│                                │                        │
├────────────────────────────────┴────────────────────────┤
│ PAGINATION — page controls                              │
└─────────────────────────────────────────────────────────┘
```

Grid: `grid-template-columns: 1fr 420px` (map takes remaining space, device list is 420px panel on right)

On mobile (<768px): Stack vertically — map on top (min-height 260px, max-height 300px), device list below.

---

## STATS BAR — 7 Summary Cards

Show these 7 metrics at the top, same style as existing stats bar:

| Stat | Value Example | Color | Calculation |
|------|---------------|-------|-------------|
| Total Devices | 150 | var(--t1) | All GPS devices in system |
| Online | 112 | var(--g) | Devices that pinged within last 60 minutes |
| Offline | 23 | var(--d) | Assigned devices not pinged in >60 minutes |
| Unassigned | 15 | var(--t3) | Devices in stock, not installed on any vehicle |
| Low Signal | 8 | var(--w) | Online but signal strength is "Poor" |
| SIM Alert | 5 | var(--o) | SIM expiring within 7 days OR low data balance |
| Tampered | 2 | var(--d) | Tamper alert triggered, blinking animation |

---

## GPS DEVICE DATA MODEL

Generate **150 GPS devices** with realistic demo data. Here's the complete data structure for each device:

```javascript
{
  // === DEVICE IDENTITY ===
  id: "GPS-001234",              // CASAN internal ID, auto-incrementing
  imei: "860123456789012",       // 15-digit IMEI — generate realistic random
  serial: "WL-2024-A00456",      // Manufacturer serial number
  brand: "Weloop",               // One of: "Weloop", "Sinotrack", "Concox", "Teltonika"
  model: "WL-210 Pro",           // Device model (varies by brand)
  firmware: "FW-3.4.2",          // Firmware version string
  hwVersion: "v2.1",             // Hardware revision

  // === CAPABILITIES (based on model) ===
  canImmobilize: true,           // Can cut motor remotely
  canSpeedLimit: true,           // Can limit top speed
  canGeofence: true,             // Zone alerts
  hasTamperAlert: true,          // Detects physical removal
  hasAccelerometer: true,        // Crash/harsh braking detection
  hasInternalBattery: true,      // Backup battery for tracking when main power cut
  internalBatteryHours: 6,       // Backup battery life in hours

  // === SIM CARD ===
  simNumber: "089912345678",     // Phone number on SIM
  simIccid: "8962012345678901234", // SIM card unique ID
  simCarrier: "Telkomsel",       // One of: "Telkomsel", "XL Axiata", "Indosat", "Tri", "Smartfren"
  simPlan: "M2M Pool",          // One of: "Prepaid", "Postpaid", "M2M Pool"
  simDataAllowance: 500,         // MB per month
  simDataUsed: 312,              // MB used this month
  simExpiry: "2025-12-31",       // SIM expiry date
  simLastTopUp: "2025-06-15",    // Last top-up date
  simMonthlyCost: 15000,         // Rp per month
  simStatus: "active",           // One of: "active", "low_balance", "expired", "blocked"
  simAutoTopUp: true,            // Auto-renew enabled

  // === ASSIGNMENT ===
  assignedVehicle: "CSN-045",    // Vehicle ID or null if unassigned
  assignedVehicleModel: "Zeeho Aegis", // For display, null if unassigned
  assignedVehiclePlate: "B 3456 EVA", // Plate number, null if unassigned
  assignedDealer: "Tangkas Motors", // Dealer name, null if unassigned
  assignedDealerId: "tangkas",   // Dealer ID for filtering
  installDate: "2025-03-10",     // When installed on current vehicle, null if unassigned
  installedBy: "Pak Rudi",       // Installer name
  mountPosition: "Under Seat",   // One of: "Under Seat", "Behind Panel", "Frame Rail", "Battery Compartment"
  relayConnected: true,          // Immobilization relay wired

  // === REAL-TIME STATUS ===
  status: "online",              // MASTER STATUS — see status definitions below
  lastPing: 1718881425000,       // Timestamp (ms) of last communication
  lat: -6.2654,                  // Last known latitude
  lng: 106.8721,                 // Last known longitude
  speed: 35,                     // km/h at last ping
  heading: 180,                  // Degrees (0=N, 90=E, 180=S, 270=W)
  signalStrength: "good",        // One of: "excellent", "good", "fair", "poor", "none"
  gpsSatellites: 8,              // Number of GPS satellites locked
  vehicleBatteryVoltage: 72.4,   // Voltage from vehicle's main battery
  internalBatteryLevel: 95,      // Backup battery % (0-100)
  ignitionOn: true,              // Vehicle ignition state
  pingInterval: "30s",           // Current reporting frequency

  // === IMMOBILIZATION STATE ===
  immobState: "normal",          // One of: "normal", "immobilized", "speed_limited"
  lastCommand: null,             // Last command sent: "IMMOBILIZE", "REACTIVATE", "SPEED_LIMIT_30", etc.
  lastCommandTime: null,         // When command was sent
  lastCommandAcked: true,        // Device confirmed receipt
  totalImmobilizations: 3,       // Lifetime lock count for this device

  // === ALERTS ===
  alerts: [],                    // Array of active alerts, e.g.:
  // { type: "tamper", time: timestamp, message: "Device removal detected" }
  // { type: "geofence_exit", time: timestamp, message: "Left Jabodetabek zone" }
  // { type: "tow", time: timestamp, message: "Vehicle moving, ignition OFF" }
  // { type: "low_battery", time: timestamp, message: "Internal battery 15%" }
  // { type: "sim_expiring", time: timestamp, message: "SIM expires in 5 days" }
  // { type: "offline_extended", time: timestamp, message: "Offline >24 hours" }
  // { type: "speed_violation", time: timestamp, message: "Speed >80 km/h detected" }

  // === FINANCIAL ===
  purchaseCost: 350000,          // Rp — device hardware cost
  installCost: 75000,            // Rp — installation labor
  monthlyCost: 15000,            // Rp — ongoing SIM + platform
  purchaseDate: "2025-02-20",    // When device was bought
  vendor: "PT Weloop Indonesia", // Purchased from
  warrantyExpiry: "2026-02-20",  // Hardware warranty end

  // === UPTIME & PERFORMANCE ===
  uptime30d: 98.5,               // % time device was online in last 30 days
  offlineEvents30d: 2,           // Number of offline events in last 30 days
  avgPingDelay: 1.2,             // Average seconds between expected and actual ping
  totalDistanceKm: 3456,         // Total km tracked by this device (lifetime)
  dailyAvgKm: 115.2,            // Average daily distance (last 30 days)
}
```

### DEVICE STATUS DEFINITIONS

There are **7 possible statuses** for a GPS device. Each has a color, icon, and specific behavior:

```javascript
const GPS_STATUS = {
  online: {
    label: "Online",
    color: "#34D399",          // Green
    bg: "rgba(52,211,153,.07)",
    icon: "●",                 // Filled circle
    glow: "0 0 4px rgba(52,211,153,.4)",
    description: "Device communicating normally, pinged within last 60 minutes"
  },
  offline: {
    label: "Offline",
    color: "#F87171",          // Red
    bg: "rgba(248,113,113,.07)",
    icon: "○",                 // Empty circle
    glow: "0 0 4px rgba(248,113,113,.3)",
    description: "Device has NOT pinged in >60 minutes. Could be: no signal area, SIM issue, power disconnected, or device failure"
  },
  low_signal: {
    label: "Low Signal",
    color: "#FBBF24",          // Amber
    bg: "rgba(251,191,36,.07)",
    icon: "◐",                 // Half circle
    glow: "0 0 4px rgba(251,191,36,.3)",
    description: "Device is online but signal strength is 'poor' — intermittent connectivity expected"
  },
  tampered: {
    label: "Tampered",
    color: "#F87171",          // Red — critical
    bg: "rgba(248,113,113,.12)",
    icon: "⚠",
    glow: "0 0 6px rgba(248,113,113,.5)",
    animation: "pulse 1.5s ease-in-out infinite",  // Blinking
    description: "Tamper alert triggered — device may have been physically removed or wiring cut"
  },
  unassigned: {
    label: "Unassigned",
    color: "#64748B",          // Gray
    bg: "rgba(100,116,139,.06)",
    icon: "□",                 // Empty square
    glow: "none",
    description: "Device is in stock, not installed on any vehicle. May be at warehouse or dealer location."
  },
  rma: {
    label: "RMA",
    color: "#FB923C",          // Orange
    bg: "rgba(251,146,60,.07)",
    icon: "↩",
    glow: "none",
    description: "Device has been returned to vendor for repair/replacement. Not operational."
  },
  decommissioned: {
    label: "Decommissioned",
    color: "#475569",          // Dark gray
    bg: "rgba(71,85,105,.06)",
    icon: "✕",
    glow: "none",
    description: "Device permanently retired. End of life, damaged beyond repair, or replaced."
  }
};
```

### DATA DISTRIBUTION — Generate 150 devices with this realistic spread:

| Status | Count | % | Notes |
|--------|-------|---|-------|
| online | 88 | 59% | Healthy, assigned, communicating. Various signal strengths. |
| offline | 23 | 15% | Assigned but not communicating. Mix of reasons: SIM expired (5), power cut (8), no signal area (6), unknown (4). |
| low_signal | 8 | 5% | Online but poor signal. Located in basement parking, tunnel areas, or edge-of-coverage zones. |
| tampered | 3 | 2% | Critical alert — device removal detected. These should have alert entries. |
| unassigned | 18 | 12% | In stock at various dealer locations or CASAN warehouse. No lat/lng (or use dealer/warehouse coordinates). |
| rma | 7 | 5% | Sent back to vendor. Various reasons: hardware failure, SIM slot broken, GPS antenna issue. |
| decommissioned | 3 | 2% | Old devices, permanently retired. |

### GPS VENDOR DATA — Use these 4 vendors realistically:

```javascript
const GPS_VENDORS = [
  {
    id: "weloop",
    name: "Weloop",
    models: [
      { model: "WL-210 Pro", canImmobilize: true, canSpeedLimit: true, hasAccelerometer: true, hasTamperAlert: true, hasInternalBattery: true, internalBatteryHours: 6, cost: 350000 },
      { model: "WL-200 Basic", canImmobilize: true, canSpeedLimit: false, hasAccelerometer: false, hasTamperAlert: true, hasInternalBattery: false, internalBatteryHours: 0, cost: 220000 }
    ],
    color: "#00E5C3"
  },
  {
    id: "sinotrack",
    name: "Sinotrack",
    models: [
      { model: "ST-906", canImmobilize: true, canSpeedLimit: false, hasAccelerometer: true, hasTamperAlert: true, hasInternalBattery: true, internalBatteryHours: 4, cost: 180000 },
      { model: "ST-901", canImmobilize: true, canSpeedLimit: false, hasAccelerometer: false, hasTamperAlert: false, hasInternalBattery: false, internalBatteryHours: 0, cost: 120000 }
    ],
    color: "#60A5FA"
  },
  {
    id: "concox",
    name: "Concox",
    models: [
      { model: "WeTrack2", canImmobilize: true, canSpeedLimit: true, hasAccelerometer: true, hasTamperAlert: true, hasInternalBattery: true, internalBatteryHours: 8, cost: 420000 },
    ],
    color: "#A78BFA"
  },
  {
    id: "teltonika",
    name: "Teltonika",
    models: [
      { model: "FMB920", canImmobilize: true, canSpeedLimit: true, hasAccelerometer: true, hasTamperAlert: true, hasInternalBattery: true, internalBatteryHours: 5, cost: 580000 },
    ],
    color: "#FB923C"
  }
];
```

Distribute vendors: Weloop 60%, Sinotrack 25%, Concox 10%, Teltonika 5%.

### SIM CARRIERS — Distribute realistically:
- Telkomsel: 45% (best coverage across Jabodetabek)
- XL Axiata: 25%
- Indosat: 15%
- Tri: 10%
- Smartfren: 5%

### LOCATION DATA for unassigned devices:
Unassigned devices should use these stock locations (warehouse or dealer):
```javascript
const STOCK_LOCATIONS = [
  { name: "CASAN Warehouse Cakung", lat: -6.1865, lng: 106.9305 },
  { name: "Tangkas Motors Cawang", lat: -6.2654, lng: 106.8721 },
  { name: "Tangkas Motors Fatmawati", lat: -6.2923, lng: 106.7936 },
  { name: "Maka Motors Kelapa Gading", lat: -6.1527, lng: 106.9084 },
  { name: "United Motors Bekasi", lat: -6.2383, lng: 106.9756 },
];
```

For assigned devices that are online, scatter across Jabodetabek using the same AREAS array from the existing fleet tab.

---

## MAP — GPS DEVICE MAP

### Map Markers
Each GPS device that has a location (assigned + some unassigned at stock locations) gets a marker:

- **Online**: Green dot (10px), soft green glow
- **Offline**: Red dot (10px), red glow, slightly transparent (0.7 opacity)
- **Low Signal**: Amber dot (10px), amber glow, pulsing animation (slow pulse every 3s)
- **Tampered**: Red dot (12px — slightly bigger), intense red glow, fast pulse animation (1.5s)
- **Unassigned (at stock location)**: Gray square marker (not circle), no glow
- **RMA / Decommissioned**: Not shown on map

### Map Popup (on marker click)
```
┌──────────────────────────────┐
│ GPS-001234 — WL-210 Pro      │  (colored by status)
│ IMEI: 860123456789012        │  (monospace, muted)
│ ──────────────────────────── │
│ Vehicle: CSN-045              │  (or "Unassigned" in gray)
│ Rider: Ahmad Rizki            │  (or "—")
│ Dealer: Tangkas Motors        │  (colored by dealer)
│ ──────────────────────────── │
│ 🟢 Online — 2m ago           │  (status with last ping)
│ Signal: ████░ Good (8 sat)    │  (signal bar visual)
│ Speed: 35 km/h → 180° S      │  (speed + heading)
│ V.Battery: 72.4V             │  (vehicle battery voltage)
│ Int.Battery: 95%             │  (backup battery)
│ SIM: Telkomsel (312/500 MB)  │  (carrier + data usage)
│ ──────────────────────────── │
│ [🔒 Immobilize] [📍 Track]   │  (action buttons in popup)
└──────────────────────────────┘
```

### Map Filter Buttons (top-right overlay)
Same pattern as existing fleet map filters. Toggleable pills:
```
[● Online 88] [○ Offline 23] [◐ Low Signal 8] [⚠ Tampered 3] [□ Unassigned 18] [📡 All Assigned] [🔴 SIM Alert]
```

Each filter can be toggled on/off. Active filter has colored border matching status color.

### Map Legend (bottom-left)
```
🟢 88 Online   🔴 23 Offline   🟡 8 Low Signal   ⚠ 3 Tampered   ⬜ 18 Stock
```

### Map Overlay — Signal Strength Heatmap Toggle
Add a toggle button "📶 Signal Map" that overlays a basic heatmap showing signal strength across the map. Use green (excellent) → yellow (fair) → red (poor) gradient. This helps identify dead zones where devices frequently lose signal.

---

## DEVICE LIST PANEL (Right Side)

### Search Bar
```
🔍 Search IMEI, serial, device ID, vehicle, dealer...
```
Searches across: device ID, IMEI, serial number, assigned vehicle ID, vehicle plate, dealer name, rider name.

### Filter Bar (Desktop — horizontal pills)
```
[All 150] [Online 88] [Offline 23] [Low Signal 8] [Tampered 3] [Unassigned 18] [SIM Alert 5] [RMA 7]
```
Active filter gets colored background + border matching the status.

### Filter Dropdown (Mobile — replaces filter bar)
Same options as above but in a `<select>` dropdown, hidden on desktop, visible on mobile.

### Vendor Filter
A second row or dropdown to filter by GPS vendor:
```
[All Vendors] [Weloop 90] [Sinotrack 38] [Concox 15] [Teltonika 7]
```

### Device Card — Compact View (One per device in the scrollable list)

```
┌─────────────────────────────────────────────────┐
│ ▎ GPS-001234          [WL-210 Pro] [ONLINE]  ▼  │
│ ▎ IMEI 860123456789012                          │
│ ▎ CSN-045 • Zeeho Aegis • B 3456 EVA           │
│ ▎ Tangkas Motors                                │
│ ▎                                               │
│ ▎ 📶 Good (8 sat)    🔋 72.4V    📡 2m ago     │
│ ▎ SIM: Telkomsel     💾 312/500MB  ✅ Active    │
└─────────────────────────────────────────────────┘
```

**Card structure (compact, single line per section):**

Row 1: Device ID (mono, bold) + Model badge (small, muted) + Status badge (colored) + Expand button (▼/▲)
Row 2: IMEI in monospace, small, muted text
Row 3: Assigned vehicle ID + model + plate (or "Unassigned" badge if no vehicle)
Row 4: Dealer name colored by dealer color (or stock location name if unassigned)
Row 5: Signal strength + vehicle battery voltage + last ping time ago
Row 6: SIM carrier + data usage bar + SIM status

**Left accent bar**: 3px vertical strip, colored by status (green/red/amber/gray)

**Status badge colors:**
- ONLINE → green background rgba, green text
- OFFLINE → red background rgba, red text
- LOW SIGNAL → amber background rgba, amber text
- TAMPERED → red background, pulsing animation
- UNASSIGNED → gray background, gray text
- RMA → orange background
- DECOMMISSIONED → dark gray, strikethrough on device ID

**Sorting**: Default sort by priority:
1. Tampered (top — critical)
2. Offline (needs attention)
3. Low Signal (degraded)
4. SIM Alert (expiring/low data)
5. Online (healthy)
6. Unassigned (stock)
7. RMA
8. Decommissioned

### Device Card — Expanded View (on click/expand)

When user clicks a device card or the expand button, show additional detail rows:

**Section: Device Details**
```
Model       WL-210 Pro          Firmware    FW-3.4.2
Hardware    v2.1                Serial      WL-2024-A00456
Vendor      PT Weloop Indonesia
```

**Section: Capabilities**
```
[✅ Immobilize] [✅ Speed Limit] [✅ Geofence] [✅ Tamper] [✅ Accelerometer] [✅ Int. Battery 6h]
```
Show as green checkmark badges for available features, gray X for unavailable.

**Section: SIM Details**
```
Number      089912345678        ICCID       89620123456789...
Carrier     Telkomsel           Plan        M2M Pool
Data        ████████░░ 312/500 MB (62%)
Expiry      31 Dec 2025 (194 days)
Monthly     Rp 15,000           Auto Top-Up ✅ Enabled
Last Top-Up 15 Jun 2025
```
Data usage bar: green if <70%, amber if 70-90%, red if >90%.
SIM Expiry: green if >30 days, amber if 7-30 days, red if <7 days or expired.

**Section: Installation**
```
Vehicle     CSN-045 — Zeeho Aegis — B 3456 EVA
Installed   10 Mar 2025 (102 days ago)
By          Pak Rudi — GPS Team Jakarta Timur
Location    Tangkas Motors Cawang
Mount       Under Seat
Relay       ✅ Connected (CDI cut)
```
If unassigned: Show "Not installed — in stock at [location]" with an "Assign" button.

**Section: Immobilization State**
```
State       🟢 Normal (Motor active)
Last Cmd    REACTIVATE — 15 Jun 2025 14:30
Ack         ✅ Confirmed in 2.3s
Lifetime    3 immobilizations
```
If currently immobilized: show red indicator with "🔒 IMMOBILIZED" and a "Reactivate" button.

**Section: Performance (30 days)**
```
Uptime      ██████████ 98.5%
Offline Events  2
Avg Ping Delay  1.2s
Total Distance  3,456 km
Daily Avg       115.2 km/day
```

**Section: Active Alerts**
If device has any active alerts, show them as colored alert rows:
```
⚠ TAMPER — Device removal detected — 20 Jun 2025 09:15 — [Dismiss] [Investigate]
📡 SIM — Data usage at 92% — 19 Jun 2025 — [Top Up] [Dismiss]
🔋 LOW BATTERY — Internal battery at 15% — 20 Jun 2025 08:00 — [Dismiss]
```

**Section: Financial**
```
Purchase    Rp 350,000          Install     Rp 75,000
Monthly     Rp 15,000/mo        Warranty    Until 20 Feb 2026 (245 days)
Total Cost  Rp 605,000 (to date)
Vendor      PT Weloop Indonesia
```

**Section: Action Buttons (bottom of expanded card)**
```
[🔒 Immobilize] [🔓 Reactivate] [📍 Track on Map] [📱 Ping Device] [⚙️ Configure] [🔄 Assign/Unassign] [↩ RMA] [📋 History]
```
- **Immobilize / Reactivate**: Toggle motor lock. Opens confirmation modal.
- **Track on Map**: Fly to this device's location on the map, zoom in.
- **Ping Device**: Force an immediate location update. Show toast "Pinging GPS-001234..." then update.
- **Configure**: Open modal to change ping interval, geofence, speed alert threshold.
- **Assign/Unassign**: Open modal to link/unlink device from a vehicle.
- **RMA**: Mark device for return to vendor. Opens modal for reason.
- **History**: Show command history log in a modal.

---

## MODALS

### Modal: Assign Device to Vehicle
```
┌──────────────────────────────────────────┐
│ 🔗 Assign GPS Device                     │
│ GPS-001234 — Weloop WL-210 Pro           │
│ ──────────────────────────────────────── │
│ IMEI: 860123456789012                    │
│ Current: Unassigned                       │
│ ──────────────────────────────────────── │
│ Vehicle*                                  │
│ [Search vehicle ID or plate...        ▼] │
│                                          │
│ Installer Name*                          │
│ [Pak Rudi                             ]  │
│                                          │
│ Mount Position*                          │
│ [Under Seat                           ▼] │
│                                          │
│ Relay Connected*                         │
│ [Yes — CDI Cut                        ▼] │
│                                          │
│ Notes                                    │
│ [Optional installation notes...       ]  │
│                                          │
│ [Cancel]                    [✅ Assign]   │
└──────────────────────────────────────────┘
```

Vehicle dropdown should show only vehicles that don't already have a GPS device assigned. Show: Vehicle ID + Model + Plate + Dealer.

### Modal: Unassign Device from Vehicle
```
┌──────────────────────────────────────────┐
│ ⚠️ Unassign GPS Device                   │
│ GPS-001234 → CSN-045 (Zeeho Aegis)      │
│ ──────────────────────────────────────── │
│ ⚠ WARNING: Vehicle will lose tracking    │
│ and immobilization capability.           │
│                                          │
│ Reason*                                  │
│ [Device faulty                        ▼] │
│ Options: Device faulty, Vehicle returned,│
│ Replacing with new device, Device swap,  │
│ Other                                    │
│                                          │
│ Return to*                               │
│ [CASAN Warehouse Cakung              ▼]  │
│                                          │
│ Notes                                    │
│ [Optional...                          ]  │
│                                          │
│ [Cancel]                  [⚠ Unassign]   │
└──────────────────────────────────────────┘
```

### Modal: Immobilize / Reactivate
```
┌──────────────────────────────────────────┐
│ 🔒 Immobilize Vehicle                    │
│ GPS-001234 → CSN-045                     │
│ ──────────────────────────────────────── │
│ Rider: Ahmad Rizki                       │
│ Status: Active — 12 credits remaining    │
│ ──────────────────────────────────────── │
│ ⚠ This will CUT THE MOTOR remotely.     │
│ The rider will not be able to drive.     │
│                                          │
│ Reason*                                  │
│ [Grace period expired                 ▼] │
│ Options: Grace expired, Non-payment,     │
│ Suspected theft, Tamper detected,        │
│ Contract violation, Manual override      │
│                                          │
│ Notes                                    │
│ [Optional...                          ]  │
│                                          │
│ ⚠ Safety Check:                         │
│ Current speed: 35 km/h                   │
│ [⚠ Vehicle is MOVING — immobilization   │
│  will be DELAYED until vehicle stops]    │
│                                          │
│ [Cancel]               [🔒 Confirm Lock] │
└──────────────────────────────────────────┘
```

**CRITICAL SAFETY**: If vehicle speed > 0, show a red warning that immobilization will be delayed until the vehicle comes to a stop. Never allow instant immobilization of a moving vehicle.

### Modal: Configure Device
```
┌──────────────────────────────────────────┐
│ ⚙️ Configure GPS Device                  │
│ GPS-001234 — WL-210 Pro                  │
│ ──────────────────────────────────────── │
│ Ping Interval*                           │
│ [30 seconds                           ▼] │
│ Options: 10s, 30s, 1min, 5min, 10min    │
│                                          │
│ Speed Alert Threshold                    │
│ [80] km/h                                │
│                                          │
│ Geofence                                 │
│ [Jabodetabek (default)                ▼] │
│ Options: Jabodetabek, Jakarta Only,      │
│ Custom, Disabled                         │
│                                          │
│ Power Save Mode                          │
│ [○ Disabled  ● When parked >30min]       │
│                                          │
│ [Cancel]                    [✅ Apply]    │
└──────────────────────────────────────────┘
```

### Modal: RMA (Return to Vendor)
```
┌──────────────────────────────────────────┐
│ ↩ Return Device to Vendor (RMA)          │
│ GPS-001234 — WL-210 Pro                  │
│ ──────────────────────────────────────── │
│ Vendor: PT Weloop Indonesia              │
│ Warranty: ✅ Under warranty (245 days)   │
│ ──────────────────────────────────────── │
│ Reason*                                  │
│ [GPS module failure                   ▼] │
│ Options: GPS module failure, SIM slot    │
│ broken, No power, Relay failure,         │
│ Antenna issue, Water damage, Other       │
│                                          │
│ Replacement Needed?*                     │
│ [● Yes, send replacement  ○ Repair only] │
│                                          │
│ Notes                                    │
│ [Device stopped reporting after rain...] │
│                                          │
│ [Cancel]                 [↩ Submit RMA]  │
└──────────────────────────────────────────┘
```

### Modal: Command History
```
┌──────────────────────────────────────────┐
│ 📋 Command History — GPS-001234          │
│ ──────────────────────────────────────── │
│ 20 Jun 2025 09:15  REACTIVATE           │
│   By: System — Payment received           │
│   Ack: ✅ 2.3s                            │
│                                          │
│ 13 Jun 2025 00:00  IMMOBILIZE            │
│   By: System — Grace expired              │
│   Ack: ✅ 1.8s                            │
│                                          │
│ 10 Jun 2025 14:30  SPEED_LIMIT_30       │
│   By: Pak Sari — Suspected misuse         │
│   Ack: ✅ 3.1s                            │
│                                          │
│ 01 Mar 2025 10:00  INSTALLED             │
│   By: Pak Rudi — GPS Team                 │
│   Vehicle: CSN-045                        │
│                                          │
│                              [Close]      │
└──────────────────────────────────────────┘
```

---

## PAGINATION
Same pagination pattern as existing fleet tab. 20 devices per page. Page buttons at bottom of device list.

---

## MOBILE RESPONSIVENESS

At `<768px`:
- Stats bar: 4 columns (2 rows), same as existing
- Map: on top, min-height 240px, max-height 300px
- Map filter buttons: move to bottom strip above map legend, horizontally scrollable
- Device list: below map, full width
- Device cards: Stack layout (same mobile card pattern as existing fleet cards)
  - Row 1: Device ID + Status badge + Expand button
  - Row 2: IMEI
  - Row 3: Vehicle + model + plate (or "Unassigned")
  - Row 4: Signal + Battery voltage + Last ping
  - Row 5: SIM carrier + data usage
- Filter: Hide desktop pills, show `<select>` dropdown instead
- Modals: Bottom sheet style (slides up from bottom, full width, rounded top corners)
- Touch targets: minimum 36px height for all interactive elements

At `<400px`:
- Stats bar: 2 columns
- Device ID font slightly smaller
- Card padding tighter

---

## INTERACTIONS & REAL-TIME BEHAVIOR

1. **Live ping updates**: Every 5 seconds, simulate updating last ping timestamps for online devices. Update the "Xm ago" display.

2. **Click device card → fly to map**: When user clicks a device card, the map smoothly flies to that device's location and zooms to level 15. The marker pulses briefly to draw attention.

3. **Click map marker → highlight card**: When user clicks a map marker, the corresponding device card in the list scrolls into view and gets a highlighted border.

4. **Status transitions**: When a device's simulated status changes (e.g., goes offline), animate the card with a brief flash of the new status color.

5. **Alert badge on stats**: If there are tampered or SIM alert devices, show a small red dot notification badge on the "📡 GPS Devices" tab button.

6. **Toast notifications**: After any action (assign, immobilize, configure, RMA), show a toast notification at bottom-right:
   - Success: green toast, e.g., "✅ GPS-001234 assigned to CSN-045"
   - Error: red toast, e.g., "❌ Command failed — device offline"

---

## BONUS FEATURES (If time allows)

1. **Bulk SIM Top-Up**: Select multiple devices → "Top Up All" button → modal showing total cost and SIM count
2. **Firmware Update Queue**: Show devices with outdated firmware, "Update All" button
3. **CSV Export**: Export full device list with all fields to CSV
4. **Signal Heatmap Toggle**: Toggle an overlay on the map showing signal strength zones based on device data
5. **Daily Distance Chart**: Small sparkline chart in expanded card showing daily km over last 14 days
6. **Offline Duration Timer**: For offline devices, show a live counting timer "Offline for 2h 34m 12s"

---

## SINGLE HTML FILE

Build everything as a **single self-contained HTML file** with all CSS inline in `<style>` tags and all JavaScript inline in `<script>` tags. Use Leaflet.js and MarkerCluster from CDN (same CDN links as the existing fleet dashboard). All data should be generated client-side using the data model above — no backend needed.

The file should be fully functional as a standalone demo that can be opened directly in a browser.

---

## END OF PROMPT

---
