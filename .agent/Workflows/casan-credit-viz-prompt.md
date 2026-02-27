# CASAN Day Credit Visualization — Complete Prompt for Antigravity

---

## PROMPT START — COPY EVERYTHING BELOW THIS LINE

---

## OVERVIEW — WHAT YOU ARE BUILDING

You are building the **Day Credit Visualization System** for CASAN, an electric motorcycle Rent-to-Own (RTO) platform for OJOL (ride-hailing motorcycle taxi) drivers in Jakarta, Indonesia.

**"Day Credits"** are the core unit of the CASAN system. Riders pay money → receive credits measured in days → credits count down in real-time → when credits hit zero, consequences follow. The entire rider experience revolves around understanding: *"How many days/hours/minutes do I have left before something bad happens to my bike?"*

This prompt defines **TWO separate views** of the same credit data:

1. **RIDER WEB APP** — What the OJOL rider sees on their phone (mobile-first, simple, emotional, clear)
2. **ADMIN DASHBOARD** — What the dealer/CASAN staff sees on their fleet management screen (data-dense, operational, multi-vehicle)

Both views must visualize the **exact same underlying credit lifecycle**, but with different levels of detail and different emotional design goals.

---

## THE CREDIT LIFECYCLE — COMPLETE STATE MACHINE

A rider's credits flow through these states in a strict sequence. **Every state has a specific visual treatment.** Understanding this flow is critical before designing anything:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  PAYMENT ──→ ACTIVE (HEALTHY) ──→ ACTIVE (LOW) ──→ ACTIVE (CRITICAL)  │
│    ↑              │                     │                 │             │
│    │              │                     │                 ↓             │
│    │              │                     │          EXPIRING (<24h)      │
│    │              │                     │                 │             │
│    │              ↓                     ↓                 ↓             │
│    │     HOLIDAY PAUSE ◄─────── (any active state)  CREDITS = 0        │
│    │     (credits frozen)                                 │             │
│    │              │                                       ↓             │
│    │              ↓                                GRACE PERIOD         │
│    │     HOLIDAY ENDS ──→ Resume to previous state   (countdown)       │
│    │                                                      │             │
│    │                                                      ↓             │
│    │                                               GRACE EXPIRED       │
│    │                                                      │             │
│    │                                                      ↓             │
│    └──────────────────────────────────── IMMOBILIZED (bike locked)     │
│    pay to unlock                                                        │
│                                                                         │
│  SPECIAL: CONTRACT COMPLETE ──→ Ownership transfer (RTO only)          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ALL 9 CREDIT STATES — Detailed Definition

### STATE 1: ACTIVE — HEALTHY (credits > 7 days)
```
Trigger:     Rider has more than 7 days of credit remaining
Credits:     Counting down in real-time (1 day = 24 hours from payment time)
Rider mood:  Calm, confident, no worry
Bike status: Normal operation, no restrictions
Color:       GREEN (#34D399)
Next state:  → Active Low (when credits drop below 7 days)
             → Holiday Pause (if rider requests)
```

### STATE 2: ACTIVE — LOW (credits 3-7 days)
```
Trigger:     Credits drop below 7 days
Credits:     Counting down, shown as days + hours
Rider mood:  Aware — needs to plan next payment soon
Bike status: Normal operation, no restrictions
Color:       AMBER (#FBBF24)
Notification: "Your credits are running low — 5d 12h remaining. Pay soon to avoid interruption."
Next state:  → Active Critical (when credits drop below 3 days)
             → Active Healthy (if rider pays)
             → Holiday Pause (if rider requests)
```

### STATE 3: ACTIVE — CRITICAL (credits 1-3 days)
```
Trigger:     Credits drop below 3 days
Credits:     Counting down, shown as days + hours + minutes
Rider mood:  Worried — needs to pay today or tomorrow
Bike status: Normal operation, no restrictions YET
Color:       ORANGE (#FF6B35) — warning escalation
Notification: "⚠️ URGENT: Only 2d 5h remaining. Pay now to avoid grace period."
Frequency:   Notification repeated every 12 hours
Next state:  → Expiring (when credits drop below 24 hours)
             → Active Healthy/Low (if rider pays)
```

### STATE 4: EXPIRING (credits < 24 hours)
```
Trigger:     Credits drop below 24 hours (1 day)
Credits:     Counting down in HOURS : MINUTES : SECONDS — live ticking
Rider mood:  Urgent — this is the "last chance" window
Bike status: Normal operation, but grace period imminent
Color:       BRIGHT ORANGE/RED (#FF6B35) with PULSING animation
Notification: "🚨 EXPIRING: 14h 23m left. Pay NOW or bike enters grace period!"
Frequency:   Notification every 6 hours, then every 2 hours in last 6h
Visual:      Pulsing border, flashing countdown, warning banner
Next state:  → Grace Period (when credits hit exactly 0)
             → Active Healthy/Low/Critical (if rider pays)
```

### STATE 5: GRACE PERIOD (credits = 0, grace countdown active)
```
Trigger:     Credits reach exactly 0:00:00
Credits:     ZERO — now a GRACE COUNTDOWN is running (separate timer)
Grace timer: Counting down from program's grace period (e.g., 7 days)
Rider mood:  Stressed — bike will be locked if they don't pay
Bike status: Normal operation STILL WORKS — this is the "mercy" period
Color:       AMBER/YELLOW (#FBBF24) — with increasing urgency
Notification: "⚠️ GRACE PERIOD: 5d 3h until bike is locked. Pay immediately."
Frequency:   Daily notification, then every 12h in last 3 days, every 6h in last day
Visual:      Yellow pulsing, progress bar draining from yellow → red
Late fees:   May start accruing depending on program rules
Next state:  → Immobilized (when grace countdown hits 0)
             → Active Healthy (if rider pays — grace resets, credits added)
```

