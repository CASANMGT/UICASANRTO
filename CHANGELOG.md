# Changelog

All notable changes to the **CASAN RTO** project will be documented in this file.

## [1.4.0] - 2026-02-23

### Added
- **RTO Application Management:** Consolidated multiple RTO tabs into a unified "Application" view with a sidebar navigation for Applications, Pickup Schedule, Score Config, and WA Templates.
- **Interactive WhatsApp Preview:** Implemented a new "WA Driver" mechanism featuring an editable preview modal before redirection to WhatsApp Web.
- **Variable Injection:** Added automated parsing for `{nama}`, `{app_id}`, `{program}`, `{score}`, `{dealer}`, and `{missing_docs}` into message templates.
- **Persistence Engine:** Added `localStorage` support for persisting custom Score Configurations and WhatsApp Template overrides.

### Changed
- **Navigation UX:** Streamlined the top navigation bar by grouping operational RTO workflows into a dedicated sub-navigation sidebar.

### Fixed
- **Dashboard Layout:** Resolved critical flexbox gap issues where RTO sub-views were pushed to the bottom of the viewport.
- **Template Rendering:** Fixed JS string literal issues that caused Score Config controls to render as raw code strings.

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
