# CASAN RTO Platform — Core Data Lists & Feature Specification

## Complete Architecture for OEM, Dealer, GPS Partner & Fleet Operations

---

# 📋 LIST 1: PROGRAM LIST (RTO & Rental Programs)

The Program List is the **master registry** of every RTO and Rental program available on the CASAN platform. Each program is created by/for an OEM and assigned to specific dealers.

---

## Program Master Record — Every Field Needed

### Program Identity
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Program ID | Auto-gen | `PRG-ZH-RTO-001` | Unique system identifier |
| Program Name | Text | "Zeeho Aegis RTO 18-Month" | Display name |
| Short Name | Text | "Aegis RTO-18" | For badges/cards in UI |
| Program Type | Enum | `RTO` / `Rental` / `Lease` | Determines ownership transfer rules |
| Status | Enum | `Active` / `Paused` / `Closed` / `Draft` | Whether new riders can enroll |
| Created Date | Date | 2025-01-15 | When program was created |
| Effective Date | Date | 2025-02-01 | When program starts accepting riders |
| End Date | Date (nullable) | 2026-12-31 or null | If program has fixed end, null = ongoing |
| Version | Int | 3 | Track changes to program terms |

### OEM & Dealer Assignment
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| OEM Brand | FK → OEM | Zeeho | Which OEM's bikes |
| Eligible Models | FK[] → Bike Models | [Aegis, AE8] | Which models can be enrolled |
| Eligible Dealers | FK[] → Dealers | [Tangkas Cawang, Tangkas Fatmawati] | Which dealers can offer this program |
| Exclusive | Boolean | `false` | If true, only these dealers can sell these models |
| OEM Contact | Text | "Pak Budi — budi@zeeho.co.id" | OEM program manager |

### Financial Terms — Daily Rate Structure
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Base Daily Rate | Currency | Rp 50,000 | Standard daily payment |
| Rate Type | Enum | `Fixed` / `Graduated` / `Seasonal` | How rate changes over time |
| Graduated Schedule | JSON | See below | If graduated, rate tiers |
| Weekend Rate | Currency (nullable) | Rp 45,000 or null | Different weekend rate (null = same) |
| Minimum Daily Rate | Currency | Rp 35,000 | Floor rate (for promotions) |

**Graduated Rate Example:**
```json
{
  "tiers": [
    { "month_start": 1, "month_end": 6, "daily_rate": 55000 },
    { "month_start": 7, "month_end": 12, "daily_rate": 50000 },
    { "month_start": 13, "month_end": 18, "daily_rate": 45000 }
  ]
}
```

### Contract Terms
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Term Length (months) | Int | 18 | Full RTO contract duration |
| Total Contract Value | Currency | Rp 27,000,000 | = daily rate × days in term (for display) |
| Down Payment Required | Boolean | `true` | Whether DP is mandatory |
| Down Payment Amount | Currency | Rp 1,500,000 | Upfront payment |
| Down Payment Options | JSON | `[500000, 1000000, 1500000]` | Allowed DP tiers |
| Minimum Prepay Days | Int | 7 | Minimum days per payment cycle |
| Maximum Prepay Days | Int | 30 | Maximum days per payment cycle |
| Suggested Prepay Days | Int | 7 | Default in payment modal |

### Grace & Penalty Rules
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Grace Period (days) | Int | 7 | Days after credits expire before immobilization |
| Grace Warning Day | Int | 3 | Send warning SMS at this many days into grace |
| Late Fee Type | Enum | `None` / `Fixed` / `Percent` / `Compound` | How late fees work |
| Late Fee Amount | Currency/% | Rp 5,000/day or 2% | Late fee value |
| Late Fee Cap | Currency | Rp 150,000 | Maximum total late fee per cycle |
| Max Overdue Days | Int | 30 | Days past grace before repossession |
| Immobilization Type | Enum | `Full` / `Speed-Limited` / `Scheduled` | What happens at grace expiry |
| Speed Limit (if limited) | Int | 15 | km/h limit if speed-limited immobilization |
| Reactivation Fee | Currency | Rp 50,000 | Fee to reactivate after immobilization |
| Reactivation Requires | Enum | `Payment Only` / `Payment + Fee` / `Visit Dealer` | What rider must do |

### Holiday / Pause Rules
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Holiday Allowed | Boolean | `true` | Can riders pause? |
| Max Holiday Days / Year | Int | 30 | Annual limit |
| Max Consecutive Holiday | Int | 14 | Single pause limit |
| Min Days Between Holidays | Int | 30 | Prevent abuse |
| Holiday Advance Notice | Int | 2 | Days notice required |
| Holiday Auto-Extend Term | Boolean | `true` | Does holiday extend total contract? |
| Holiday Reasons Allowed | Enum[] | `[mudik, medical, vacation, other]` | Valid reasons |
| Holiday Requires Approval | Boolean | `true` | Dealer must approve? |
| Credits Freeze on Holiday | Boolean | `true` | Do existing credits pause? |

### Ownership & Buyout (RTO Only)
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Ownership Transfer | Boolean | `true` | Bike transfers to rider at end |
| Transfer Condition | Text | "All payments complete + final inspection" | What triggers transfer |
| Early Buyout Allowed | Boolean | `true` | Can rider pay off early? |
| Early Buyout Discount | Percent | 5% | Discount on remaining balance |
| Early Buyout Min Month | Int | 6 | Earliest month for buyout |
| Buyout Formula | Enum | `Remaining Balance` / `Fixed Schedule` | How buyout is calculated |
| BPKB Release Condition | Text | "After full payment + 30 day clearance" | When ownership docs released |