### STATE 6: IMMOBILIZED (grace expired, bike locked)
```
Trigger:     Grace period countdown reaches 0:00:00
Credits:     ZERO
Grace:       EXPIRED
Rider mood:  Desperate — bike is locked, can't work, losing income
Bike status: MOTOR CUT — bike will not start, GPS immobilization active
Color:       RED (#F87171) — critical, pulsing
Notification: "🔒 BIKE LOCKED. Your bike has been immobilized. Pay now to unlock."
Visual:      Red background, lock icon, pulsing animation, days immobilized counter
Counter:     Shows "Immobilized for X days" counting UP
Late fees:   Accruing daily
Reactivation: Requires payment + possible reactivation fee
Next state:  → Active Healthy (if rider pays enough to cover overdue + new credits)
             → Repossession (if immobilized > max_overdue_days, e.g., 30 days)
```

### STATE 7: HOLIDAY PAUSE (credits frozen)
```
Trigger:     Rider or admin activates holiday pause
Credits:     FROZEN — whatever credits existed at pause time are preserved
Timer:       Shows holiday end date countdown (when will credits resume)
Rider mood:  Relaxed — on approved break (mudik, medical, vacation)
Bike status: Normal operation MAY be restricted (depends on program)
             Some programs: bike stays with rider but GPS monitoring continues
             Some programs: bike returned to dealer during holiday
Color:       BLUE (#60A5FA) — calm, informational
Notification: "⏸ Holiday active: Resumes June 25. Credits frozen at 8d."
Visual:      Blue theme, snowflake/pause icon, frozen credit display
Next state:  → Active (state before pause) when holiday ends
             Resume can be: automatic on end date, or manual by admin
```

### STATE 8: CONTRACT COMPLETE (RTO only — all payments done)
```
Trigger:     Total payments received >= contract value
Credits:     N/A — contract is fulfilled
Rider mood:  Celebration! 🎉 They own the bike now
Bike status: Normal operation, GPS may be removed, immobilization disabled
Color:       GOLD/GREEN (#34D399 + gold accents)
Visual:      Celebration confetti animation (once), completion badge
Message:     "🎉 CONGRATULATIONS! Your RTO contract is complete. Visit dealer to finalize ownership transfer."
Next state:  → Ownership Transfer process (BPKB handover)
```

### STATE 9: PENDING FIRST PAYMENT (new rider, just enrolled)
```
Trigger:     Rider just enrolled, no payment yet (or down payment only)
Credits:     0 — awaiting first credit top-up
Rider mood:  Excited but needs orientation
Bike status: May be locked until first payment, or given initial grace
Color:       PURPLE (#A78BFA) — onboarding
Visual:      Welcome message, "Make your first payment to start riding"
Next state:  → Active Healthy (after first payment)
```

---

## PART 1: RIDER WEB APP — Day Credit Display

The rider web app is a **mobile-first** web application (not a native app). The rider accesses it via a URL on their phone's browser. It must be extremely simple, instantly readable, and emotionally clear. Most OJOL riders have limited education — the design must communicate through color, size, and icons, not complex text.

### Design Principles for Rider View
1. **ONE big number dominates the screen** — the credit countdown
2. **Color tells the story** — green = safe, amber = warning, orange = urgent, red = locked, blue = paused
3. **Bahasa Indonesia** — all text in Indonesian (provide both Indonesian and English in this spec)
4. **Giant touch targets** — minimum 48px height for any interactive element
5. **Works on cheap Android phones** — minimal animations, no heavy graphics, fast loading
6. **Dark mode only** — matches CASAN brand, saves battery on OLED screens

### Rider App Color System
```
Safe (>7d):     Background #0C1018, accent #34D399 (green)
Low (3-7d):     Background #0C1018, accent #FBBF24 (amber)
Critical (1-3d): Background #0C1018, accent #FF6B35 (orange)
Expiring (<24h): Background #1A0800 (dark warm tint), accent #FF6B35, pulsing
Grace:          Background #1A1400 (dark warm tint), accent #FBBF24, urgent
Immobilized:    Background #1A0A0A (dark red tint), accent #F87171, pulsing
Holiday:        Background #0A1020 (dark blue tint), accent #60A5FA
Complete:       Background #0C1018, accent #34D399 + gold #FFD700
Pending:        Background #0C1018, accent #A78BFA
```

### Rider App Screen Layout — Every State

---

#### RIDER SCREEN: STATE 1 — Active Healthy (>7 days)

