import { useMemo, useState } from 'react'
import { getPrograms, getState } from '../bridge/legacyRuntime'
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

export function RentersView() {
  const tick = useLegacyTick()
  const [search, setSearch] = useState('')
  const [program, setProgram] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)

  const programs = useMemo(() => {
    void tick
    return getPrograms()
  }, [tick])

  const renters = useMemo(() => {
    void tick
    const state = getState()
    const usersById = new Map((state.users || []).map((user) => [user.userId, user]))
    let list = (state.vehicles || [])
      .filter((vehicle) => vehicle.customer || vehicle.userId)
      .map((vehicle) => {
        const user =
          (vehicle.userId && usersById.get(vehicle.userId)) ||
          (state.users || []).find((item) => (item.name || '').toLowerCase() === (vehicle.customer || '').toLowerCase()) ||
          null
        const matchedProgram = (state.programs || []).find((item) => item.id === vehicle.programId)
        return { vehicle, user, matchedProgram }
      })

    if (program !== 'all') list = list.filter((item) => item.vehicle.programId === program)
    if (status !== 'all') list = list.filter((item) => item.vehicle.status === status)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((item) =>
        [item.vehicle.customer, item.vehicle.id, item.vehicle.plate, item.user?.phone, item.user?.nik]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q)),
      )
    }
    return list
  }, [tick, program, status, search])
  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(renters.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = renters.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <section className="vl-container">
      <div className="vl-header">
        <h2 className="vl-title">Renters List</h2>
        <div className="vl-count">{renters.length} Renters</div>
      </div>

      <div className="vl-controls" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
        <input
          className="vl-search"
          placeholder="Search renter, vehicle, phone, NIK..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <select
          className="form-control"
          value={program}
          onChange={(e) => {
            setProgram(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All Programs</option>
          {programs.map((item) => (
            <option key={item.id} value={item.id}>
              {item.shortName || item.name}
            </option>
          ))}
        </select>
        <select
          className="form-control"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="grace">Grace</option>
          <option value="immobilized">Immobilized</option>
          <option value="paused">Paused</option>
          <option value="available">Available</option>
        </select>
      </div>

      <table className="vl-table">
        <thead>
          <tr>
            <th>RENTER</th>
            <th>PROGRAM</th>
            <th>VEHICLE</th>
            <th>STATUS</th>
            <th>PHONE</th>
            <th>NIK</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.length > 0 ? (
            pageRows.map(({ vehicle, user, matchedProgram }) => (
              <tr key={`renter-${vehicle.id}`}>
                <td>
                  <div style={{ fontWeight: 700 }}>{vehicle.customer || user?.name || 'Unknown'}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                    {vehicle.userId || user?.userId || ''}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <span
                      className="vl-status"
                      style={{
                        background: scoreTone(user?.riskScore).bg,
                        color: scoreTone(user?.riskScore).color,
                      }}
                    >
                      SCORE {user?.riskScore ?? '-'}
                    </span>
                  </div>
                </td>
                <td>
                  <div>{matchedProgram?.shortName || matchedProgram?.name || '-'}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>{vehicle.programId || '-'}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 700 }}>{vehicle.id}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>{vehicle.plate || '-'}</div>
                </td>
                <td>
                  <span
                    className="vl-status"
                    style={{
                      background: vehicleStatusTone(vehicle.status).bg,
                      color: vehicleStatusTone(vehicle.status).color,
                    }}
                  >
                    {vehicleStatusTone(vehicle.status).label}
                  </span>
                </td>
                <td>{user?.phone || vehicle.phone || '-'}</td>
                <td>{user?.nik || '-'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--t3)' }}>
                No renters found for selected filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="vl-pagination">
        <div className="vl-page-info">
          Page {currentPage} / {totalPages} ({renters.length} rows)
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="vl-page-btn" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Prev
          </button>
          <button className="vl-page-btn" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Next
          </button>
        </div>
      </div>
    </section>
  )
}
