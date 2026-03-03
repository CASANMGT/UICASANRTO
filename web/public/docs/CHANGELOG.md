# Changelog

All notable changes to the **CASAN RTO** project will be documented in this file.

## [2.9.0] - 2026-02-28

### Maps List Interaction
- **Focus Controls Simplified:** Removed the separate `Focus Vehicle` chip panel from Maps to reduce duplicate controls.
- **Row-to-Marker Zoom:** Clicking a row in the `Vehicle Movement List` now zooms the map directly to that vehicle marker.

### Handover Workflow Hardening
- **Vehicle Reassignment Guardrail:** During handover, assigned vehicle can only be changed to units with `available` status.
- **Checklist Enforcement:** Handover completion now requires all operational checklist checks; photo upload is optional.
- **Inline Validation UX:** Handover validation errors are shown inside the popout/modal for immediate operator correction.

## [2.8.0] - 2026-02-28

### Applications Review UX
- **Single Review Path:** Consolidated duplicated actions into one clear `Review` CTA in Applications to reduce operator confusion.
- **Decision Guardrails:** Enforced inline and runtime validation for review decisions:
  - `approved` requires assigned vehicle
  - `pending_docs` requires required-doc selection
  - `rejected` requires rejection reason
- **Document Handling:** Kept thumbnail-first document review with enlarged preview modal for audit quality checks.

### Pickup Scheduling Operations
- **Pickup Lifecycle:** Added pickup status lifecycle (`planned`, `confirmed`, `rescheduled`, `completed`, `no_show`) in runtime and UI.
- **Operational Filters:** Expanded pickup board with filters for date bucket, location, slot, and pickup status.
- **Action Clarity:** Contextualized pickup actions (`Set Slot` / `Edit Slot`) and preserved approval-only scheduling rules.

### Data and Terminology Consistency
- **Canonical Decisions:** Standardized decision vocabulary to `approved`, `rejected`, `pending_docs`, `review` with backward-compatible aliasing from `declined`.
- **Triage Columns:** Added reviewer/timestamp, assigned vehicle, and pickup status context in Applications table.
- **Program Context:** Program selectors now use `Program Name • Type`, and program pickup locations are first-class defaults.

## [2.7.0] - 2026-02-28

### 🧭 Navigation & Changelog UX
- **Sidebar Changelog Surface:** Moved changelog access to the `CASAN Operations` sidebar title area so updates are visible without hunting through content panels.
- **Collapsible Sidebar Runtime:** Added desktop collapsed rail mode and responsive mobile drawer behavior with full-width content stretch.

### 📡 GPS Operations Enhancements
- **Assignment Integrity:** Enforced assignment to vehicles only, with assignment dropdown showing only vehicles without GPS bindings.
- **SIM Lifecycle Controls:** Added SIM assignment states (`With SIM` / `Unassigned SIM`), optional SIM creation/edit, and explicit unassigned SIM behavior.
- **Telemetry Density:** Expanded GPS rows with timestamp context, combined `GPS ID / Status / Last Ping` display, and enriched vehicle identity (`plate + brand + model`).

### 🗺️ Map Fleet Monitoring
- **Movement Compliance:** Immobilized vehicles now always resolve as `STOPPED` (speed forced to zero in operational views).
- **Bottom Fleet Table:** Added paginated movement list with status, movement, GPS health, program, renter phone, and last ping observability.

## [2.0.0] - 2026-02-26

### 💎 Premium Modern UI Overhaul
- **Standardized Form System:** Implemented a unified design system for all modals (Renter, Program, Manual App) using high-depth containers, bold labels, and premium `.form-control` styling.
- **Visual Depth & Glassmorphism:** Enhanced the UI with consistent use of layered backgrounds, soft borders, and refined focus states for a more professional dashboard feel.
- **Renter Profile Enhancements:** Refactored the Renter list with detailed risk audit info, progress tracking, and live GPS status indicators.

### 📋 Administrative Operations Logic
- **Manual Application Flow:** Refactored the manual onboarding process into a high-density, multi-column modal for faster data entry.
- **Admin Scheduling Assistant:** Enhanced the pickup scheduling interface in `rto.js` with an "Admin Assistant" mode, allowing operators to directly coordinate dates and times for drivers.
- **Prominent Actions:** Added a dedicated "+ New Manual App" button to the Applications tab with an optimized layout to prevent UI clipping.