### Transfer & Swap Rules
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Contract Transfer Allowed | Boolean | `true` | Can rider transfer to another person? |
| Transfer Fee | Currency | Rp 200,000 | Fee for contract transfer |
| Transfer Requires | Text | "New KTP, SIM, credit check" | Conditions |
| Vehicle Swap Allowed | Boolean | `false` | Can rider swap to different bike? |
| Model Upgrade Allowed | Boolean | `true` | Can rider upgrade mid-contract? |
| Upgrade Fee Formula | Text | "Difference in DP + Rp 100K admin" | How upgrade pricing works |

### Insurance & Protection
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Insurance Required | Boolean | `true` | Mandatory insurance? |
| Insurance Type | Enum | `OEM Included` / `Dealer Provided` / `Rider Purchases` | Who provides |
| Insurance Coverage | Text[] | `["theft", "total_loss", "third_party"]` | What's covered |
| Insurance Cost/Month | Currency | Rp 50,000 | Monthly premium |
| Insurance Included in Rate | Boolean | `true` | Built into daily rate? |
| Damage Liability | Text | "Rider pays first Rp 500K, dealer covers rest" | Damage cost split |
| Theft Liability | Text | "Rider pays 30% of vehicle value" | Theft responsibility |

### Maintenance Responsibility
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Scheduled Service | Enum | `Dealer Covers` / `Rider Pays` / `Shared` | Who pays for routine service |
| Service Interval | Text | "Every 3,000 km or 3 months" | When service is due |
| Tire Replacement | Enum | `Dealer` / `Rider` / `Shared` | Who pays for tires |
| Battery Replacement | Enum | `OEM Warranty` / `Dealer` / `Rider after 12mo` | Battery cost responsibility |
| Breakdown Assistance | Boolean | `true` | Roadside help included? |

### CASAN Fee Structure
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| CASAN Fee Type | Enum | `Fixed/Day` / `Percent` / `Tiered` | How CASAN charges |
| CASAN Fee Amount | Currency/% | Rp 3,500/day or 7% | Fee value |
| CASAN Fee Includes GPS | Boolean | `true` | GPS cost bundled in fee? |
| GPS Fee Separate | Currency | Rp 1,500/day | If GPS not included, separate cost |
| Minimum Monthly CASAN Fee | Currency | Rp 100,000 | Floor fee per vehicle |
| Fee Billing Cycle | Enum | `Per-Transaction` / `Weekly` / `Monthly` | When CASAN collects |

### Communication & Notification Rules
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Payment Reminder Days | Int[] | `[-3, -1, 0]` | Days before expiry to send reminder |
| Grace Reminder Days | Int[] | `[1, 3, 5, 7]` | Days into grace to send warning |
| Reminder Channel | Enum[] | `["whatsapp", "sms"]` | How to send reminders |
| Auto-Immobilize | Boolean | `true` | Auto-lock at grace expiry? |
| Manual Override Required | Boolean | `false` | Does staff need to confirm lock? |

### Program Limits & Capacity
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Max Vehicles in Program | Int | 500 | Total capacity |
| Max Per Dealer | Int | 50 | Per-dealer limit |
| Waitlist Enabled | Boolean | `true` | Accept waitlist when full? |
| Min Rider Score | Int | 0 | Minimum credit score to enroll (0 = no minimum) |
| Rider Requirements | Text[] | `["KTP", "SIM C", "OJOL active account", "domicile Jabodetabek"]` | Enrollment criteria |

### Program Metrics (Calculated / Read-Only)
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Total Enrolled | Int | 187 | Current active riders |
| Completion Rate | Percent | 72% | % riders who finish full term |
| Default Rate | Percent | 8.5% | % riders currently immobilized |
| Avg Days to Default | Float | 45.3 | Average days before first immobilization |
| Revenue This Month | Currency | Rp 285,000,000 | Current month revenue |
| Collection Rate | Percent | 94% | % of expected revenue actually collected |
| Avg Rider Score | Float | 78.5 | Average rider reliability score |

---

# 🏢 LIST 2: PARTNER / DEALER LIST (OEM + Dealer + Pickup Locations)

The Partner List covers **every business entity** in the CASAN ecosystem — OEMs, dealers, service centers, and their physical locations.

---

## OEM (Brand) Record

### OEM Identity
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| OEM ID | Auto-gen | `OEM-ZEEHO` | System identifier |
| Brand Name | Text | "Zeeho" | Display name |
| Parent Company | Text | "CFMOTO / Geely Group" | Corporate parent |
| Country of Origin | Text | "China" | Manufacturing origin |
| Indonesia Entity | Text | "PT Zeeho Motor Indonesia" | Local legal entity |
| NPWP | Text | "01.234.567.8-012.000" | Tax ID |
| Office Address | Text | "Jl. Gatot Subroto Kav. 23, Jakarta Selatan" | HQ address |
| Office GPS | Lat/Lng | -6.2350, 106.8230 | HQ coordinates |

### OEM Contacts
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Primary Contact Name | Text | "Pak Budi Setiawan" | Main point of contact |
| Primary Contact Title | Text | "Head of B2B Sales" | Role |
| Primary Contact Phone | Text | "+62 812-3456-7890" | Phone |
| Primary Contact Email | Text | "budi@zeeho.co.id" | Email |
| Secondary Contact | Text | "Ibu Rina — After-Sales Manager" | Backup contact |
| Technical Contact | Text | "Pak Hendra — Battery Engineering" | For technical issues |