```
┌──────────────────────────────────┐
│  C  CASAN                   ⚙️  │  Header: logo + settings gear
├──────────────────────────────────┤
│                                  │
│        Halo, Ahmad! 👋           │  Greeting with rider first name
│                                  │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  │      🟢 AKTIF            │   │  Status badge — green dot + "AKTIF"
│  │                          │   │
│  │         18               │   │  ← GIANT number (72px+, bold 900)
│  │        HARI              │   │  ← "HARI" (days) below in smaller text
│  │                          │   │
│  │   Berlaku sampai:        │   │  "Valid until:"
│  │   8 Juli 2025, 14:30     │   │  Exact expiry date + time
│  │                          │   │
│  │  ████████████████░░░░░   │   │  Progress bar (green, ~70% full)
│  │  18 dari 21 hari tersisa │   │  "18 of 21 days remaining"
│  │                          │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │  Motor: Zeeho Aegis      │   │  Vehicle info card
│  │  Plat:  B 3456 EVA       │   │
│  │  Rate:  Rp 50.000/hari   │   │
│  │  Program: Zeeho RTO 18bl │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │  Riwayat Pembayaran ›    │   │  "Payment History" — tappable
│  │  Terakhir: 20 Jun 2025   │   │
│  │  7 hari — Rp 350.000     │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  │   💰 BAYAR SEKARANG      │   │  "PAY NOW" — big green button
│  │                          │   │  Always visible but not urgent
│  └──────────────────────────┘   │
│                                  │
│  Kontrak: 42% selesai           │  "Contract: 42% complete"
│  ████████░░░░░░░░░░░            │  Overall RTO progress bar
│  Rp 11.4M / Rp 27M             │  Amount paid / total
│                                  │
└──────────────────────────────────┘
```

**Key Design Details:**
- Credit number "18" is the **largest element on screen** — minimum 72px, font-weight 900, IBM Plex Mono
- Progress bar: smooth green gradient, rounded ends, 8px height
- Vehicle info: compact card, muted colors, secondary importance
- Pay button: present but not urgent — solid green border, transparent background
- Contract progress: at very bottom, subtle, shows long-term journey

---

#### RIDER SCREEN: STATE 2 — Active Low (3-7 days)

```
┌──────────────────────────────────┐
│  C  CASAN                   ⚙️  │
├──────────────────────────────────┤
│                                  │
│  ┌──────────────────────────┐   │
│  │  ⚠️ Kredit Menipis       │   │  AMBER warning banner
│  │  Segera lakukan isi ulang│   │  "Credits running low — top up soon"
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  │      🟡 AKTIF            │   │  Amber dot + "AKTIF"
│  │                          │   │
│  │       5hari              │   │  Number in AMBER, still large
│  │      12jam               │   │  Now showing HOURS too
│  │                          │   │
│  │   Berlaku sampai:        │   │
│  │   25 Juni 2025, 02:30    │   │
│  │                          │   │
│  │  ████████░░░░░░░░░░░░░   │   │  Progress bar — AMBER, ~25%
│  │  5d 12h dari 21 hari     │   │
│  │                          │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  │   💰 BAYAR SEKARANG      │   │  Button now AMBER, more prominent
│  │   Rp 350.000 = 7 hari   │   │  Shows suggested payment amount
│  │                          │   │
│  └──────────────────────────┘   │
│                                  │
└──────────────────────────────────┘
```

**Changes from Healthy:**
- Warning banner appears at top (amber background)
- Credit display now shows days AND hours (e.g., "5 hari 12 jam")
- Progress bar changes to amber
- Pay button becomes amber, shows suggested amount
- All green → amber color shift

---

#### RIDER SCREEN: STATE 3 — Active Critical (1-3 days)

```
┌──────────────────────────────────┐
│  C  CASAN                   ⚙️  │
├──────────────────────────────────┤
│                                  │
│  ┌──────────────────────────┐   │
│  │  🚨 SEGERA BAYAR!        │   │  ORANGE urgent banner, pulsing
│  │  Kredit hampir habis!    │   │  "PAY IMMEDIATELY! Credits almost gone!"
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  │      🟠 KRITIS           │   │  Orange dot + "KRITIS" (Critical)
│  │                          │   │
│  │    1hari 14jam           │   │  ORANGE, large
│  │       23menit            │   │  Now showing MINUTES too
│  │                          │   │
│  │   Berlaku sampai:        │   │
│  │   21 Juni 2025, 14:23    │   │
│  │                          │   │
│  │  ███░░░░░░░░░░░░░░░░░░   │   │  Progress bar — ORANGE, very low
│  │                          │   │
│  │  ⚠️ Setelah habis:       │   │  "After credits expire:"
│  │  Grace period 7 hari     │   │  "7-day grace period"
│  │  lalu motor DIKUNCI      │   │  "then bike LOCKED"
│  │                          │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  │   💰 BAYAR SEKARANG      │   │  ORANGE solid background button
│  │   Rp 350.000 = 7 hari   │   │  Can't miss it
│  │                          │   │
│  └──────────────────────────┘   │
│                                  │
└──────────────────────────────────┘
```

**Changes from Low:**
- Banner turns ORANGE, pulsing border animation
- Status changes to "KRITIS"
- Credit now shows days + hours + minutes
- New section appears: "What happens after credits expire" — educates rider about grace → immobilization
- Pay button: SOLID ORANGE background (filled, not outline)

---

#### RIDER SCREEN: STATE 4 — Expiring (<24 hours)

