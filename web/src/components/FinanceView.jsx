import { useMemo, useState } from 'react'
import { getFinanceSnapshot } from '../bridge/legacyRuntime'
import { useLegacyTick } from '../hooks/useLegacyTick'
import { Button } from './ui/button'
import { DataPanel, FilterBar, PageFooter, PageHeader, PageMeta, PageShell, PageTitle, StatCard, StatsGrid } from './ui/page'
import { Select } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

function formatCurrency(value) {
  return `Rp ${Math.round(value || 0).toLocaleString('id-ID')}`
}

const MONTHS_3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatTxDate(isoDate) {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return ''
  const thisYear = new Date().getFullYear()
  const y = d.getFullYear()
  const mo = MONTHS_3[d.getMonth()]
  const day = d.getDate()
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  const time = `${hours}:${mins}`
  const dateStr = y === thisYear ? `${day} ${mo}` : `${day}/${mo}/${String(y).slice(-2)}`
  return `${dateStr} ${time}`
}

export function FinanceView() {
  const tick = useLegacyTick()
  const [programFilter, setProgramFilter] = useState('all')
  const [page, setPage] = useState(1)
  const pageSize = 25
  const data = useMemo(() => {
    void tick
    const snap = getFinanceSnapshot(programFilter)
    const sorted = [...snap.transactions].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    return { ...snap, transactions: sorted }
  }, [programFilter, tick])
  const totalPages = Math.max(1, Math.ceil(data.transactions.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = data.transactions.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const onProgramChange = (value) => {
    setProgramFilter(value)
    setPage(1)
  }

  return (
    <PageShell className="flex flex-col gap-4">
      <PageHeader className="mb-1 items-center">
        <div>
          <PageTitle className="mb-1">Finance Overview</PageTitle>
          <div className="text-sm text-slate-500">Revenue streams and transaction history</div>
        </div>
        <PageMeta>{data.transactions.length} Records</PageMeta>
      </PageHeader>

      <StatsGrid>
        <StatCard label="Total Revenue" value={formatCurrency(data.stats.revenue)} valueClassName="text-emerald-600" />
        <StatCard label="Partner Payout" value={formatCurrency(data.stats.partner)} valueClassName="text-violet-600" />
        <StatCard label="CASAN Fees" value={formatCurrency(data.stats.casan)} valueClassName="text-cyan-600" />
        <StatCard label="Outstanding" value={formatCurrency(data.stats.outstanding)} valueClassName="text-rose-600" />
      </StatsGrid>

      <FilterBar className="lg:grid-cols-4">
        <div className="flex items-center gap-2 lg:col-span-2">
          <label htmlFor="programFilter" className="text-sm text-slate-500">
            Filter by Program:
          </label>
          <Select
            id="programFilter"
            variant="legacy"
            className="w-[220px]"
            value={programFilter}
            onChange={(e) => onProgramChange(e.target.value)}
          >
            <option value="all">All Programs</option>
            {data.programs.map((program) => (
              <option key={program.id} value={program.id}>
                {`${program.name || program.shortName || program.id} • ${program.type || '-'}`}
              </option>
            ))}
          </Select>
        </div>
      </FilterBar>

      <DataPanel className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="m-0 text-base font-bold text-slate-900">Recent Transactions</h3>
          <span className="text-sm text-slate-500">{data.transactions.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <Table density="legacy" className="min-w-[920px]">
            <TableHeader tone="legacy" className="text-left">
              <TableRow tone="legacy">
                <TableHead>TX ID / TX DATE & TIME</TableHead>
                <TableHead>PROGRAM</TableHead>
                <TableHead>Credit/Type</TableHead>
                <TableHead>USER / PHONE</TableHead>
                <TableHead>AMOUNT / METHOD</TableHead>
                <TableHead className="text-cyan-700">CASAN FEE</TableHead>
                <TableHead>STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length > 0 ? (
                pageRows.map((tx) => (
                  <TableRow key={tx.id + tx.date} tone="legacy">
                    <TableCell>
                      <div className="font-mono text-xs">{tx.id}</div>
                      <div className="text-xs text-slate-500">{formatTxDate(tx.date ?? tx.transactionDate ?? tx.createdAt ?? tx.paidAt)}</div>
                    </TableCell>
                    <TableCell>{tx.programLabel}</TableCell>
                    <TableCell>
                      <div>
                        <span
                          className={
                            tx.credits != null
                              ? Number(tx.credits) <= 0
                                ? 'font-semibold text-rose-600'
                                : Number(tx.credits) <= 3
                                  ? 'text-amber-600'
                                  : 'text-slate-700'
                              : 'text-slate-400'
                          }
                        >
                          {tx.credits != null ? `${tx.credits}d` : '-'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">{tx.transactionTypeLabel}</div>
                    </TableCell>
                    <TableCell>
                      <div>{tx.customer || '-'}</div>
                      <div className="text-xs text-slate-500">{tx.customerPhone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono font-semibold text-slate-900">{formatCurrency(tx.amount)}</div>
                      <div className="text-xs text-slate-500">{tx.method || '-'}</div>
                    </TableCell>
                    <TableCell className="font-semibold text-cyan-700">{formatCurrency(tx.casanShare || 0)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                          (tx.status || '').toLowerCase() === 'paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : (tx.status || '').toLowerCase() === 'failed'
                              ? 'bg-rose-100 text-rose-700'
                              : (tx.status || '').toLowerCase() === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {(tx.status || '-').toUpperCase()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow tone="legacy">
                  <TableCell colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                    No transactions for selected filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DataPanel>

      <PageFooter className="mt-1 border-t border-slate-200 pt-3">
        <span className="text-sm font-semibold text-slate-600">
          Page {currentPage} / {totalPages} ({data.transactions.length} rows)
        </span>
        <div className="flex gap-2">
          <Button
            variant="legacyGhost"
            size="legacy"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, Math.min(currentPage, p) - 1))}
          >
            Prev
          </Button>
          <Button
            variant="legacyGhost"
            size="legacy"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, Math.min(currentPage, p) + 1))}
          >
            Next
          </Button>
        </div>
      </PageFooter>
    </PageShell>
  )
}