### OEM Commercial Terms
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Dealer Purchase Price Range | Currency Range | Rp 18M — 28M | Wholesale price range by model |
| Payment Terms to Dealer | Text | "Net 30 / COD / Leasing partner" | How dealers pay OEM |
| Volume Discount Tiers | JSON | See below | Bulk pricing |
| Warranty Standard | Text | "3 years / 30,000 km motor+controller" | Base warranty |
| Battery Warranty | Text | "5 years / 50,000 km / >70% capacity" | Battery specific warranty |
| Recall Policy | Text | "Full replacement at OEM cost" | How recalls handled |
| Marketing Support | Text | "Co-op 50/50 up to Rp 10M/quarter" | OEM marketing budget |

**Volume Discount Example:**
```json
{
  "tiers": [
    { "min_units": 1, "max_units": 10, "discount_percent": 0 },
    { "min_units": 11, "max_units": 50, "discount_percent": 3 },
    { "min_units": 51, "max_units": 100, "discount_percent": 5 },
    { "min_units": 101, "max_units": null, "discount_percent": 8 }
  ]
}
```

### OEM Fleet Statistics (Calculated)
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Total Vehicles Deployed | Int | 340 | All bikes in CASAN system |
| Active in RTO | Int | 285 | Currently in RTO programs |
| Active in Rental | Int | 35 | Currently in rental programs |
| Available / Unassigned | Int | 20 | Ready for assignment |
| In Maintenance | Int | 12 | Currently being serviced |
| Warranty Claims Open | Int | 5 | Pending warranty issues |
| Avg Vehicle Utilization | Percent | 92% | % of fleet actively deployed |

---

## Dealer Record

### Dealer Identity
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Dealer ID | Auto-gen | `DLR-TGK-001` | System identifier |
| Dealer Name | Text | "Tangkas Motors" | Business name |
| Legal Entity | Text | "PT Tangkas Motor Elektrik" | Registered company name |
| NPWP | Text | "02.345.678.9-023.000" | Tax ID |
| NIB (Business License) | Text | "1234567890123" | OSS business number |
| SIUP Number | Text | "503/1234/SIUP/2024" | Trade license |
| Dealer Type | Enum | `Authorized` / `Sub-dealer` / `Independent` | Relationship level |
| Dealer Tier | Enum | `Platinum` / `Gold` / `Silver` / `Bronze` | Performance tier |
| Status | Enum | `Active` / `Suspended` / `Onboarding` / `Terminated` | Dealer status |
| Onboarding Date | Date | 2024-11-15 | When joined CASAN |

### Dealer Contacts
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Owner Name | Text | "Pak Agus Riyanto" | Dealer owner |
| Owner Phone | Text | "+62 811-2233-445" | Owner direct line |
| Owner Email | Text | "agus@tangkasmotors.com" | Owner email |
| Operations Manager | Text | "Ibu Sari — +62 812-9988-776" | Day-to-day ops contact |
| Finance / Billing Contact | Text | "Pak Dedi — finance@tangkasmotors.com" | For settlement & invoices |
| WhatsApp Business | Text | "+62 815-1234-5678" | Customer-facing WA number |

### Dealer Banking
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Bank Name | Text | "BCA" | Primary bank |
| Account Number | Text | "1234567890" | Account number |
| Account Name | Text | "PT Tangkas Motor Elektrik" | Name on account |
| Bank Branch | Text | "KCP Cawang" | Branch |
| Secondary Bank | Text | "Mandiri — 0987654321" | Backup account |
| Settlement Frequency | Enum | `Daily` / `Weekly` / `Bi-weekly` / `Monthly` | How often CASAN settles |
| Settlement Day | Text | "Every Monday" or "Daily by 5pm" | Specific timing |

### Dealer OEM Relationships
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| OEM Brands Carried | FK[] → OEM | [Zeeho, United] | Which brands dealer sells |
| Authorized Programs | FK[] → Programs | [PRG-ZH-RTO-001, PRG-UT-RTO-002] | Which programs dealer can offer |
| OEM Contract Status | JSON | See below | Per-OEM contract details |

**OEM Relationship Example:**
```json
[
  {
    "oem": "Zeeho",
    "status": "authorized",
    "since": "2024-06",
    "territory": "Jakarta Timur, Jakarta Selatan",
    "purchase_terms": "Net 14",
    "target_monthly_units": 20,
    "actual_ytd_monthly_avg": 15.5
  }
]
```

### Dealer CASAN Contract
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| CASAN Contract ID | Text | "CSN-DLR-2024-015" | Contract reference |
| Contract Start | Date | 2024-11-15 | Contract effective date |
| Contract End | Date | 2025-11-14 | Contract expiry |
| Auto-Renew | Boolean | `true` | Auto-renew? |
| Fee Structure | JSON | `{"type":"fixed","per_day":3500}` | CASAN fee terms |
| GPS Included | Boolean | `true` | GPS bundled in CASAN fee? |
| Minimum Fleet Size | Int | 10 | Minimum vehicles to maintain |
| Maximum Fleet Size | Int | 100 | Capacity cap |
| SLA Terms | Text | "99% platform uptime, <2hr support response" | Service level agreement |
| Penalty for Early Termination | Currency | Rp 5,000,000 | If dealer exits early |