### 🔧 Operational Fixes & Refinements
- **Finance Transparency:** Integrated **Commission Rate** directly into the Program Admin cards and Finance strips.
- **Terminology Consistency:** Unified the "Vehicle" (Inventory) vs "Renter" (Participant) nomenclature across all administrative helpers.
- **Scheduling Logic:** Fixed `pickSlot` interaction for administrators, enabling full pickup coordination capability.

## [1.9.1] - 2026-02-26

### 🎨 Emoji & UI Rendering Restoration
- **Programs Admin Fix:** Resolved malformed UNESCO character sequences (Mojibake) in the Programs Admin title and action buttons. 
- **Gender Icon Restoration:** Restored missing gender icons (👨 / 👩) in the identity section of expanded user profiles.
- **Delimiter Standardization:** Replaced stray "?" markers with clean "•" delimiters in program descriptions and vehicle selections for better readability.

## [1.9.0] - 2026-02-26

### 🎨 UI/UX Consistency Polish

### 📡 GPS & Map Stability
- **Syntax Integrity:** Fixed HTML syntax corruption in GPS lists and Map popups that caused rendering bugs.
- **Enhanced Observability:** Restored missing emojis and visual status indicators in the live tracker.

### 🛠️ Functional Refinements
- **Expandable Detail Panels:** Added expandable sections to User, Renter, Transaction, and Vehicle lists for deeper data access.
- **Program Management UX:** Optimized the program management interface and enhanced the Program Creation modal with concurrent scheme settings.
- **Currency Standardization:** Unified all financial data display to Indonesian Rupiah (Rp.) with proper dot-separation.

### 🔧 Core System Hardening
- **Namespace Safety:** Resolved duplicate function declarations and namespace collisions in `ui.js`.
- **Loading Optimization:** Corrected script execution order in `index.html` to resolve `ReferenceError` issues.

## [1.8.0] - 2026-02-25

### 💰 Dual-Mode Commission System
- **Commission Flexibility:** Programs now support dual commission modes: **% Percentage** (e.g., 10% of transaction) or **Rp Fixed / day** (e.g., Rp 5,000/day).
- **Program Configuration:** Added a visual toggle in the Program Settings modal to switch between commission types.
- **Finance Transparency:** Replaced "Credit Days" column in the Finance transaction table with **"CASAN FEE"**, showing the exact platform revenue share per transaction.
- **Smart Program Cards:** Finance program cards now dynamically display active commission rates (e.g., `(10%)` vs `(Rp 5.000/day)`).

### 🤝 Renters View Overhaul
- **Simplified Interface:** Removed the top KPI stats bar to reduce visual clutter and focus on the renter list.
- **Prominent Primary Action:** Added a high-visibility **"＋ Add Renter"** button to the header for manual renter onboarding.
- **Inline Operations:** Each renter row now features an **"✏ Edit"** button for direct profile updates alongside the existing vehicle audit.
- **Advanced Renter Modal:** New multi-section modal for onboarding and editing renters, featuring **Phone Uniqueness Enforcement** to prevent duplicate profile creation.

### 🎨 UX Consistency Pass
- **Standardized Headers:** Unified the header layout (Logo/Icon + Title + Action Button) across all major tabs.
- **Normalized Badge Styling:** Refined status and risk colors for better readability and a professional "one-person design" feel.
- **Clean Filter Padding:** Standardized internal margins and filter bar alignment across Users, Programs, Renters, and Finance views.

## [1.7.0] - 2026-02-25

### 🏷️ Terminology Differentiation & Documentation Audit
- **Terminology Split:** Differentiated **Vehicles** (Inventory — the physical motorcycle pool) from **Renters** (Program Participants — active riders in an RTO/Rental scheme).
- **Sidebar Rename:** "Assets" tab renamed to **"🤝 Renters"** and legacy "Vehicles" tab renamed to **"🏍️ Vehicles"** to align with the new nomenclature.
- **Page Title:** Updated to **"CASAN RTO | Vehicle & Renter Management"** for clearer product identity.
- **Logo Update:** Sidebar branding updated to **"CASAN Operations"**.
- **Version Badge:** Bumped to `v1.7.0`.
- **Documentation Audit:** Comprehensive update of `README.md`, `CHANGELOG.md`, `Skills.md`, and `ROADMAP.md` to reflect latest features and terminology.
- **In-App Changelog:** Modal updated to surface v1.7.0 as the latest release.

