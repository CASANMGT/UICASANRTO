import { useMemo, useState } from 'react'
import { extendVehicleCredits, getVehicles, lockVehicle, releaseVehicle } from '../bridge/legacyRuntime'
import { useLegacyTick } from '../hooks/useLegacyTick'

function scoreTone(score) {
  const value = Number(score || 0)
  if (value >= 80) return { bg: 'var(--dg1)', color: 'var(--dg)' }
  if (value >= 60) return { bg: 'var(--dac1)', color: 'var(--dac)' }
  if (value >= 41) return { bg: 'var(--dw1)', color: 'var(--dw)' }
  if (value >= 21) return { bg: 'rgba(251,146,60,0.18)', color: '#FB923C' }
  return { bg: 'var(--dd1)', color: 'var(--dd)' }
}

function vehicleStatusTone(status) {
  if (status === 'active') return { bg: 'var(--dg1)', color: 'var(--dg)', label: 'ACTIVE' }
  if (status === 'grace') return { bg: 'var(--dw1)', color: 'var(--dw)', label: 'GRACE' }
  if (status === 'immobilized') return { bg: 'var(--dd1)', color: 'var(--dd)', label: 'IMMOBILIZED' }
  if (status === 'paused') return { bg: 'var(--dac1)', color: 'var(--dac)', label: 'PAUSED' }
  if (status === 'available') return { bg: 'var(--s3)', color: 'var(--t2)', label: 'AVAILABLE' }
  return { bg: 'var(--s3)', color: 'var(--t2)', label: String(status || '-').toUpperCase() }
}

export function VehiclesView() {
  const tick = useLegacyTick()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const vehicles = useMemo(
    () => {
      void tick
      return getVehicles({ search, status, sortBy: 'id', sortDir: 'asc' })
    },
    [search, status, tick],
  )
  const totalPages = Math.max(1, Math.ceil(vehicles.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = vehicles.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const statusPills = ['all', 'active', 'grace', 'immobilized', 'paused', 'available']

  return (
    <section className="vl-container">
      <div className="vl-header">
        <h2 className="vl-title">Assets Management</h2>
        <div className="vl-count">{vehicles.length} Units</div>
      </div>

      <div className="vl-controls">
        <input
          className="vl-search"
          placeholder="Search id, plate, customer..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <div className="vl-filter-pills">
          {statusPills.map((s) => (
            <button
              key={s}
              type="button"
              className={`vl-pill ${status === s ? 'active' : ''}`}
              onClick={() => {
                setStatus(s)
                setPage(1)
              }}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <table className="vl-table">
        <thead>
          <tr>
            <th>VEHICLE</th>
            <th>RIDER</th>
            <th>STATUS</th>
            <th>PROGRAM</th>
            <th>CREDIT</th>
            <th>PROGRESS</th>
            <th>STNK</th>
            <th>GPS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.length > 0 ? (
            pageRows.map((v) => (
              <tr key={v.id}>
                <td>
                  <div style={{ fontWeight: 700 }}>{v.id}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>{v.plate}</div>
                </td>
                <td>
                  <div>{v.customer || '-'}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>{v.phone || ''}</div>
                </td>
                <td>
                  <span
                    className="vl-status"
                    style={{
                      background: vehicleStatusTone(v.status).bg,
                      color: vehicleStatusTone(v.status).color,
                    }}
                  >
                    {vehicleStatusTone(v.status).label}
                  </span>
                </td>
                <td>{v.programType || '-'}</td>
                <td>{v.credits || 0}d</td>
                <td>
                  {v.programType === 'RTO' ? (
                    <span
                      className="vl-status"
                      style={{
                        background: scoreTone(Math.min(100, Math.max(0, 100 - (v.credits || 0)))).bg,
                        color: scoreTone(Math.min(100, Math.max(0, 100 - (v.credits || 0)))).color,
                      }}
                    >
                      {Math.min(100, Math.max(0, 100 - (v.credits || 0)))}%
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td>OK</td>
                <td>{v.isOnline ? 'On' : 'Off'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="vl-pill" type="button" onClick={() => lockVehicle(v.id)}>
                      Lock
                    </button>
                    <button className="vl-pill" type="button" onClick={() => releaseVehicle(v.id)}>
                      Release
                    </button>
                    <button className="vl-pill" type="button" onClick={() => extendVehicleCredits(v.id, 1)}>
                      +1 Day
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={9} style={{ padding: 24, textAlign: 'center', color: 'var(--t3)' }}>
                No vehicles found for current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="vl-pagination">
        <div className="vl-page-info">
          Page {currentPage} / {totalPages} ({vehicles.length} rows)
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="vl-page-btn"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, Math.min(currentPage, p) - 1))}
          >
            Prev
          </button>
          <button
            className="vl-page-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, Math.min(currentPage, p) + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  )
}