```
┌──────────────────────────────────┐
│  C  CASAN                   ⚙️  │
├──────────────────────────────────┤
│                                  │
│  ┌──────────────────────────┐   │
│  │  🚨🚨 KREDIT HAMPIR      │   │  RED-ORANGE banner, PULSING fast
│  │  HABIS! BAYAR SEKARANG!  │   │  Border animation: expPulse
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  │    ⚠️ SEGERA HABIS       │   │  "EXPIRING SOON"
│  │                          │   │
│  │    14:23:45              │   │  ← LIVE TICKING countdown
│  │    jam  mnt  dtk         │   │  "hours min sec"
│  │                          │   │  Seconds tick in real-time
│  │   ▂▃▄▅▆▇ COUNTING DOWN   │   │  Animated bar draining
│  │                          │   │
│  │   Habis: Hari ini 14:23  │   │  "Expires: Today at 14:23"
│  │                          │   │
│  │  ⏰ Setelah habis:       │   │
│  │  ┌────────────────────┐  │   │
│  │  │ Grace: 7 hari      │  │   │  Timeline preview
│  │  │ ████████░░░░░░░░░  │  │   │  "You'll have 7 days grace"
│  │  │ Lalu: 🔒 DIKUNCI   │  │   │  "Then: LOCKED"
│  │  └────────────────────┘  │   │
│  │                          │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │  💰💰💰💰💰💰💰💰💰💰  │   │  GIANT pay button
│  │                          │   │
│  │   BAYAR SEKARANG         │   │  Solid RED-ORANGE background
│  │   Mulai Rp 50.000 (1hr) │   │  "From Rp 50,000 (1 day)"
│  │                          │   │
│  └──────────────────────────┘   │
│                                  │
└──────────────────────────────────┘
```

**Key Changes:**
- The countdown is now **HH:MM:SS with LIVE TICKING seconds**
- The seconds digit should animate/flash with `animation: crit 1.2s ease-in-out infinite`
- Background has subtle warm tint (`#1A0800`)
- Shows "what happens next" timeline: grace period → lock
- Pay button is MASSIVE, takes up more vertical space, solid filled background
- Card has a pulsing orange border animation

---

#### RIDER SCREEN: STATE 5 — Grace Period

```
┌──────────────────────────────────┐
│  C  CASAN                   ⚙️  │
├──────────────────────────────────┤
│                                  │
│  ┌──────────────────────────┐   │
│  │  ⚠️ MASA TENGGANG AKTIF  │   │  AMBER banner "GRACE PERIOD ACTIVE"
│  │  Motor masih bisa jalan  │   │  "Bike still works"
│  │  BAYAR untuk hindari     │   │  "PAY to avoid lock"
│  │  penguncian!             │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  │      ⚠️ GRACE PERIOD     │   │  Amber badge
│  │                          │   │
│  │      KREDIT: 0           │   │  Big RED zero
│  │      HARI                │   │
│  │                          │   │
│  │  ──────────────────────  │   │  Divider
│  │                          │   │
│  │  🔒 Motor dikunci dalam: │   │  "Bike locked in:"
│  │                          │   │
│  │    05 : 12 : 34 : 07     │   │  dd : hh : mm : ss
│  │    hr   jam  mnt  dtk    │   │  LIVE TICKING — amber color
│  │                          │   │
│  │  ████████████░░░░░░░░░   │   │  Grace progress bar
│  │  Grace: 5d 12h / 7 hari  │   │  Draining from amber → red
│  │                          │   │  gradient shifts as time runs out
│  │                          │   │
│  │  ⚠️ Denda: Rp 5.000/hari │   │  "Late fee: Rp 5,000/day"
│  │  Total denda: Rp 10.000  │   │  "Total late fees: Rp 10,000"
│  │                          │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  │   💰 BAYAR & AKTIFKAN    │   │  "PAY & REACTIVATE"
│  │   Min: Rp 60.000         │   │  Minimum: overdue + 1 day
│  │   (denda + 1 hari)       │   │  "(late fee + 1 day)"
│  │                          │   │
│  └──────────────────────────┘   │
│                                  │
│  📞 Hubungi Dealer ›            │  "Contact Dealer" link
│  Tangkas Motors — 0812-xxx      │
│                                  │
└──────────────────────────────────┘
```

**Key Design Details:**
- TWO countdowns visible: Credits = 0 (static red) and Grace countdown (live ticking amber)
- Grace progress bar uses gradient: starts amber, transitions to red as time runs out
- Late fee accumulation shown clearly
- Pay button text changes to "PAY & REACTIVATE"
- Minimum payment shown: must cover late fees + at least 1 day
- Dealer contact appears — rider may need help
- The grace countdown seconds should tick in real-time with the `crit` animation when < 6 hours remain

**Grace sub-states (visual urgency escalation):**
- Grace > 3 days remaining: Amber, normal pulse
- Grace 1-3 days: Orange tint, faster pulse
- Grace < 24 hours: Red-orange, very fast pulse, background tint shifts to `#1A0A0A`
- Grace < 6 hours: Red, seconds digit flashing, "URGENT" overlay, entire card pulsing

---

#### RIDER SCREEN: STATE 6 — Immobilized (Bike Locked)

