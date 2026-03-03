import { useMemo, useState } from 'react'
import { featureFlags } from './config/featureFlags'
import { setGlobalFilter } from './bridge/legacyRuntime'
import { useLegacyRuntime } from './hooks/useLegacyRuntime'
import { Select } from './components/ui/select'
import { FinanceView } from './components/FinanceView'
import { GpsView } from './components/GpsView'
import { MapView } from './components/MapView'
import { ProgramsView } from './components/ProgramsView'
import { RentersView } from './components/RentersView'
import { RtoView } from './components/RtoView'
import { UsersView } from './components/UsersView'
import { VehiclesView } from './components/VehiclesView'

const NAV_ITEMS = [
  { key: 'users', label: 'Users', icon: '👤' },
  { key: 'programs', label: 'Programs', icon: '⚙️' },
  { key: 'rto', label: 'Applications', icon: '📋' },
  { key: 'renters', label: 'Renters', icon: '🤝' },
  { key: 'finance', label: 'Finance', icon: '💰' },
  { key: 'vehicles', label: 'Vehicle', icon: '🏍️' },
  { key: 'map', label: 'Maps', icon: '🗺️' },
  { key: 'gps', label: 'GPS', icon: '📡' },
]
const CHANGELOG_ITEMS = [
  { version: 'v2.9.0', date: '2026-02-28', notes: ['Maps list row click now zooms to marker', 'Removed Focus Vehicle panel in map view', 'Handover checklist guardrails and inline popup validation'] },
  { version: 'v2.6.0', date: '2026-02-28', notes: ['Map movement list with enriched telemetry', 'GPS assignment + SIM filters', 'Sidebar + mobile drawer navigation'] },
  { version: 'v2.5.0', date: '2026-02-28', notes: ['Applications review workflow with WA templates', 'Program vehicle/renter lists + commission editing', 'Cross-tab badge and pagination consistency'] },
]

function App() {
  const { ready, state, error } = useLegacyRuntime()
  const [activeTab, setActiveTab] = useState('users')
  const [partner, setPartner] = useState('all')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const counts = useMemo(
    () => ({
      users: state.users?.length || 0,
      renters: (state.vehicles || []).filter((vehicle) => vehicle.customer || vehicle.userId).length,
      vehicles: state.vehicles?.length || 0,
      finance: state.transactions?.length || 0,
      programs: state.programs?.length || 0,
      gps: state.gpsDevices?.length || 0,
      map: state.vehicles?.length || 0,
      rto: state.rtoApplications?.length || 0,
    }),
    [state],
  )

  return (
    <main className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div
        className={`app-sidebar-overlay ${mobileNavOpen ? 'open' : ''}`}
        onClick={() => setMobileNavOpen(false)}
      />
      <aside className={`app-sidebar ${mobileNavOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="app-sidebar-header">
          <div className="app-sidebar-title-wrap">
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 800 }}>CASAN Operations</div>
            <div style={{ fontSize: 'var(--text-base)', color: 'var(--t3)' }}>RTO & Rental</div>
            <details className="mt-3">
              <summary className="cursor-pointer font-bold text-base" style={{ fontSize: 'var(--text-base)' }}>📘 Changelog</summary>
              <div className="mt-3 flex flex-col gap-3">
                {CHANGELOG_ITEMS.map((item) => (
                  <div key={item.version} className="card p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div style={{ fontWeight: 800, fontSize: 'var(--text-base)' }}>{item.version}</div>
                      <div style={{ fontSize: 'var(--text-base)', color: 'var(--t3)' }}>{item.date}</div>
                    </div>
                    <ul className="m-0 list-inside list-disc pl-5">
                      {item.notes.map((note) => (
                        <li key={`${item.version}-${note}`} className="mb-1.5" style={{ color: 'var(--t2)', fontSize: 'var(--text-base)' }}>
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          </div>
          <button className="app-collapse-btn" type="button" onClick={() => setSidebarCollapsed((prev) => !prev)}>
            {sidebarCollapsed ? '▶' : '◀'}
          </button>
        </div>
        <nav className="app-sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`app-nav-item ${activeTab === item.key ? 'active' : ''}`}
              title={item.label}
              onClick={() => {
                setActiveTab(item.key)
                setMobileNavOpen(false)
              }}
            >
              <span className="app-nav-icon">{item.icon}</span>
              <span className="app-nav-label">{item.label}</span>
              <span className="app-nav-count">{counts[item.key] || 0}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="app-main">
        <header className="card app-topbar">
          <div className="flex items-center gap-3">
            <button className="app-menu-btn" type="button" onClick={() => setMobileNavOpen((prev) => !prev)}>
              ☰
            </button>
            <h1 className="m-0 font-extrabold" style={{ fontSize: 'var(--text-base)' }}>{NAV_ITEMS.find((item) => item.key === activeTab)?.label}</h1>
          </div>
          <div className="flex items-center gap-3">
            {!ready && !error && <span style={{ fontSize: 'var(--text-base)', color: 'var(--dw)' }}>Loading...</span>}
            {!!error && <span style={{ fontSize: 'var(--text-base)', color: 'var(--dd)' }}>{error}</span>}
            <label style={{ fontSize: 'var(--text-base)', color: 'var(--t2)' }} htmlFor="partnerFilter">
              Partner
            </label>
            <Select
              id="partnerFilter"
              className="w-[180px]"
              value={partner}
              onChange={(e) => {
                const value = e.target.value
                setPartner(value)
                setGlobalFilter({ partner: value, program: 'all' })
              }}
            >
              <option value="all">All Partners</option>
              <option value="tangkas">Tangkas</option>
              <option value="maka">Maka</option>
              <option value="united">United</option>
            </Select>
          </div>
        </header>
        <section className="card min-w-0 flex-1 p-5">
          {activeTab === 'users' && (featureFlags.usersReact ? <UsersView /> : <LegacyPlaceholder tab="users" />)}
          {activeTab === 'renters' && (featureFlags.rentersReact ? <RentersView /> : <LegacyPlaceholder tab="renters" />)}
          {activeTab === 'vehicles' &&
            (featureFlags.vehiclesReact ? <VehiclesView /> : <LegacyPlaceholder tab="vehicles" />)}
          {activeTab === 'finance' &&
            (featureFlags.financeReact ? <FinanceView /> : <LegacyPlaceholder tab="finance" />)}
          {activeTab === 'programs' &&
            (featureFlags.programsReact ? <ProgramsView /> : <LegacyPlaceholder tab="programs" />)}
          {activeTab === 'gps' && (featureFlags.gpsReact ? <GpsView /> : <LegacyPlaceholder tab="gps" />)}
          {activeTab === 'map' && (featureFlags.mapReact ? <MapView /> : <LegacyPlaceholder tab="map" />)}
          {activeTab === 'rto' && (featureFlags.rtoReact ? <RtoView /> : <LegacyPlaceholder tab="rto" />)}
        </section>
      </div>
    </main>
  )
}

function LegacyPlaceholder({ tab }) {
  return (
    <div className="card" style={{ padding: 18, fontSize: 'var(--text-base)', color: 'var(--t2)' }}>
      Legacy fallback enabled for <span style={{ fontWeight: 800, color: 'var(--t1)' }}>{tab}</span>. Keep this flag off
      until parity checks pass.
    </div>
  )
}

export default App