### Dealer Performance Metrics (Calculated)
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Total Fleet Size | Int | 45 | All vehicles across locations |
| Active Riders | Int | 38 | Currently assigned |
| Utilization Rate | Percent | 84.4% | Active / Total |
| Collection Rate (30d) | Percent | 93.5% | Payment collection efficiency |
| Default Rate | Percent | 6.7% | % currently immobilized |
| Avg Rider Score | Float | 76.2 | Average reliability of their riders |
| Revenue This Month | Currency | Rp 57,000,000 | Current month total |
| CASAN Fees This Month | Currency | Rp 4,275,000 | Fees owed to CASAN |
| Outstanding Balance | Currency | Rp 3,200,000 | Unpaid rider amounts |
| Net Promoter Score | Float | 72 | Rider satisfaction |

---

## Dealer Location / Pickup Point Record

Each dealer can have **multiple physical locations** — main showroom, satellite outlets, pickup-only points, service centers.

### Location Identity
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Location ID | Auto-gen | `LOC-TGK-CWG-001` | System identifier |
| Location Name | Text | "Tangkas Motors — Cawang" | Display name |
| Dealer ID | FK → Dealer | `DLR-TGK-001` | Parent dealer |
| Location Type | Enum | `Showroom` / `Outlet` / `Pickup Point` / `Service Center` / `Warehouse` | Type of location |
| Status | Enum | `Open` / `Temporarily Closed` / `Permanently Closed` | Operating status |

### Address & GPS
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Full Address | Text | "Jl. Dewi Sartika No. 123, Cawang, Kramat Jati" | Complete street address |
| Kelurahan | Text | "Cawang" | Village/sub-district |
| Kecamatan | Text | "Kramat Jati" | District |
| Kota / Kabupaten | Text | "Jakarta Timur" | City/regency |
| Provinsi | Text | "DKI Jakarta" | Province |
| Kode Pos | Text | "13630" | Postal code |
| Latitude | Float | -6.2654 | GPS lat |
| Longitude | Float | 106.8721 | GPS lng |
| Google Maps Link | URL | "https://maps.google.com/..." | Direct link |
| Landmark / Directions | Text | "Di sebelah Alfamart, depan halte busway Cawang" | Wayfinding help |

### Location Facilities
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Has Showroom | Boolean | `true` | Can display bikes |
| Has Service Bay | Boolean | `true` | Can do maintenance |
| Number of Service Bays | Int | 2 | Service capacity |
| Has Charging Station | Boolean | `true` | On-site charging available |
| Charging Capacity | Int | 6 | Number of bikes that can charge simultaneously |
| Charger Types | Enum[] | `["standard_72V", "fast_charge"]` | What chargers available |
| Has Battery Swap | Boolean | `false` | Battery swap station on-site |
| Has Storage / Parking | Boolean | `true` | Secure bike storage |
| Storage Capacity | Int | 20 | How many bikes can be stored |
| Has Waiting Area | Boolean | `true` | Customer waiting room |
| Has Restroom | Boolean | `true` | Toilet available |
| WiFi Available | Boolean | `true` | WiFi for waiting customers |

### Operating Hours
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Monday - Friday | Text | "08:00 — 17:00" | Weekday hours |
| Saturday | Text | "08:00 — 15:00" | Saturday hours |
| Sunday | Text | "Closed" | Sunday hours |
| Holiday Schedule | Text | "Closed on national holidays" | Holiday policy |
| Pickup Hours | Text | "08:00 — 16:00 Mon-Sat" | Specific pickup/return window |
| Emergency Contact | Text | "+62 812-9988-776 (after hours)" | After-hours phone |

### Location Staff
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Location Manager | Text | "Pak Hendra" | In-charge |
| Manager Phone | Text | "+62 813-5566-7788" | Manager direct line |
| Total Staff | Int | 5 | Headcount |
| Mechanics | Int | 2 | Service staff |
| Admin / Sales | Int | 2 | Front office |
| Field Collectors | Int | 1 | Payment collection staff |

### Location Inventory (Calculated / Real-Time)
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Total Vehicles | Int | 22 | All bikes at this location |
| Active (Deployed) | Int | 18 | Currently with riders |
| Available | Int | 2 | Ready for new riders |
| In Service | Int | 1 | Being repaired |
| Returned (Pending Inspection) | Int | 1 | Just returned, needs check |
| Models Available | Text[] | `["Aegis ×2", "AE8 ×0"]` | Stock by model |

### Location Coverage Area
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Primary Service Area | Text[] | `["Kramat Jati", "Makasar", "Pasar Rebo"]` | Main kecamatan served |
| Secondary Service Area | Text[] | `["Jatinegara", "Duren Sawit"]` | Extended area |
| Max Delivery Radius | Int (km) | 15 | Will deliver bike within this range |
| Delivery Fee | Currency | Rp 50,000 | Fee for bike delivery |
| Pickup Required | Boolean | `false` | Must rider pick up at location? |

---

# 📡 LIST 3: GPS DEVICE & TRACKING HARDWARE LIST

The GPS List tracks **every physical tracking device** installed on CASAN vehicles — hardware, SIM cards, installation status, and connectivity.

---

## GPS Device Record

### Device Identity
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Device ID | Auto-gen | `GPS-001234` | CASAN internal ID |
| IMEI | Text | "860123456789012" | International Mobile Equipment Identity (15 digits) |
| Serial Number | Text | "WL-2024-A00456" | Manufacturer serial |
| Device Brand | Text | "Weloop" | GPS hardware brand |
| Device Model | Text | "WL-210 Pro" | Specific model |
| Hardware Version | Text | "v2.1" | PCB / hardware revision |
| Firmware Version | Text | "FW-3.4.2" | Current firmware |
| Latest Firmware Available | Text | "FW-3.5.0" | Newest available |
| Firmware Update Required | Boolean | `true` | Needs update? |