```
┌──────────────────────────────────┐
│  C  CASAN                   ⚙️  │
├──────────────────────────────────┤
│                                  │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  │  🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒  │   │
│  │                          │   │
│  │     MOTOR DIKUNCI        │   │  "BIKE LOCKED" — large red text
│  │                          │   │
│  │  🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒  │   │
│  │                          │   │
│  └──────────────────────────┘   │  Red background, pulsing animation
│                                  │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  │  ● DIKUNCI               │   │  Red pulsing dot — "LOCKED"
│  │                          │   │
│  │  Kredit: 0 HARI          │   │  Red zero
│  │  Grace:  HABIS            │   │  "EXPIRED"
│  │                          │   │
│  │  Terkunci sejak:         │   │  "Locked since:"
│  │  15 Juni 2025 (5 hari)   │   │  Date + "X days" counting UP
│  │                          │   │
│  │  ──────────────────────  │   │
│  │                          │   │
│  │  Tagihan Tertunggak:     │   │  "Outstanding bill:"
│  │  ┌────────────────────┐  │   │
│  │  │ Denda:  Rp 60.000  │  │   │  Late fees
│  │  │ Reaktivasi: Rp 50K │  │   │  Reactivation fee
│  │  │ ────────────────── │  │   │
│  │  │ TOTAL: Rp 110.000  │  │   │  Total to unlock (RED, bold)
│  │  │ + min 1 hari kredit│  │   │  "+ minimum 1 day credit"
│  │  └────────────────────┘  │   │
│  │                          │   │
│  │  ⚠️ Jika tidak bayar     │   │  "If not paid within 30 days"
│  │  dalam 30 hari, motor    │   │  "bike will be repossessed"
│  │  akan ditarik kembali.   │   │
│  │  Sisa: 25 hari           │   │  "Remaining: 25 days" — countdown
│  │                          │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  │   🔓 BAYAR & BUKA KUNCI  │   │  "PAY & UNLOCK"
│  │   Min: Rp 160.000        │   │  Minimum = fees + 1 day
│  │                          │   │
│  └──────────────────────────┘   │
│                                  │
│  📞 Hubungi Dealer ›            │
│  💬 Chat WhatsApp ›             │
│                                  │
└──────────────────────────────────┘
```

**Key Design Details:**
- Entire screen feels "red" — subtle red background tint (`#1A0A0A`)
- Lock icon row spans full width — visual impact
- "MOTOR DIKUNCI" text is large (24px+), red, bold
- Immobilized duration counts UP: "5 hari" and increasing
- Outstanding bill breakdown is clear: late fees + reactivation fee + minimum credit
- Repossession warning with countdown (days until repo)
- Pay button says "BAYAR & BUKA KUNCI" (PAY & UNLOCK)
- Dealer contact AND WhatsApp link both shown
- The lock pulsing animation: `animation: crit 1.5s ease-in-out infinite`

---

#### RIDER SCREEN: STATE 7 — Holiday Pause

```
┌──────────────────────────────────┐
│  C  CASAN                   ⚙️  │
├──────────────────────────────────┤
│                                  │
│  ┌──────────────────────────┐   │
│  │  ⏸ LIBUR AKTIF           │   │  BLUE banner — "HOLIDAY ACTIVE"
│  │  Kredit dibekukan        │   │  "Credits frozen"
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  │      ⏸ LIBUR             │   │  Blue badge — "HOLIDAY"
│  │                          │   │
│  │      ❄️ 8                │   │  Snowflake/frozen icon
│  │      HARI                │   │  Credits FROZEN at this number
│  │      (dibekukan)         │   │  "(frozen)"
│  │                          │   │
│  │  ──────────────────────  │   │
│  │                          │   │
│  │  Alasan: 🏠 Mudik        │   │  "Reason: Mudik (homecoming)"
│  │  Mulai:  20 Juni 2025    │   │  "Start: June 20"
│  │  Selesai: 4 Juli 2025    │   │  "End: July 4"
│  │                          │   │
│  │  Kembali dalam:          │   │  "Resumes in:"
│  │    12 hari 05:30:00      │   │  Countdown to holiday end
│  │                          │   │
│  │  ████████████░░░░░░░░    │   │  Holiday progress bar (blue)
│  │  3 dari 14 hari libur    │   │  "3 of 14 holiday days used"
│  │                          │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  │   ▶️ AKHIRI LIBUR        │   │  "END HOLIDAY" — blue outline
│  │   (lanjutkan kredit)     │   │  "(resume credits)"
│  │                          │   │
│  └──────────────────────────┘   │
│                                  │
│  ℹ️ Kredit Anda akan otomatis   │  "Credits auto-resume on July 4"
│  dilanjutkan pada 4 Juli 2025   │
│                                  │
└──────────────────────────────────┘
```

**Key Design Details:**
- Blue calm theme — background tint `#0A1020`
- Credit number has snowflake icon and "(dibekukan)" / "(frozen)" label
- Frozen credits number does NOT count down — static display
- Holiday countdown shows when credits will resume
- Holiday progress bar in blue shows how much of the holiday has passed
- "End Holiday" button available for early return
- Info text at bottom explains auto-resume

---

#### RIDER SCREEN: STATE 8 — Contract Complete 🎉

```
┌──────────────────────────────────┐
│  C  CASAN                   ⚙️  │
├──────────────────────────────────┤
│                                  │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  │    🎉🏆🎉               │   │
│  │                          │   │
│  │    SELAMAT!              │   │  "CONGRATULATIONS!"
│  │    KONTRAK SELESAI       │   │  "CONTRACT COMPLETE"
│  │                          │   │
│  │    Motor ini milik Anda  │   │  "This bike is yours"
│  │                          │   │
│  └──────────────────────────┘   │  Green + gold theme, confetti
│                                  │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  │  ████████████████████    │   │  100% progress bar — GOLD
│  │  18 bulan — LUNAS        │   │  "18 months — PAID IN FULL"
│  │                          │   │
│  │  Total dibayar:          │   │  "Total paid:"
│  │  Rp 27.000.000           │   │  Total amount
│  │                          │   │
│  │  Selesai: 20 Juni 2025   │   │  Completion date
│  │                          │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │  Langkah selanjutnya:    │   │  "Next steps:"
│  │                          │   │
│  │  1. Kunjungi dealer      │   │  "Visit dealer"
│  │  2. Bawa KTP asli        │   │  "Bring original KTP"
│  │  3. Tanda tangan BPKB    │   │  "Sign BPKB transfer"
│  │  4. Motor resmi milik    │   │  "Bike officially yours"
│  │     Anda! 🎉             │   │
│  │                          │   │
│  │  📞 Hubungi Dealer ›     │   │
│  └──────────────────────────┘   │
│                                  │
└──────────────────────────────────┘
```