## [1.6.2] - 2026-02-25
### Added
- **Program Qualification Settings:** Added "Asset Eligibility" and "Minimum Salary" requirements to Program Administrative settings.
- **Modern UI Redesign:** Completely overhauled the Program Create/Edit modal with a modern, sectioned layout for better cognitive load management.
- **Enhanced Program Audit:** The Program Details drawer now includes a "Qualification Profile" summary with asset focus badges and salary benchmarks.

## [1.6.1] - 2026-02-24

### 🏗️ UI Standardization & Pagination
- **Universal Pagination:** Standardized all list views (Users, Fleet, Assets, GPS) to exactly **10 items per page** for a uniform data browsing experience.
- **Consistent UX Component:** Applied the `vl-pagination` structural pattern across all modules, ensuring unified button layouts, page indicators, and interactive states.
- **GPS List Optimization:** Reduced the GPS items-per-page from 25 to 10 to align with the application's high-density design language.
- **Header update**: updated header with user information.

## [1.6.0] - 2026-02-24

### 📂 Sidebar Reorganization & Navigation
- **Consolidated Module Hierarchy:** Reorganized the sidebar to follow a logical operational flow: *Users → Programs (Admin) → Applications → Fleet → Finance → Assets → Maps → GPS*.
- **Intuitive Nomenclature:** Renamed legacy tabs for better clarity:
    - `RTO Pipeline` → **Applications**
    - `RTO Fleet` → **Fleet**
    - `Vehicles` → **Assets**
    - `Fleet Tracking` → **Maps**
    - `GPS List` → **GPS**
    - `Programs` → **Programs (Admin)**
- **Unified Labeling:** Standardized all view headers and dynamic labels across the UI to match the new nomenclature (e.g., "Vehicle Management" → "Assets Management").

### 🔧 Critical Bug Fixes
- **Namespace Collision:** Resolved a major conflict where `ui.js` and `rto.js` were overwriting the same `window.rto` global object.
- **Reference Error Resolution:** Fixed a fatal `ReferenceError` for `elDrawerBackdrop` that caused initialization failures in certain environments.
- **Global Function Exposure:** Hardened the `app.js` entry point to ensure all required UI and logic functions are correctly exposed to the global scope.
- **Data Integrity:** Restored full data rendering and interaction across all views after resolving initialization race conditions.

## [1.5.0] - 2026-02-24

### 💎 Deep Program Management
- **Operational Metric Enrichment:** Upgraded the Program list with live breakdown stats: Active vs Grace vs Locked counts per scheme.
- **Collection & Health Scoring:** Integrated dynamic progress bars for "Collection Health" and "Fleet Maturity" averages at the program level.
- **Program Details Slide Panel:** Implemented a dedicated right-side drawer View containing operational KPIs, Promotions, and specific Program Settings.
- **Promotions Engine:** Added a functional "Add Promotion" module with support for image URLs and real-time rendering.
- **Global State Synchronization:** Hardened the "Create Program" flow to ensure new schemes immediately propagate to RTO Fleet filters across the entire app.

### 🔧 Bug Fixes & Refinements
- **Maturity Calculation:** Fixed `NaN%` display error in cases where RTO progress wasn't initialized.
- **Persistence Fix:** Resolved a bug where newly created programs failed to save to the internal state.
- **Drawer Interaction:** Improved tab navigation and state management within the program slide panel.

## [1.4.1] - 2026-02-24

### 🚀 Fleet Observability & Simulation
- **Real-time Movement Engine:** Implemented a new simulation logic that calculates vehicle position, speed, and bearing every 3 seconds.
- **Geographical Integrity:** Hardened movement boundaries to ensure vehicle markers stay on land within Greater Jakarta (Jabodetabek) and avoid "drifting" into the sea.
- **Vertical Panoramic Layout:** Transitioned Fleet Tracking to a 60/40 vertical split (Map Top / Sidebar Bottom), maximizing geographic visibility for larger fleet monitoring.
- **Operational Status Labels:** Shifted marker status reporting from generic "Online/Offline" to actionable "**Running**" (moving) and "**Stopped**" (online but stationary) labels.

### 🎨 Dashboard & UI Refinement
- **Consolidated Navigation:** Renamed "Programs" to **"RTO Fleet"** (operations) and "Program Settings" to **"Programs"** (administration) for clearer module distinction.
- **KPI Top Bar Overhaul:** Implemented context-aware KPIs for Fleet Tracking: *Total Fleet, Running, Stopped, No Signal, Risk Alerts, and Idle Assets*.
- **Status Guide Elevation:** Relocated and redesigned the **Status Guide** to the top of the fleet sidebar with an high-visibility primary header and expanded default state.
- **Improved Pagination:** Standardized the Fleet Tracking list to **10 items per page** for better information density and scrolling efficiency.
- **Available Filter:** Added the missing "Available" status filter to the fleet monitoring sidebar.
- **Sub-Nav Layout Fix:** Resolved a critical flexbox overlap issue where the global stats bar obstructed RTO sub-navigation pills.