### Device Capabilities
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| GPS Tracking | Boolean | `true` | Basic location tracking |
| Remote Immobilize | Boolean | `true` | Can cut motor remotely |
| Speed Limiting | Boolean | `true` | Can limit top speed |
| Geofencing | Boolean | `true` | Zone alerts |
| Tow Alert | Boolean | `true` | Detects movement when engine off |
| Tamper Alert | Boolean | `true` | Detects device removal |
| OBD/CAN Integration | Boolean | `false` | Reads vehicle data bus |
| Battery Voltage Monitor | Boolean | `true` | Reads vehicle battery level |
| Accelerometer | Boolean | `true` | Crash / harsh braking detection |
| Speaker / Buzzer | Boolean | `false` | Can emit sound |
| Ignition Detection | Boolean | `true` | Knows if bike is on/off |
| Odometer Reading | Boolean | `false` | Reads distance traveled |
| Internal Battery | Boolean | `true` | Has backup battery |
| Internal Battery Life | Text | "~6 hours" | Backup battery duration |
| Operating Temp Range | Text | "-20°C to 60°C" | Temperature tolerance |
| IP Rating | Text | "IP67" | Water/dust resistance |

### SIM Card
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| SIM Card Number | Text | "089912345678" | Phone number |
| SIM ICCID | Text | "8962012345678901234" | SIM card unique ID |
| Carrier | Enum | `Telkomsel` / `XL` / `Indosat` / `Tri` / `Smartfren` | Mobile operator |
| Plan Type | Enum | `Prepaid` / `Postpaid` / `M2M Pool` | SIM plan |
| Data Allowance | Text | "500MB/month" | Monthly data cap |
| Data Used This Month | Text | "312MB" | Current usage |
| SIM Expiry Date | Date | 2025-12-31 | When SIM expires |
| Last Top-Up Date | Date | 2025-06-15 | Last prepaid top-up |
| Top-Up Amount | Currency | Rp 25,000 | Last top-up value |
| Monthly SIM Cost | Currency | Rp 15,000 | Ongoing cost |
| SIM Status | Enum | `Active` / `Low Balance` / `Expired` / `Blocked` | Current SIM state |
| Auto-Top-Up | Boolean | `true` | Auto-renew enabled? |

### Installation
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Vehicle ID | FK → Fleet | `CSN-045` | Which vehicle it's installed on |
| Installation Date | Date | 2025-03-10 | When installed |
| Installed By | Text | "Pak Rudi — GPS Team Jakarta Timur" | Installer name |
| Installation Location | FK → Dealer Location | `LOC-TGK-CWG-001` | Where installed |
| Mount Position | Enum | `Under Seat` / `Behind Panel` / `Frame` / `Battery Compartment` | Physical location on bike |
| Wiring Type | Enum | `Hardwired` / `OBD Plug` / `Battery Tap` | How connected |
| Relay Connected | Boolean | `true` | Immobilization relay installed? |
| Relay Type | Text | "Normally Closed — cuts CDI signal" | How immobilization works |
| Installation Photos | URL[] | ["photo1.jpg", "photo2.jpg"] | Documentation photos |
| Installation Notes | Text | "Routed under left panel, secured with zip ties" | Technician notes |
| Tamper Seal Number | Text | "SEAL-2025-0456" | Anti-tamper seal ID |

### Connectivity & Status
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Device Status | Enum | `Online` / `Offline` / `Low Signal` / `No SIM` / `Tampered` / `Decommissioned` | Current state |
| Last Ping | Timestamp | 2025-06-20 14:23:45 | Last communication |
| Last Known Location | Lat/Lng | -6.2654, 106.8721 | Last GPS position |
| Last Known Speed | Int | 0 | km/h at last ping |
| Signal Strength | Enum | `Excellent` / `Good` / `Fair` / `Poor` / `None` | GSM signal quality |
| GPS Satellites | Int | 8 | Number of satellites locked |
| Ping Interval | Enum | `30s` / `1min` / `5min` / `10min` / `Sleep` | Current reporting frequency |
| Sleep Mode | Boolean | `false` | Device in power-save mode? |
| Vehicle Battery Voltage | Float | 72.4 | Voltage reading from vehicle |
| Internal Battery Level | Percent | 95% | Backup battery charge |
| Uptime (30 days) | Percent | 98.5% | % time device was online |
| Offline Alerts Sent | Int | 2 | How many offline alerts in last 30 days |

### Immobilization Log
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Current Immobilization State | Enum | `Active` / `Immobilized` / `Speed-Limited` | Current relay state |
| Last Command Sent | Text | "IMMOBILIZE" | Last remote command |
| Last Command Time | Timestamp | 2025-06-19 09:15:00 | When command was sent |
| Command Acknowledged | Boolean | `true` | Device confirmed receipt |
| Acknowledgment Time | Timestamp | 2025-06-19 09:15:03 | When device confirmed |
| Command Initiated By | Text | "System — Grace Expired" | Who/what triggered |
| Total Immobilizations (Lifetime) | Int | 3 | How many times locked |