---

#### RIDER SCREEN: STATE 9 — Pending First Payment

```
┌──────────────────────────────────┐
│  C  CASAN                   ⚙️  │
├──────────────────────────────────┤
│                                  │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  │  Selamat datang di       │   │  "Welcome to CASAN!"
│  │  CASAN! 🎉               │   │
│  │                          │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  │      🟣 MENUNGGU         │   │  Purple — "WAITING"
│  │                          │   │
│  │         0                │   │  Large zero
│  │        HARI              │   │
│  │                          │   │
│  │  Lakukan pembayaran      │   │  "Make your first payment"
│  │  pertama untuk mulai     │   │  "to start riding"
│  │  berkendara              │   │
│  │                          │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │  Motor Anda:             │   │  "Your bike:"
│  │  Zeeho Aegis             │   │
│  │  B 3456 EVA              │   │
│  │  Rate: Rp 50.000/hari    │   │
│  │  Program: RTO 18 bulan   │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  │   💰 BAYAR PERTAMA       │   │  "FIRST PAYMENT"
│  │   Min: Rp 350.000 (7hr) │   │  Purple solid button
│  │                          │   │
│  └──────────────────────────┘   │
│                                  │
└──────────────────────────────────┘
```

---

## PART 2: ADMIN DASHBOARD — Day Credit Display

The admin dashboard is part of the existing CASAN Fleet Management system. It's viewed by dealer staff and CASAN operations team on desktop (primarily) and mobile (occasionally). The admin needs to see credit status for **many vehicles at once** and take action quickly.

### Design System — Same as existing CASAN dashboard
```
Colors, fonts, components — ALL match the existing v6 dashboard exactly.
Refer to the design system specified in the GPS Device Management prompt.
```

### Admin Views of Credits — Three Levels of Detail

---

### LEVEL 1: Fleet List Card — Compact Credit Display (in vehicle list)

Each vehicle card in the fleet list shows credit status in a compact single-row format. This is what the admin sees when scanning through dozens of vehicles.

**For each of the 9 states, here is the compact display:**

#### State 1: Active Healthy (>7d)
```
┌──────────────────────────────────────────────────────┐
│ ▎CSN-045  [ACTIVE] [RTO]  Zeeho RTO   Ahmad Rizki   │
│ ▎                                      18d    🟢 On  │
└──────────────────────────────────────────────────────┘
```
- Credit "18d" in GREEN
- No special treatment — normal card

#### State 2: Active Low (3-7d)
```
┌──────────────────────────────────────────────────────┐
│ ▎CSN-045  [ACTIVE] [RTO]  Zeeho RTO   Ahmad Rizki   │
│ ▎                                    5d 12h   🟢 On  │
└──────────────────────────────────────────────────────┘
```
- Credit "5d 12h" in AMBER
- Shows hours now

#### State 3: Active Critical (1-3d)
```
┌──────────────────────────────────────────────────────┐
│ ▎CSN-045  [ACTIVE] [RTO] [⚠ LOW]  Ahmad Rizki       │
│ ▎                                  1d 14h    🟢 On   │
└──────────────────────────────────────────────────────┘
```
- Credit "1d 14h" in ORANGE
- New badge: [⚠ LOW] in orange

#### State 4: Expiring (<24h)
```
┌──────────────────────────────────────────────────────┐
│▎CSN-045  [ACTIVE] [RTO] [⚠ EXPIRING]  Ahmad Rizki   │
│▎                                   14h23m    🟢 On   │
└──────────────────────────────────────────────────────┘
  Card has pulsing orange border animation
```
- Credit "14h23m" in ORANGE, monospace, live updating
- Badge: [⚠ EXPIRING] with pulse animation
- Card border: pulsing orange `animation: expPulse 3s`
- Left accent bar: orange

#### State 5: Grace Period
```
┌──────────────────────────────────────────────────────┐
│▎CSN-045  [GRACE] [RTO]              Ahmad Rizki      │
│▎                                      0d     🟢 On   │
└──────────────────────────────────────────────────────┘
  Card left accent bar: amber
```
- Credit "0d" in RED
- Badge: [GRACE] in amber
- In expanded view: grace countdown timer

#### State 6: Immobilized
```
┌──────────────────────────────────────────────────────┐
│▎CSN-045  [IMMOBILIZED] [RTO]         Ahmad Rizki     │
│▎                                      0d     🔴 Off  │
└──────────────────────────────────────────────────────┘
  Card left accent bar: red
```
- Credit "0d" in RED
- Badge: [IMMOBILIZED] in red, may pulse
- Often shows offline (bike parked/locked)

