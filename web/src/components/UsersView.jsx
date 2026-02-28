import { useMemo, useState } from 'react'
import { getPrograms, getUsers } from '../bridge/legacyRuntime'
import { useLegacyTick } from '../hooks/useLegacyTick'

function scoreTone(score) {
  const value = Number(score || 0)
  if (value >= 80) return { bg: 'var(--dg1)', color: 'var(--dg)' }
  if (value >= 60) return { bg: 'var(--dac1)', color: 'var(--dac)' }
  if (value >= 41) return { bg: 'var(--dw1)', color: 'var(--dw)' }
  if (value >= 21) return { bg: 'rgba(251,146,60,0.18)', color: '#FB923C' }
  return { bg: 'var(--dd1)', color: 'var(--dd)' }
}

export function UsersView() {
  const tick = useLegacyTick()
  const [search, setSearch] = useState('')
  const [risk, setRisk] = useState('all')
  const [program, setProgram] = useState('all')
  const [sortBy, setSortBy] = useState('joinDate')
  const [sortDir, setSortDir] = useState('desc')
  const programs = useMemo(() => {
    void tick
    return getPrograms()
  }, [tick])

  const users = useMemo(
    () => {
      void tick
      return getUsers({ search, risk, program, sortBy, sortDir })
    },
    [search, risk, program, sortBy, sortDir, tick],
  )
  const countsByProgram = useMemo(() => {
    void tick
    const entries = programs.map((p) => [p.id, getUsers({ program: p.id }).length])
    return Object.fromEntries(entries)
  }, [programs, tick])

  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(users.length / pageSize))
  const [page, setPage] = useState(1)
  const currentPage = Math.min(page, totalPages)
  const pageRows = users.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <section className="vl-container">
      <div className="vl-header">
        <div>
          <h2 className="vl-title">Rider KYC & Profiles</h2>
          <div style={{ fontSize: 'var(--text-md)', color: 'var(--t3)', marginTop: 2 }}>Operational Behavioral Auditing</div>
        </div>
        <div className="vl-count">{users.length} Riders Displayed</div>
      </div>

      <div className="fns" style={{ marginBottom: 20 }}>
        <div
          className={`pc ${program === 'all' ? 'active' : ''}`}
          style={{ cursor: 'pointer', borderLeft: '4px solid var(--t3)' }}
          onClick={() => {
            setProgram('all')
            setPage(1)
          }}
        >
          <h4 style={{ margin: '0 0 8px' }}>
            All Programs <span style={{ fontSize: 'var(--text-sm)', opacity: 0.7, background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>GLOBAL</span>
          </h4>
          <div style={{ fontSize: 'var(--text-5xl)', fontWeight: 700, fontFamily: "'IBM Plex Mono'" }}>{users.length}</div>
        </div>
        {programs.map((p) => (
          <div
            key={p.id}
            className={`pc ${program === p.id ? 'active' : ''}`}
            style={{ cursor: 'pointer' }}
          onClick={() => {
            setProgram(p.id)
            setPage(1)
          }}
          >
            <h4 style={{ margin: '0 0 8px' }}>{p.shortName || p.name}</h4>
            <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, fontFamily: "'IBM Plex Mono'" }}>
            {countsByProgram[p.id] || 0}
            </div>
          </div>
        ))}
      </div>

      <div className="vl-controls" style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8 }}>
        <input className="vl-search" placeholder="Search name, phone, NIK..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        <select className="form-control" value={risk} onChange={(e) => { setRisk(e.target.value); setPage(1) }}>
          <option value="all">All Risk</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <select className="form-control" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="joinDate">Join Date</option>
          <option value="name">Name</option>
          <option value="riskScore">Risk Score</option>
          <option value="totalPaid">Total Paid</option>
        </select>
        <select className="form-control" value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>

      <table className="vl-table">
        <thead>
          <tr>
            <th>USER</th>
            <th>PROGRAM</th>
            <th>PROGRESS</th>
            <th style={{ textAlign: 'center' }}>COLLECTION AUDIT</th>
            <th>RISK SCORE</th>
            <th>VEHICLE</th>
            <th>CONTACT</th>
            <th>JOINED</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.length > 0 ? (
            pageRows.map((user) => (
              <tr key={user.userId}>
                <td>
                  <div style={{ fontWeight: 700 }}>{user.name}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>{user.userId}</div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(user.vehicleIds || []).map((id) => (
                      <span key={`${user.userId}-${id}`} className="vl-pill" style={{ fontSize: 'var(--text-sm)', padding: '2px 6px' }}>
                        {id}
                      </span>
                    ))}
                  </div>
                </td>
                <td>{(user.vehicleIds || []).length > 0 ? <span>{Math.min(100, user.riskScore)}%</span> : <span style={{ color: 'var(--t3)' }}>—</span>}</td>
                <td style={{ textAlign: 'center' }}>
                  <span className="vl-pill" style={{ fontSize: 'var(--text-sm)', padding: '2px 6px' }}>
                    {Math.max(0, user.missedPayments || 0)}
                  </span>
                </td>
                <td>
                  <span
                    className="vl-status"
                    style={{
                      background: scoreTone(user.riskScore).bg,
                      color: scoreTone(user.riskScore).color,
                    }}
                  >
                    {user.riskLabel} ({user.riskScore})
                  </span>
                </td>
                <td>{user.vehicleIds?.[0] || '-'}</td>
                <td>
                  <div>{user.phone}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>NIK: {user.nik || '-'}</div>
                </td>
                <td>{new Date(user.joinDate).toLocaleDateString('id-ID')}</td>
                <td>
                  <button className="vl-pill" type="button">
                    Profile
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={9} style={{ padding: 24, textAlign: 'center', color: 'var(--t3)' }}>
                No users found for current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="vl-pagination">
        <button className="vl-page-btn" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Prev
        </button>
        <div className="vl-page-info">Page {currentPage} of {totalPages}</div>
        <button className="vl-page-btn" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
          Next
        </button>
      </div>
    </section>
  )
}