### GPS Device Financial
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Device Purchase Cost | Currency | Rp 350,000 | Cost of hardware |
| Device Purchased From | Text | "PT Weloop Indonesia" | Vendor |
| Purchase Date | Date | 2025-02-20 | When bought |
| Purchase PO Number | Text | "PO-GPS-2025-023" | Purchase order ref |
| Installation Cost | Currency | Rp 75,000 | Labor cost to install |
| Monthly Operating Cost | Currency | Rp 15,000 | SIM + platform fees |
| Warranty Expiry | Date | 2026-02-20 | Hardware warranty end |
| Warranty Provider | Text | "Weloop — 1 year standard" | Who warranties |
| Depreciation Method | Enum | `Straight-Line 3yr` | Accounting treatment |
| Current Book Value | Currency | Rp 280,000 | Depreciated value |
| Cost Allocated To | Enum | `Dealer` / `CASAN` / `Shared` | Who bears the cost |

### GPS Vendor / Partner Record
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| GPS Vendor ID | Auto-gen | `GPSV-WELOOP` | System ID |
| Vendor Name | Text | "PT Weloop Indonesia" | Company name |
| Vendor Type | Enum | `Hardware` / `Platform` / `Hardware+Platform` / `SIM Provider` | What they provide |
| Contact Person | Text | "Pak Jason — +62 878-1234-5678" | Main contact |
| Email | Text | "jason@weloop.co.id" | Contact email |
| Office Address | Text | "Ruko PIK Boulevard No. 12, Jakarta Utara" | Office location |
| Website | URL | "https://weloop.co.id" | Company website |
| Contract ID | Text | "CSN-GPSV-2024-001" | CASAN contract reference |
| Pricing Model | Text | "Rp 280K/unit + Rp 12K/month platform" | Cost structure |
| SLA | Text | "99.5% uptime, <1hr response for critical" | Service level |
| Total Devices Supplied | Int | 150 | Lifetime units from this vendor |
| Active Devices | Int | 132 | Currently in use |
| RMA Rate | Percent | 3.2% | Return/defect rate |
| Avg Response Time | Text | "45 minutes" | Support response average |
| Platform API Access | Boolean | `true` | CASAN can query their API |
| API Endpoint | URL | "https://api.weloop.co.id/v2" | Integration endpoint |
| API Key / Auth | Text | "[encrypted]" | Authentication credentials |

---

# 🏍️ LIST 4: FLEET LIST (Vehicle / Bike Registry)

The Fleet List is the **master registry of every physical vehicle** in the CASAN system — from purchase to deployment to eventual ownership transfer or retirement.

---

## Vehicle Master Record

### Vehicle Identity
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Vehicle ID | Auto-gen | `CSN-045` | CASAN internal ID |
| VIN / Frame Number | Text | "LZEE72V08P1234567" | Chassis number (Nomor Rangka) |
| Engine / Motor Number | Text | "EM72V-2024-04567" | Motor number (Nomor Mesin) |
| OEM Brand | FK → OEM | Zeeho | Manufacturer |
| Model | FK → Bike Model | "Aegis" | Specific model |
| Variant / Trim | Text | "Aegis Pro — Dual Battery" | Sub-model variant |
| Year of Manufacture | Int | 2024 | Production year |
| Color | Text | "Matte Black" | Exterior color |
| Color Code | Text | "MBK-01" | OEM color code |

### Bike Model Specifications (Linked from Model Master)
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Model ID | Auto-gen | `MDL-ZH-AEGIS` | Model identifier |
| Model Name | Text | "Zeeho Aegis" | Full model name |
| OEM Brand | FK → OEM | Zeeho | Brand |
| Vehicle Category | Enum | `Scooter` / `Motorcycle` / `Moped` / `Cargo` | Form factor |
| Motor Type | Enum | `Hub Motor` / `Mid-Drive` / `Belt Drive` | Motor configuration |
| Motor Power (W) | Int | 3000 | Rated power in watts |
| Peak Power (W) | Int | 5000 | Peak power |
| Motor Voltage | Int | 72 | Operating voltage (V) |
| Top Speed (km/h) | Int | 75 | Maximum speed |
| Torque (Nm) | Float | 150 | Maximum torque |
| Battery Type | Enum | `Fixed` / `Removable` / `Dual Removable` | Battery configuration |
| Battery Chemistry | Enum | `Lithium-Ion NMC` / `LFP (LiFePO4)` / `Lead-Acid` | Cell chemistry |
| Battery Capacity (Ah) | Float | 32 | Amp-hours |
| Battery Capacity (Wh) | Int | 2304 | Watt-hours (= V × Ah) |
| Battery Voltage (V) | Int | 72 | Nominal voltage |
| Number of Batteries | Int | 1 | Single or dual battery |
| Battery Weight (kg) | Float | 18.5 | Per battery |
| Battery Brand / Supplier | Text | "CATL" | Cell manufacturer |
| Battery BMS | Text | "Smart BMS v3 — Bluetooth enabled" | Battery management system |
| Estimated Range (km) | Int | 110 | Single charge range (manufacturer claim) |
| Real-World Range (km) | Int | 85 | Actual range observed in OJOL use |
| Charge Time — Trickle (5A) | Text | "10-12 hours" | Home charging time |
| Charge Time — Standard (10A) | Text | "5-6 hours" | Standard charger |
| Charge Time — Fast | Text | "1.5-2 hours (20%-80%)" | Fast charge time |
| Charger Type | Text | "72V 5A included, 10A optional" | Included charger spec |
| Charger Connector | Enum | `Proprietary` / `GB/T` / `Type 2` / `Anderson` | Plug type |
| Compatible Fast Chargers | Text[] | `["Brand FastCharge FC-72", "Universal 72V DC"]` | Which fast chargers work |
| Curb Weight (kg) | Float | 95 | Vehicle weight without rider |
| Max Load (kg) | Int | 150 | Maximum payload |
| Seat Height (mm) | Int | 780 | Seat height |
| Wheelbase (mm) | Int | 1350 | Distance between axles |
| Tire Size Front | Text | "90/90-12" | Front tire specification |
| Tire Size Rear | Text | "100/90-12" | Rear tire specification |
| Brake Type Front | Enum | `Disc — CBS` / `Drum` / `Disc — ABS` | Front brake |
| Brake Type Rear | Enum | `Disc — CBS` / `Drum` / `Disc — ABS` | Rear brake |
| Suspension Front | Text | "Telescopic Fork" | Front suspension type |
| Suspension Rear | Text | "Twin Shock" | Rear suspension type |
| Display Type | Text | "7-inch TFT Color" | Dashboard display |
| Connectivity | Text[] | `["Bluetooth", "4G App", "GPS Built-in"]` | Built-in connectivity |
| Storage (liters) | Int | 28 | Under-seat storage capacity |
| USB Charging Port | Boolean | `true` | Has USB port for phone |
| Reverse Gear | Boolean | `false` | Has reverse function |
| Keyless Start | Boolean | `true` | NFC/proximity key |
| Drive Modes | Text[] | `["Eco", "Normal", "Sport"]` | Available riding modes |
| IP Rating | Text | "IPX5 — rain resistant" | Water resistance of electronics |
| Retail Price (MSRP) | Currency | Rp 28,500,000 | Suggested retail price |
| Dealer Cost | Currency | Rp 23,000,000 | Wholesale to dealer |
| RTO Target Price | Currency | Rp 32,000,000 | Total RTO collections target |

