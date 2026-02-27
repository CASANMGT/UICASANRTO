import { useEffect, useMemo, useState } from 'react'
import { decideRtoApplication, getRtoSnapshot, saveRtoConfigs, scheduleRtoPickup } from '../bridge/legacyRuntime'
import { useLegacyTick } from '../hooks/useLegacyTick'

const UI_KEY = 'casan_rto_ui'

export function RtoView() {
  useLegacyTick()
  const snapshot = getRtoSnapshot()
  const initialUi = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(UI_KEY) || '{}')
    } catch {
      return {}
    }
  }, [])
  const [tab, setTab] = useState(initialUi.tab || 'applications')
  const [scoreJson, setScoreJson] = useState(JSON.stringify(snapshot.scoreCfg || {}, null, 2))
  const [waJson, setWaJson] = useState(JSON.stringify(snapshot.waCfg || {}, null, 2))
  const [appFilter, setAppFilter] = useState(initialUi.appFilter || 'all')
  const [appSearch, setAppSearch] = useState(initialUi.appSearch || '')
  const [appPage, setAppPage] = useState(initialUi.appPage || 1)
  const [pickupPage, setPickupPage] = useState(initialUi.pickupPage || 1)
  const pageSize = 10
  const [message, setMessage] = useState('')
  const filteredApps = useMemo(() => {
    let list = [...(snapshot.apps || [])]
    if (appFilter !== 'all') list = list.filter((app) => app.decision === appFilter)
    if (appSearch.trim()) {
      const q = appSearch.toLowerCase()
      list = list.filter(
        (app) =>
          app.id.toLowerCase().includes(q) ||
          (app.userName || '').toLowerCase().includes(q) ||
          (app.programId || '').toLowerCase().includes(q),
      )
    }
    return list
  }, [snapshot.apps, appFilter, appSearch])
  const pickup = snapshot.pickup || []
  const appTotalPages = Math.max(1, Math.ceil(filteredApps.length / pageSize))
  const pickupTotalPages = Math.max(1, Math.ceil(pickup.length / pageSize))
  const currentAppPage = Math.min(appPage, appTotalPages)
  const currentPickupPage = Math.min(pickupPage, pickupTotalPages)
  const appRows = filteredApps.slice((currentAppPage - 1) * pageSize, currentAppPage * pageSize)
  const pickupRows = pickup.slice((currentPickupPage - 1) * pageSize, currentPickupPage * pageSize)

  useEffect(() => {
    localStorage.setItem(
      UI_KEY,
      JSON.stringify({ tab, appFilter, appSearch, appPage: currentAppPage, pickupPage: currentPickupPage }),
    )
  }, [tab, appFilter, appSearch, currentAppPage, currentPickupPage])

  const save = () => {
    let score = null
    let wa = null
    try {
      score = JSON.parse(scoreJson)
      wa = JSON.parse(waJson)
    } catch {
      setMessage('Invalid JSON. Fix format before saving.')
      return
    }
    if (!score || !wa) {
      setMessage('Invalid JSON. Fix format before saving.')
      return
    }
    saveRtoConfigs(score, wa)
    setMessage('RTO config saved to compatibility keys.')
  }

  const onDecision = (id, decision) => {
    decideRtoApplication(id, decision)
  }

  const onSchedule = (id) => {
    const value = window.prompt('Pickup date (YYYY-MM-DD)', new Date().toISOString().slice(0, 10))
    if (!value) return
    const iso = new Date(`${value}T08:00:00`).toISOString()
    scheduleRtoPickup(id, iso)
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-2 rounded border border-slate-800 bg-slate-900/50 p-2 md:grid-cols-4">
        {['applications', 'pickup', 'score', 'wa'].map((key) => (
          <button
            key={key}
            className={`rounded px-3 py-2 text-sm capitalize ${tab === key ? 'bg-cyan-500 text-black' : 'bg-slate-800'}`}
            onClick={() => setTab(key)}
          >
            {key}
          </button>
        ))}
      </div>

      {tab === 'applications' && (
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-4">
            <input
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              placeholder="Search app, applicant, program..."
              value={appSearch}
              onChange={(e) => {
                setAppSearch(e.target.value)
                setAppPage(1)
              }}
            />
            <select
              className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              value={appFilter}
              onChange={(e) => {
                setAppFilter(e.target.value)
                setAppPage(1)
              }}
            >
              <option value="all">All Decisions</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
            </select>
          </div>
          <div className="overflow-hidden rounded border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-slate-300">
              <tr>
                <th className="px-3 py-2">App</th>
                <th className="px-3 py-2">Applicant</th>
                <th className="px-3 py-2">Program</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Decision</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appRows.map((app) => (
                <tr key={app.id} className="border-t border-slate-800">
                  <td className="px-3 py-2">{app.id}</td>
                  <td className="px-3 py-2">{app.userName}</td>
                  <td className="px-3 py-2">{app.programId}</td>
                  <td className="px-3 py-2">{app.score}</td>
                  <td className="px-3 py-2 uppercase">{app.decision}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button className="rounded bg-emerald-600 px-2 py-1 text-xs" onClick={() => onDecision(app.id, 'approved')}>
                        Approve
                      </button>
                      <button className="rounded bg-red-600 px-2 py-1 text-xs" onClick={() => onDecision(app.id, 'declined')}>
                        Decline
                      </button>
                      <button className="rounded bg-slate-700 px-2 py-1 text-xs" onClick={() => onDecision(app.id, 'pending')}>
                        Pending
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          <div className="flex items-center justify-between rounded border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-300">
            <span>
              Page {currentAppPage} / {appTotalPages} ({filteredApps.length} apps)
            </span>
            <div className="flex gap-2">
              <button
                className="rounded bg-slate-700 px-2 py-1 disabled:opacity-40"
                disabled={currentAppPage <= 1}
                onClick={() => setAppPage((p) => Math.max(1, Math.min(currentAppPage, p) - 1))}
              >
                Prev
              </button>
              <button
                className="rounded bg-slate-700 px-2 py-1 disabled:opacity-40"
                disabled={currentAppPage >= appTotalPages}
                onClick={() => setAppPage((p) => Math.min(appTotalPages, Math.min(currentAppPage, p) + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'pickup' && (
        <div className="space-y-3">
          <div className="overflow-hidden rounded border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-slate-300">
              <tr>
                <th className="px-3 py-2">App</th>
                <th className="px-3 py-2">Applicant</th>
                <th className="px-3 py-2">Vehicle</th>
                <th className="px-3 py-2">Pickup Date</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pickupRows.map((app) => (
                <tr key={app.id} className="border-t border-slate-800">
                  <td className="px-3 py-2">{app.id}</td>
                  <td className="px-3 py-2">{app.userName}</td>
                  <td className="px-3 py-2">{app.assignedVehicleId || '-'}</td>
                  <td className="px-3 py-2">{app.pickupDate ? new Date(app.pickupDate).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="px-3 py-2">
                    <button className="rounded bg-slate-700 px-2 py-1 text-xs" onClick={() => onSchedule(app.id)}>
                      Schedule
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          <div className="flex items-center justify-between rounded border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-300">
            <span>
              Page {currentPickupPage} / {pickupTotalPages} ({pickup.length} pickups)
            </span>
            <div className="flex gap-2">
              <button
                className="rounded bg-slate-700 px-2 py-1 disabled:opacity-40"
                disabled={currentPickupPage <= 1}
                onClick={() => setPickupPage((p) => Math.max(1, Math.min(currentPickupPage, p) - 1))}
              >
                Prev
              </button>
              <button
                className="rounded bg-slate-700 px-2 py-1 disabled:opacity-40"
                disabled={currentPickupPage >= pickupTotalPages}
                onClick={() => setPickupPage((p) => Math.min(pickupTotalPages, Math.min(currentPickupPage, p) + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {(tab === 'score' || tab === 'wa') && (
        <>
          <p className="text-sm text-slate-300">
            This migration-safe RTO panel preserves legacy keys while writing a versioned payload.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Score Config</h3>
              <textarea
                className="h-72 w-full rounded border border-slate-700 bg-slate-900 p-3 font-mono text-xs"
                value={scoreJson}
                onChange={(e) => setScoreJson(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">WA Templates</h3>
              <textarea
                className="h-72 w-full rounded border border-slate-700 bg-slate-900 p-3 font-mono text-xs"
                value={waJson}
                onChange={(e) => setWaJson(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="rounded bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400"
              onClick={save}
            >
              Save Compatibility Config
            </button>
            <span className="text-xs text-slate-300">{message}</span>
          </div>
        </>
      )}
    </section>
  )
}
