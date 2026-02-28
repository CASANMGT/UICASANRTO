import { useMemo, useState } from 'react'
import { getFinanceSnapshot } from '../bridge/legacyRuntime'
import { useLegacyTick } from '../hooks/useLegacyTick'

function formatCurrency(value) {
  return `Rp ${Math.round(value || 0).toLocaleString('id-ID')}`
}

export function FinanceView() {
  const tick = useLegacyTick()
  const [programFilter, setProgramFilter] = useState('all')
  const [page, setPage] = useState(1)
  const pageSize = 25
  const data = useMemo(() => {
    void tick
    return getFinanceSnapshot(programFilter)
  }, [programFilter, tick])
  const totalPages = Math.max(1, Math.ceil(data.transactions.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = data.transactions.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const onProgramChange = (value) => {
    setProgramFilter(value)
    setPage(1)
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <h2 style={{ margin: '0 0 4px' }}>Finance Overview</h2>
          <div style={{ color: 'var(--t3)', fontSize: 'var(--text-lg)' }}>Revenue streams and transaction history</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label htmlFor="programFilter" style={{ fontSize: 'var(--text-base)', color: 'var(--t3)' }}>
            Filter by Program:
          </label>
          <select id="programFilter" className="form-control" style={{ width: 220 }} value={programFilter} onChange={(e) => onProgramChange(e.target.value)}>
            <option value="all">All Programs</option>
            {data.programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <Card label="Total Revenue" value={formatCurrency(data.stats.revenue)} color="var(--g)" sub="Gross Volume" />
        <Card label="Partner Payout" value={formatCurrency(data.stats.partner)} color="var(--p)" sub="After Fees" />
        <Card label="CASAN Fees" value={formatCurrency(data.stats.casan)} color="var(--ac)" sub="Platform Share" />
        <Card label="Outstanding" value={formatCurrency(data.stats.outstanding)} color="var(--c-danger)" sub="Potential Loss" />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--s3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Recent Transactions</h3>
          <span style={{ fontSize: 'var(--text-base)', color: 'var(--t3)' }}>{data.transactions.length} records</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-base)', minWidth: 520 }}>
            <thead style={{ background: 'var(--s2)', color: 'var(--t3)' }}>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ padding: '10px 12px' }}>TX ID</th>
                <th style={{ padding: '10px 12px' }}>DATE & TIME</th>
                <th style={{ padding: '10px 12px' }}>VEHICLE</th>
                <th style={{ padding: '10px 12px' }}>USER / PHONE</th>
                <th style={{ padding: '10px 12px' }}>PROGRAM</th>
                <th style={{ padding: '10px 12px' }}>METHOD</th>
                <th style={{ padding: '10px 12px', color: 'var(--ac)' }}>CASAN FEE</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>AMOUNT</th>
                <th style={{ padding: '10px 12px' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length > 0 ? (
                pageRows.map((tx) => (
                  <tr key={tx.id + tx.date} style={{ borderBottom: '1px solid var(--s3)' }}>
                    <td style={{ padding: '10px 12px', fontFamily: "'IBM Plex Mono'" }}>{tx.id}</td>
                    <td style={{ padding: '10px 12px' }}>{new Date(tx.date).toLocaleString('id-ID')}</td>
                    <td style={{ padding: '10px 12px' }}>{tx.vehicleId}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div>{tx.customer || '-'}</div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>{tx.customerPhone || '-'}</div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>{tx.program || tx.type || '-'}</td>
                    <td style={{ padding: '10px 12px' }}>{tx.method || '-'}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--ac)' }}>{formatCurrency(tx.casanShare || 0)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: "'IBM Plex Mono'", fontWeight: 700 }}>
                      {formatCurrency(tx.amount)}
                    </td>
                    <td style={{ padding: '10px 12px' }}>{(tx.status || '-').toUpperCase()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ padding: 24, textAlign: 'center', color: 'var(--t3)' }}>
                    No transactions for selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="vl-pagination" style={{ borderTop: '1px solid var(--s3)', marginTop: 0 }}>
        <span className="vl-page-info">
          Page {currentPage} / {totalPages} ({data.transactions.length} rows)
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="vl-page-btn" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, Math.min(currentPage, p) - 1))}>
            Prev
          </button>
          <button className="vl-page-btn" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, Math.min(currentPage, p) + 1))}>
            Next
          </button>
        </div>
      </div>
    </section>
  )
}

function Card({ label, value, color, sub }) {
  return (
    <div className="card stat-card">
      <h3>{label}</h3>
      <div className="value" style={{ color }}>
        {value}
      </div>
      <div className="sub">{sub}</div>
    </div>
  )
}