### Vehicle Registration (Indonesian Specific)
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Plate Number | Text | "B 3456 EVA" | Nomor Polisi (TNKB) |
| STNK Number | Text | "012345678" | Vehicle registration number |
| STNK Name | Text | "PT Tangkas Motor Elektrik" | Registered owner name |
| STNK Expiry — Annual | Date | 2025-09-15 | Annual renewal date |
| STNK Expiry — 5 Year | Date | 2029-09-15 | 5-year re-registration |
| STNK Renewal Alert (days) | Int | 30 | Alert before expiry |
| BPKB Number | Text | "K-12345678" | Vehicle ownership cert number |
| BPKB Status | Enum | `At Dealer` / `At CASAN` / `At Leasing` / `Transferred to Rider` | Who holds BPKB |
| BPKB Location | Text | "Tangkas Motors safe — Cawang outlet" | Physical location of BPKB |
| PKB (Annual Tax) Amount | Currency | Rp 250,000 | Annual vehicle tax |
| PKB Due Date | Date | 2025-09-15 | Tax payment due |
| PKB Paid | Boolean | `true` | Current year paid? |
| SWDKLLJ (Jasa Raharja) | Currency | Rp 35,000 | Compulsory insurance |
| NIK Registrant | Text | "3201234567890001" | KTP number of registered owner |

### Vehicle Battery Details (Per-Vehicle)
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Battery Serial Number | Text | "BAT-CATL-72V32-20240915-0456" | Unique battery ID |
| Battery Install Date | Date | 2024-09-20 | When battery was installed in this bike |
| Battery Cycle Count | Int | 245 | Total charge/discharge cycles |
| Battery Health (SoH) | Percent | 94% | State of Health |
| Battery Last Checked | Date | 2025-06-01 | Last health check date |
| Battery Capacity Remaining | Percent | 92% | Current vs. original capacity |
| Battery Warranty Status | Enum | `Under Warranty` / `Extended` / `Expired` | Warranty state |
| Battery Warranty Expiry | Date | 2029-09-20 | Warranty end date |
| Battery Warranty Trigger | Text | "<70% SoH within warranty period" | What triggers warranty claim |
| Battery Replacement History | JSON | `[]` | Past replacements |
| Compatible Battery Models | Text[] | `["CATL 72V32Ah", "EVE 72V30Ah"]` | Swappable battery options |
| Battery Cost (Replacement) | Currency | Rp 6,500,000 | Replacement cost |
| Battery Swap Network Compatible | Boolean | `false` | Works with swap stations? |

### Vehicle Financial
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Purchase Date | Date | 2024-09-15 | When dealer bought from OEM |
| Purchase Price | Currency | Rp 23,000,000 | Dealer acquisition cost |
| Purchase PO | Text | "PO-TGK-2024-089" | Purchase order reference |
| Additional Costs | JSON | See below | Setup, GPS, accessories |
| Total Investment | Currency | Rp 24,225,000 | All-in cost |
| Current Book Value | Currency | Rp 19,500,000 | Depreciated value |
| Depreciation Method | Enum | `Straight-Line 3yr` / `Declining Balance` | Accounting method |
| Insurance Policy | Text | "POL-2024-THEFT-089" | Insurance reference |
| Insurance Provider | Text | "Asuransi Sinar Mas" | Insurer |
| Insurance Premium / Month | Currency | Rp 75,000 | Monthly premium |
| Insurance Coverage | Text[] | `["theft", "total_loss"]` | What's covered |
| Insurance Expiry | Date | 2025-09-15 | Policy end date |

**Additional Costs Example:**
```json
{
  "gps_device": 350000,
  "gps_installation": 75000,
  "accessories": 200000,
  "registration_fees": 500000,
  "insurance_deposit": 100000,
  "total": 1225000
}
```

