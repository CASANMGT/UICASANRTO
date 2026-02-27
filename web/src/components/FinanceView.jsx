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
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-300" htmlFor="programFilter">
          Program
        </label>
        <select
          id="programFilter"
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={programFilter}
          onChange={(e) => onProgramChange(e.target.value)}
        >
          <option value="all">All Programs</option>
          {data.programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <Card label="Revenue" value={formatCurrency(data.stats.revenue)} />
        <Card label="Partner Share" value={formatCurrency(data.stats.partner)} />
        <Card label="CASAN Share" value={formatCurrency(data.stats.casan)} />
        <Card label="Outstanding" value={formatCurrency(data.stats.outstanding)} />
      </div>
      <div className="overflow-hidden rounded border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-slate-300">
            <tr>
              <th className="px-3 py-2">TX ID</th>
              <th className="px-3 py-2">Vehicle</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((tx) => (
              <tr key={tx.id + tx.date} className="border-t border-slate-800">
                <td className="px-3 py-2">{tx.id}</td>
                <td className="px-3 py-2">{tx.vehicleId}</td>
                <td className="px-3 py-2">{new Date(tx.date).toLocaleString('id-ID')}</td>
                <td className="px-3 py-2">{formatCurrency(tx.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between rounded border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-300">
        <span>
          Page {currentPage} / {totalPages} ({data.transactions.length} rows)
        </span>
        <div className="flex gap-2">
          <button
            className="rounded bg-slate-700 px-2 py-1 disabled:opacity-40"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, Math.min(currentPage, p) - 1))}
          >
            Prev
          </button>
          <button
            className="rounded bg-slate-700 px-2 py-1 disabled:opacity-40"
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

function Card({ label, value }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900/60 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-100">{value}</div>
    </div>
  )
}