#### State 7: Holiday Pause
```
┌──────────────────────────────────────────────────────┐
│ ▎CSN-045  [PAUSED] [RTO] [⏸]        Ahmad Rizki     │
│ ▎                                   ❄️8d     🟢 On   │
└──────────────────────────────────────────────────────┘
  Card left accent bar: blue
```
- Credit "❄️8d" in BLUE with snowflake — indicates frozen
- Badge: [PAUSED] in blue
- Small [⏸] icon badge

#### State 8: Contract Complete
```
┌──────────────────────────────────────────────────────┐
│ ▎CSN-045  [COMPLETE ✓] [RTO]        Ahmad Rizki     │
│ ▎                                    ✅      🟢 On   │
└──────────────────────────────────────────────────────┘
  Card left accent bar: gold/green
```
- Credit shows ✅ checkmark instead of number
- Badge: [COMPLETE ✓] in green/gold

#### State 9: Pending First Payment
```
┌──────────────────────────────────────────────────────┐
│ ▎CSN-045  [PENDING] [RTO]           Ahmad Rizki      │
│ ▎                                     0d     ⚪ New   │
└──────────────────────────────────────────────────────┘
  Card left accent bar: purple
```
- Credit "0d" in purple
- Badge: [PENDING] in purple

---

### LEVEL 2: Expanded Card — Credit Detail Block

When admin expands a vehicle card, the **credit detail block** shows the full picture. This block appears inside the expanded card area.

#### Expanded: Active Healthy
```
┌─────────────────────────────────────────────┐
│  CREDITS                          RATE      │
│  18 days               Rp 50,000/d         │
│  ████████████████░░░░░░░░  18/21 days       │
│  Grace: 7d              4/12 cycles         │
└─────────────────────────────────────────────┘
```
Green progress bar. Simple, no urgency.

#### Expanded: Expiring (<24h)
```
┌─────────────────────────────────────────────┐
│  ⚠ EXPIRING — GRACE STARTS IN              │ Orange header
│  14 h : 23 m : 45 s                        │ LIVE ticking, orange
│                                              │ Seconds flash when <6h
└─────────────────────────────────────────────┘
```
Existing pattern from v6 — keep the `expDigFull` countdown format.

#### Expanded: Grace Period
```
┌─────────────────────────────────────────────┐
│  ⚡ GRACE — IMMOBILIZE IN                    │ Amber header
│  05d : 12h : 34m : 07s                      │ LIVE ticking countdown
│  ████████████░░░░░░░░░  (grace bar)          │ Draining amber → red
│  Grace: 5d 12h remaining of 7 days          │
└─────────────────────────────────────────────┘
```
Existing pattern from v6 — keep the `cdDig` countdown format with the draining progress bar. Bar uses `animation: barPulse 2.5s ease-in-out infinite`.

#### Expanded: Immobilized
```
┌─────────────────────────────────────────────┐
│  ● IMMOBILIZED — AWAITING PAYMENT            │ Red header
│  🔴 pulsing red dot                          │ Red pulsing dot
│  Locked since: 15 Jun 2025 (5 days)         │ Duration counting UP
│  Late fees: Rp 25,000                        │
│  Reactivation fee: Rp 50,000                │
│  Total to unlock: Rp 125,000 (fees + 1 day) │
└─────────────────────────────────────────────┘
```
Uses existing `ibi` (immobilized block indicator) pattern with pulsing dot.

#### Expanded: Holiday
```
┌─────────────────────────────────────────────┐
│  ⏸ HOLIDAY — MUDIK                          │ Blue header
│  20 Jun 2025 → 4 Jul 2025 (14d)            │ Date range
│  Credits frozen: 8 days                      │
│  Resumes in: 12 days                         │
└─────────────────────────────────────────────┘
```
Uses existing paused block pattern.

#### Expanded: Contract Complete
```
┌─────────────────────────────────────────────┐
│  🎉 CONTRACT COMPLETE                        │ Green/gold header
│  ████████████████████████ 100%               │ Full green bar
│  Total paid: Rp 27,000,000                   │
│  Completed: 20 Jun 2025 (18 months)          │
│  Action: BPKB transfer pending               │
└─────────────────────────────────────────────┘
```

---

### LEVEL 3: Admin Action Buttons (per state)

The expanded card shows different action buttons depending on credit state:

| State | Button 1 | Button 2 | Button 3 | Button 4 |
|-------|----------|----------|----------|----------|
| Active Healthy | 💰 Credit (green) | 🖐️ Holiday (blue) | 🔒 Lock (red) | 📱 WA (teal) |
| Active Low | 💰 Credit (green) | 🖐️ Holiday (blue) | 🔒 Lock (red) | 📱 WA (teal) |
| Active Critical | 💰 Credit (green, emphasized) | 🖐️ Holiday (blue) | 🔒 Lock (red) | 📱 WA (teal) |
| Expiring | 💰 Credit (ORANGE, pulsing) | 🖐️ Holiday (blue) | 🔒 Lock (red) | 📱 WA (teal) |
| Grace | 💰 Credit (AMBER, urgent) | — | 🔒 Lock Now (red) | 📱 WA (teal) |
| Immobilized | 🔓 Unlock (green) | — | — | 📱 WA (teal) |
| Holiday | 💰 Credit (green) | ▶️ Resume (blue) | — | 📱 WA (teal) |
| Complete | 📋 Transfer BPKB | — | — | 📱 WA (teal) |
| Pending | 💰 First Payment | — | — | 📱 WA (teal) |

---

## DATA MODEL FOR CREDIT VISUALIZATION