### 🔧 System Stability
- **Data Load Integrity:** Fixed a race condition/bug that intermittently prevented mock data from populating the dashboard views.
- **Badge Readability:** Increased font size and refined padding for status capsules (ACTIVE, GRACE, IMMOBILIZED) across all tables.
- **Progress Bar Synchronization:** Unified the RTO Progress bar styling with the User KYC list for a consistent visual language.

## [1.4.0] - 2026-02-23

### 📋 RTO Application Management
- **Unified Application Suite:** Consolidated RTO tabs into a professional "Application" view with sidebar navigation (Applications, Pickup Schedule, Score Config, WA Templates).
- **Driver Communication Engine:** Implemented an interactive "WA Driver" mechanism with editable previews and automated variable injection (`{nama}`, `{app_id}`, `{score}`, etc.).
- **Interactive Programs Table:** Replaced the legacy 3-column view with a centralized administrative data table featuring full Edit/Delete actions.
- **Pickup Intelligence:** Added a calendar-based scheduling system for managing driver appointments at partner dealers.
- **Persistence Layer:** Integrated `localStorage` support for custom Risk Score configurations and WhatsApp template overrides.

## [1.3.0] - 2026-02-20

### Added
- **Station List UX Redesign:** Transitioned to a high-density card-based layout for station monitoring.
- **Hierarchical Device structure:** Stations now contain a nested list of associated devices and sockets for better organization.
- **Enhanced Finance Analytics:** Integrated summary cards for "Paid", "Pending", and "Failed" transactions to track collection health.
- **GPS Connectivity Intelligence:** Added **IMEI** and **SIM** details (carrier/usage) to the GPS list for improved hardware auditing.

### Changed
- **Map Filter UI:** Improved filter buttons with a stacked icon+label layout and distinct emoji branding.
- **Universal Program Synchronization:** Integrated the Finance program filter logic into the User and Vehicle views for cross-module consistency.

### Fixed
- **Map Interaction:** Fixed bug where marking popups failed to open after market clustering was disabled.

## [1.2.0] - 2026-02-20

### Added
- **Programs Management Module:** Full lifecycle monitoring for partner leasings schemes.
- **Collection Intelligence Popouts:** Interactive analytics for "Collection Health" and "Fleet Maturity".
- **Visual Collections Audit:** Implementation of **🔒 (Immobilization)** and **⚠️ (Grace Period)** visual status badges in program lists.
- **Data Audit Breakdown:** Transparent logic overlays showing raw calculations for all percentage-based KPIs.
- **Risk-Based Data Correlation:** Statistical linking of User Risk Labels (High/Med/Low) to historical collection behavior.
- **High-Density Stats Bar:** Expanded 6-column grid with tab-specific KPIs (KYC Pending, Success Rate, Active Alerts).
- **Universal Pagination:** Standardized 20 items per page across all dashboard tables.

### Changed
- **Executive Navigation:** Reorganized top navbar to prioritize **Users**, **Programs**, and **Finance**.
- **Default Landing:** Application now defaults to the **User Management** view for immediate KYC/Risk auditing.
- **Audit Sequence:** Reordered columns in the Program list to follow a logical "Involved Rider → Collection History → Risk Audit" flow.
- **Standardized Viewport:** Optimized all tables for 100% screen width visibility.

### Fixed
- **Rendering Bug:** Resolved critical `ReferenceError` in `renderProgramListView` related to analytics scoping.
- **Stats Synchronization:** Fixed mathematical variance between Top Bar cards and detailed popout reports.

## [1.1.0] - 2026-02-18

### Added
- **Live Fleet Map Improvements:** Directional arrow markers and status-based glowing effects.
- **Map Filter Overlay:** Multi-select emoji-based filters for movement and connectivity status.
- **Finance Module:** Revenue tracking, transaction history, and partner-share calculations.
- **Global Search (Ctrl+K):** Command palette for instant navigation.

## [1.0.0] - 2026-02-15
- **Initial Release:** Core dashboard structure with Map, Vehicle List, and Mock Data generation.
