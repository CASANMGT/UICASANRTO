# CASAN RTO — Product Roadmap

This document outlines the strategic direction and planned features for the CASAN RTO Fleet Management Dashboard.

## 🏁 Current Status
The dashboard is currently a **High-Fidelity Prototype (SPA)** running with generated mock data in `store.js`.

---

## 🗺️ Execution Phases

### **Phase 1: Feature Completion & UX Hardening** (Short Term)
Focus on completing the core operator workflow and stabilizing the UI.

- [ ] **Program List View:** Implementation of full terms, pricing models, grace period rules, and holiday settings.
- [ ] **Partner/Dealer Management:** Dedicated tab for GPS partners and OEM dealers with banking details and contract status.
- [ ] **Fleet Detail Modals:** Enhanced views for battery SOV, vehicle lifecycle, and digitized documentation (STNK/BPKB).
- [ ] **Advanced Alerting:** Real-time push notifications for low battery, GPS offline, and credit expiry.

### **Phase 2: Data Independence & Real-time Sync** (Mid Term)
Transition from mock data to a resilient backend architecture.

- [ ] **Supabase/Firebase Integration:** Replace `store.js` mock logic with real-time database listeners.
- [ ] **Auth & RBAC:** Implement Role-Based Access Control (Admin, Operator, Read-only).
- [ ] **IoT Ingestion Layer:** Connector for live GPS and Charger data streams via MQTT/WebSockets.
- [ ] **API Documentation:** Formalizing the interface between the dashboard and the hardware units.

### **Phase 3: Observability & Scale (The "Grafana/Prometheus" Layer)** (Long Term)
Integrating industrial-grade monitoring for fleet and system health.

- [ ] **Prometheus Integration:** 
  - Deploy exporters to track system uptime, API latency, and IoT message throughput.                                   qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
  - Track fleet-wide KPIs (In-service vs. Out-of-service) as time-series data.
- [ ] **Grafana Dashboard Embedding:**
  - Create high-resolution operational dashboards in Grafana.
  - Embed Grafana panels directly into the **Analytics** tab for deep-dive technical troubleshooting.
- [ ] **Industrial Alerting:** Use Grafana Alerting / Prometheus Alertmanager for critical infrastructure failures (e.g., Station downtime).
- [ ] **Predictive Maintenance:** Machine learning models for battery degradation based on historical data.

---

## 📡 Observability Architecture
To support **Grafana** and **Prometheus**, we will adopt the following stack:

- **Metrics Collection:** Custom Node.js/Go service scraping IoT device status and DB metrics.
- **Storage:** Prometheus (Time-series) + ClickHouse (Log/Event-based).
- **Visualization:** Grafana (Operational UI) + Custom Dashboard (Operator UI).

---

## 📊 Recommended Metrics & Analytics

To ensure high availability and operational excellence, the following metrics are recommended for the **Main Dashboard Analytics** page.

### 🔋 1. Fleet Health Metrics
- **Battery State of Health (SoH) Distribution:** Track how many vehicles are above/below 80% battery capacity.
- **Downtime Rate:** Percentage of fleet "Offline" or "Immobilized" over a rolling 30-day window.
- **GPS Accuracy Drift:** Monitoring for devices reporting coordinates with a high variance (>20m) while stationary.
- **Hardware Temperature:** Monitoring for overheating in battery or station chargers.

### 🚦 2. Operational Performance
- **Active Utilization %:** Ratio of vehicles "Running" vs. "Stopped" during peak operational hours.
- **Collection Success Rate:** % of riders completing payments within the 24h grace period.
- **RTO Completion Projections:** Predictive timeline for when riders will finish their hire-purchase agreements.
- **Territory Density:** Heatmap of fleet concentration to identify demand vs. supply gaps.

### 🛠️ 3. Technical Reliability (Prometheus/Grafana Focus)
- **IoT Message Latency:** Time taken for a GPS ping to reflect in the dashboard (target: <2s).
- **API Error Rates:** Frequency of failed requests to the backend (4xx/5xx).
- **SIM Data Usage Consumption:** Alerting for devices exceeding 90% of their monthly data quota.
- **Station Throughput:** Usage rates of charging sockets and successful vs. failed charge session starts.

### 🛡️ 4. Risk & Compliance
- **NIK Validation Failures:** Track % of KYC submissions rejected.
- **Unauthorized Movement Alerts:** Instances of vehicles moving while "Immobilized."
- **STNK/Tax Expiry Pipeline:** 90-day forward-look at documents requiring renewal.