Every vehicle needs these fields to render all 9 states:

```javascript
{
  // Core credit data
  creditDays: 18.5,            // Float — current credits in days (can be fractional)
  creditExpiryISO: "2025-07-08T14:30:00+07:00", // Exact expiry datetime
  dailyRate: 50000,            // Rp per day
  
  // Cycle tracking
  lastPaymentDays: 21,         // Days in last payment cycle
  paidCycles: 4,               // Number of completed payment cycles
  totalCycles: 12,             // Expected total cycles
  
  // Grace
  graceExpiryISO: null,        // Set when credits hit 0, counts from that moment
  gracePeriodDays: 7,          // From program rules
  
  // Immobilization
  immobilizedSince: null,      // ISO date when bike was locked
  lateFeePerDay: 5000,         // Rp late fee per day
  reactivationFee: 50000,      // Rp one-time unlock fee
  maxOverdueDays: 30,          // Days before repossession
  
  // Holiday
  holiday: null,               // { start, end, reason, status, frozenCredits }
  
  // Contract progress (RTO)
  contractStartDate: "2025-01-15",
  contractEndDate: "2026-07-15",
  contractTotalValue: 27000000,
  totalPaid: 11400000,
  contractComplete: false,
  
  // Derived state (calculated)
  creditState: "active_healthy", // One of the 9 states
  // "active_healthy", "active_low", "active_critical", "expiring",
  // "grace", "immobilized", "holiday", "complete", "pending"
}
```

### State Calculation Logic
```javascript
function getCreditState(vehicle) {
  if (vehicle.contractComplete) return "complete";
  if (vehicle.holiday && vehicle.holiday.status === "approved") return "holiday";
  if (vehicle.immobilizedSince) return "immobilized";
  if (vehicle.graceExpiryISO && vehicle.creditDays <= 0) return "grace";
  if (vehicle.creditDays <= 0 && !vehicle.graceExpiryISO) return "pending";
  
  // Active states — based on remaining time
  const hoursLeft = vehicle.creditDays * 24;
  if (hoursLeft < 24) return "expiring";       // Less than 24 hours
  if (vehicle.creditDays < 3) return "active_critical";  // 1-3 days
  if (vehicle.creditDays < 7) return "active_low";       // 3-7 days
  return "active_healthy";                                // 7+ days
}
```

---

## DEMO DATA — Generate 100 Vehicles with This Distribution

| State | Count | Credit Range | Notes |
|-------|-------|-------------|-------|
| active_healthy | 40 | 7-30 days | Variety of credit levels |
| active_low | 12 | 3-7 days | Mix of 3d, 4d, 5d, 6d |
| active_critical | 8 | 1-3 days | Some at exactly 1d 0h, others 2d 15h |
| expiring | 8 | 0.5h — 23h | Spread across hours, LIVE TICKING |
| grace | 15 | 0 credits, grace 1-7d remaining | Mix of early/mid/late grace |
| immobilized | 10 | 0 credits, grace expired | Locked 1-25 days |
| holiday | 5 | Frozen 3-15d credits | Various reasons: mudik, medical, vacation |
| complete | 1 | N/A | Show celebration state |
| pending | 1 | 0 credits, new rider | Just enrolled |

---

## REAL-TIME BEHAVIOR

1. **Credits count down in real-time on both rider app and admin dashboard**
   - Active states: update display every 60 seconds (show days + hours)
   - Expiring state: update every 1 second (show HH:MM:SS ticking)
   - Grace state: update every 1 second (show DD:HH:MM:SS ticking)

2. **State transitions happen automatically**
   - When expiring countdown hits 0 → state changes to grace, grace countdown starts
   - When grace countdown hits 0 → state changes to immobilized
   - When holiday end date is reached → state changes back to previous active state

3. **Color transitions are animated**
   - When credit drops from 7d to 6d 23h 59m: green smoothly transitions to amber
   - When credit drops from 24h to 23h 59m: amber transitions to orange
   - Use CSS transitions on color properties: `transition: color 0.5s ease`

4. **Admin dashboard: Vehicle cards re-sort when state changes**
   - Immobilized cards bubble to top
   - Grace cards above active
   - Expiring cards sort by urgency

---

## RESPONSIVE BEHAVIOR

### Rider App
- Designed mobile-first (360px - 428px width range)
- Portrait only
- Touch targets minimum 48px
- Font sizes: credit number 64-72px, labels 14-16px, body 12-14px
- Single column layout always

### Admin Dashboard
- Desktop: credit display in compact card row (existing layout)
- Tablet: same as desktop but with stacked layout
- Mobile (<768px): credit block takes full width, stacks vertically
- Credit countdowns must be readable at all breakpoints

---

## BUILD AS TWO HTML FILES

1. `casan-rider-credits.html` — The rider web app view (mobile-first, all 9 states)
2. `casan-admin-credits.html` — The admin dashboard credit visualization (all 9 states, integrated into fleet card pattern)

Both should be fully self-contained single HTML files with inline CSS and JS. Use IBM Plex Mono for all numeric displays. Include the real-time countdown ticking for expiring and grace states.

For the rider app, include a **state switcher** at the bottom (hidden behind a small "🔧 Demo" button) that lets the viewer cycle through all 9 states to see each visualization. This is for demo/testing purposes only.

For the admin dashboard, generate 100 vehicles distributed across all states so the viewer can scroll through and see every state represented in the fleet list.

---

## END OF PROMPT
