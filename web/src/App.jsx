import { useMemo, useState } from 'react'
import { featureFlags } from './config/featureFlags'
import { setGlobalFilter } from './bridge/legacyRuntime'
import { useLegacyRuntime } from './hooks/useLegacyRuntime'
import { FinanceView } from './components/FinanceView'
import { GpsView } from './components/GpsView'
import { MapView } from './components/MapView'
import { ProgramsView } from './components/ProgramsView'
import { RtoView } from './components/RtoView'
import { UsersView } from './components/UsersView'
import { VehiclesView } from './components/VehiclesView'

const TABS = ['users', 'vehicles', 'finance', 'programs', 'gps', 'map', 'rto']

function App() {
  const { ready, state, error } = useLegacyRuntime()
  const [activeTab, setActiveTab] = useState('users')
  const [partner, setPartner] = useState('all')

  const counts = useMemo(
    () => ({
      users: state.users?.length || 0,
      vehicles: state.vehicles?.length || 0,
      finance: state.transactions?.length || 0,
      programs: state.programs?.length || 0,
      gps: state.gpsDevices?.length || 0,
      map: state.vehicles?.length || 0,
      rto: state.programs?.length || 0,
    }),
    [state],
  )

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded border border-slate-800 bg-slate-900/60 p-4">
          <h1 className="text-xl font-semibold">CASAN RTO Migration Shell</h1>
          <p className="mt-1 text-sm text-slate-300">
            Incremental React + Vite + Tailwind migration running on top of legacy data contracts.
          </p>
          {!ready && !error && <p className="mt-2 text-xs text-amber-300">Loading legacy runtime...</p>}
          {!!error && <p className="mt-2 text-xs text-red-300">{error}</p>}
          <div className="mt-3 flex items-center gap-2">
            <label className="text-xs text-slate-300" htmlFor="partnerFilter">
              Partner
            </label>
            <select
              id="partnerFilter"
              className="rounded border border-slate-700 bg-slate-900 px-3 py-1 text-xs"
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
            </select>
          </div>
        </header>

        <nav className="grid gap-2 rounded border border-slate-800 bg-slate-900/60 p-2 md:grid-cols-7">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`rounded px-3 py-2 text-sm capitalize ${
                activeTab === tab ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-100'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab} ({counts[tab]})
            </button>
          ))}
        </nav>

        <section className="rounded border border-slate-800 bg-slate-900/60 p-4">
          <StatsContext activeTab={activeTab} state={state} />
          {activeTab === 'users' && (featureFlags.usersReact ? <UsersView /> : <LegacyPlaceholder tab="users" />)}
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

function StatsContext({ activeTab, state }) {
  const stats = useMemo(() => {
    if (activeTab === 'users') {
      const low = state.users?.filter((u) => u.riskLabel === 'Low').length || 0
      const high = state.users?.filter((u) => u.riskLabel === 'High').length || 0
      return [
        ['Users', state.users?.length || 0],
        ['Low Risk', low],
        ['High Risk', high],
      ]
    }
    if (activeTab === 'finance') {
      const paid = state.transactions?.filter((t) => t.status === 'paid').length || 0
      return [
        ['Transactions', state.transactions?.length || 0],
        ['Paid', paid],
        ['Programs', state.programs?.length || 0],
      ]
    }
    if (activeTab === 'gps') {
      const online = state.gpsDevices?.filter((d) => d.status === 'Online').length || 0
      return [
        ['GPS Total', state.gpsDevices?.length || 0],
        ['Online', online],
        ['Vehicles', state.vehicles?.length || 0],
      ]
    }
    return [
      ['Vehicles', state.vehicles?.length || 0],
      ['Programs', state.programs?.length || 0],
      ['Transactions', state.transactions?.length || 0],
    ]
  }, [activeTab, state])

  return (
    <div className="mb-4 grid gap-2 md:grid-cols-3">
      {stats.map(([label, value]) => (
        <div key={label} className="rounded border border-slate-800 bg-slate-900/40 px-3 py-2">
          <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
          <div className="text-base font-semibold text-slate-100">{value}</div>
        </div>
      ))}
    </div>
  )
}

function LegacyPlaceholder({ tab }) {
  return (
    <div className="rounded border border-dashed border-slate-700 bg-slate-900 p-6 text-sm text-slate-300">
      Legacy fallback enabled for <span className="font-semibold text-slate-100">{tab}</span>. Keep this flag off
      until parity checks pass.
    </div>
  )
}

export default App