### Vehicle Assignment / RTO Status
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Current Status | Enum | `Active` / `Grace` / `Immobilized` / `Paused` / `Available` / `In Service` / `Returned` / `Written Off` / `Transferred` | Master status |
| Current Program | FK → Program | `PRG-ZH-RTO-001` | Enrolled program |
| Current Rider | FK → Rider | `RDR-045` | Assigned rider |
| Assignment Date | Date | 2025-01-15 | When current rider received bike |
| Contract End Date | Date | 2026-07-15 | Expected RTO completion |
| Total Days in Contract | Int | 547 | Total contracted days |
| Days Completed | Int | 156 | Days elapsed |
| Days Paid | Int | 148 | Days actually paid for |
| Days Remaining | Int | 391 | Days left in contract |
| Credits Remaining | Float | 12.5 | Current credits in days |
| Down Payment Received | Currency | Rp 1,500,000 | DP collected |
| Total Revenue Collected | Currency | Rp 7,400,000 | Lifetime revenue from this vehicle |
| Total Revenue Expected | Currency | Rp 27,000,000 | Total contract value |
| Completion Percentage | Percent | 27.4% | Revenue collected / expected |
| Previous Riders | Int | 0 | How many riders before current |
| Previous Rider History | JSON | `[]` | Past assignments |

### Vehicle Condition
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Condition Grade | Enum | `A` / `B` / `C` / `D` | Overall condition |
| Last Inspection Date | Date | 2025-06-01 | Last physical check |
| Odometer (km) | Int | 12,450 | Current mileage |
| Odometer Source | Enum | `GPS Calculated` / `Manual` / `OBD` | How odometer is tracked |
| Tire Condition | Enum | `Good` / `Fair` / `Needs Replacement` | Tire state |
| Brake Condition | Enum | `Good` / `Fair` / `Needs Service` | Brake state |
| Body Condition | Text | "Minor scratches on left panel" | Visual condition |
| Known Issues | Text[] | `["Slight rattle from rear suspension"]` | Outstanding issues |
| Next Service Due | Date | 2025-07-15 | Upcoming maintenance date |
| Next Service Type | Text | "3,000 km routine service" | What service is needed |

### Vehicle GPS Link
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| GPS Device ID | FK → GPS Device | `GPS-001234` | Installed GPS device |
| GPS Install Date | Date | 2025-01-14 | When GPS was installed |
| GPS Status | Enum | `Online` / `Offline` / `No Device` | Current GPS state |
| Last Known Location | Lat/Lng | -6.2654, 106.8721 | Last GPS position |
| Last Ping | Timestamp | 2025-06-20 14:23:45 | Last GPS communication |
| Daily Distance (avg) | Float | 118.5 | Average km/day over last 30 days |
| Immobilization State | Enum | `Normal` / `Immobilized` / `Speed-Limited` | Current lock state |

### Vehicle Lifecycle Tracking
| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| Lifecycle Stage | Enum | `New` / `PDI` / `Available` / `Active RTO` / `Returned` / `Refurbishing` / `Re-deployed` / `End of Life` / `Transferred` | Where in lifecycle |
| PDI Completed | Boolean | `true` | Pre-delivery inspection done? |
| PDI Date | Date | 2024-09-18 | PDI date |
| PDI Checklist | JSON | `{"brakes":"pass","lights":"pass","battery":"pass"...}` | PDI results |
| Handover Photos | URL[] | `["handover1.jpg", "handover2.jpg"]` | Photos at rider handover |
| Handover Odometer | Int | 15 | Odometer at handover |
| Return Date (if returned) | Date | null | When bike came back |
| Return Condition Grade | Enum | null | Condition at return |
| Return Odometer | Int | null | Odometer at return |
| Refurbishment Cost (if any) | Currency | null | Cost to refurbish |
| Ownership Transfer Date | Date | null | When transferred to rider |
| Transfer Documents | Text[] | `[]` | BPKB transfer, etc. |

---

# 🔗 HOW THE 4 LISTS CONNECT

```
PROGRAM LIST ←→ OEM (which OEM created the program)
     ↓
     ↓ assigns rules to
     ↓
FLEET LIST (each vehicle enrolled in a program)
     ↓
     ↓ has installed
     ↓
GPS LIST (each vehicle has a GPS device)
     ↓
     ↓ owned by / located at
     ↓
PARTNER LIST → Dealer → Location (where vehicle is based)
     ↓
     ↓ serves
     ↓
RIDER (OJOL) → enrolled in Program → assigned a Vehicle → tracked by GPS → serviced at Dealer Location
```

---

# 📝 PROMPT-READY SUMMARY FOR DEVELOPMENT

When building these into the CASAN dashboard, each list becomes a **tab/section** with:

1. **PROGRAM LIST** — Filterable by OEM, type (RTO/Rental), status. Expandable cards showing all rules, rates, and metrics.

2. **PARTNER/DEALER LIST** — Filterable by OEM brand, region, tier. Map view of all locations with pickup points. Drill into each location for inventory and staff.

3. **GPS DEVICE LIST** — Filterable by status (online/offline), vendor, vehicle assignment. Bulk SIM management. Health monitoring dashboard.

4. **FLEET LIST** — Filterable by model, status, dealer, program, battery health, condition grade. Full vehicle profile with registration, battery, financial, and lifecycle data.

Each list supports: Search, Filter, Sort, Export (CSV/Excel), Bulk Actions, and Detail View.
