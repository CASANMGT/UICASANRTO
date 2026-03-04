import { useMemo, useState, useEffect } from 'react'
import { featureFlags } from './config/featureFlags'
import { setGlobalFilter } from './bridge/legacyRuntime'
import { useLegacyRuntime } from './hooks/useLegacyRuntime'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog'
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
  { version: 'v3.1.0', date: '2026-03-04', notes: ['Shared form control and checkbox constants', 'ProgramsView modals use Button component', 'Unified pill action buttons (Edit, Delete, Vehicle/Renters List)', 'Consistent empty-state text size across views'] },
  { version: 'v3.0.0', date: '2026-03-04', notes: ['Province-grouped geofence (DKI Jakarta, Banten, Jawa Barat)', 'Accordion UX for Maps & Programs—expand to select kota/kab', 'Bandung area GeoJSON: Kota Cimahi, Kab. Bandung Barat, etc.', 'Stat card larger value font', 'Docs popout with close button'] },
  { version: 'v2.9.0', date: '2026-02-28', notes: ['Maps list row click now zooms to marker', 'Removed Focus Vehicle panel in map view', 'Handover checklist guardrails and inline popup validation'] },
  { version: 'v2.6.0', date: '2026-02-28', notes: ['Map movement list with enriched telemetry', 'GPS assignment + SIM filters', 'Sidebar + mobile drawer navigation'] },
  { version: 'v2.5.0', date: '2026-02-28', notes: ['Applications review workflow with WA templates', 'Program vehicle/renter lists + commission editing', 'Cross-tab badge and pagination consistency'] },
]

const APP_VERSION = CHANGELOG_ITEMS[0]?.version ?? 'v3.1.0'

function DocPanel({ path, className = '' }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  useEffect(() => {
    if (!path) return
    setLoading(true)
    setError(null)
    fetch(`/docs/${path}`)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.statusText))))
      .then(setText)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [path])
  return (
    <div className={`overflow-auto rounded-md border border-border bg-muted/30 p-3 ${className}`}>
      {loading && <div className="text-muted-foreground">Loading…</div>}
      {error && <div className="text-destructive">{error}</div>}
      {text && <pre className="whitespace-pre-wrap break-words text-base font-sans">{text}</pre>}
    </div>
  )
}

function App() {
  const { ready, state, error } = useLegacyRuntime()
  const [activeTab, setActiveTab] = useState('users')
  const [partner, setPartner] = useState('all')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [docsPopoutOpen, setDocsPopoutOpen] = useState(false)
  const [docsTab, setDocsTab] = useState('changelog')

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
            <button
              type="button"
              onClick={() => setDocsPopoutOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-sm font-semibold transition-colors hover:bg-muted"
            >
              <span>📘</span>
              <span>{APP_VERSION}</span>
            </button>
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
        <section className="card min-h-0 min-w-0 flex-1 p-5">
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

      <Dialog open={docsPopoutOpen} onOpenChange={setDocsPopoutOpen}>
        <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col p-0">
          <DialogHeader className="relative px-6 pt-6 pb-2">
            <DialogTitle>Docs & Release Notes</DialogTitle>
            <button
              type="button"
              onClick={() => setDocsPopoutOpen(false)}
              className="absolute right-4 top-4 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <span className="text-lg leading-none">×</span>
            </button>
          </DialogHeader>
          <div className="flex border-b border-border px-6">
            {[
              { key: 'changelog', label: 'Changelog', icon: '📘' },
              { key: 'readme', label: 'README', icon: '📖' },
              { key: 'roadmap', label: 'Roadmap', icon: '🗺️' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setDocsTab(t.key)}
                className={`px-4 py-2.5 text-sm font-semibold transition-colors ${
                  docsTab === t.key ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-0 overflow-auto px-6 pb-6 pt-4">
            {docsTab === 'changelog' && (
              <div className="flex flex-col gap-3">
                {CHANGELOG_ITEMS.map((item) => (
                  <div key={item.version} className="rounded-lg border border-border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-bold text-base">{item.version}</span>
                      <span className="text-sm text-muted-foreground">{item.date}</span>
                    </div>
                    <ul className="m-0 list-inside list-disc space-y-1 pl-2 text-sm text-muted-foreground">
                      {item.notes.map((note) => (
                        <li key={`${item.version}-${note}`}>{note}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {docsTab === 'readme' && <DocPanel path="README.md" className="max-h-[60vh]" />}
            {docsTab === 'roadmap' && <DocPanel path="ROADMAP.md" className="max-h-[60vh]" />}
          </div>
        </DialogContent>
      </Dialog>
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
