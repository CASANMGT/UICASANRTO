import { useMemo, useState } from 'react'
import { getFinanceSnapshot } from '../bridge/legacyRuntime'
import { usePagination } from '../context/PaginationContext'
import { useLegacyTick } from '../hooks/useLegacyTick'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { DataPanel, FilterBar, PAGE_SIZE, PageFooter, PageHeader, PageMeta, PageShell, PageTitle, StatCard, StatsGrid, TABLE_MIN_WIDTH, PaginationInfo } from './ui/page'
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
  const [page, setPage] = usePagination('finance')
  const pageSize = PAGE_SIZE
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
          <div className="text-sm text-muted-foreground">Revenue streams and transaction history</div>
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
          <label htmlFor="programFilter" className="text-sm text-muted-foreground">
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

      <DataPanel className="flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="m-0 text-base font-bold text-foreground">Recent Transactions</h3>
          <span className="text-sm text-muted-foreground">{data.transactions.length} records</span>
        </div>
        <div className="flex-1 overflow-auto">
          <Table density="legacy" className={TABLE_MIN_WIDTH}>
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
                      <div className="text-xs text-muted-foreground">{formatTxDate(tx.date ?? tx.transactionDate ?? tx.createdAt ?? tx.paidAt)}</div>
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
                      <div className="text-xs text-muted-foreground">{tx.transactionTypeLabel}</div>
                    </TableCell>
                    <TableCell>
                      <div>{tx.customer || '-'}</div>
                      <div className="text-xs text-muted-foreground">{tx.customerPhone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono font-semibold text-foreground">{formatCurrency(tx.amount)}</div>
                      <div className="text-xs text-muted-foreground">{tx.method || '-'}</div>
                    </TableCell>
                    <TableCell className="font-semibold text-cyan-700">{formatCurrency(tx.casanShare || 0)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          (tx.status || '').toLowerCase() === 'paid'
                            ? 'success'
                            : (tx.status || '').toLowerCase() === 'failed'
                              ? 'danger'
                              : (tx.status || '').toLowerCase() === 'pending'
                                ? 'warning'
                                : 'neutral'
                        }
                      >
                        {(tx.status || '-').toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow tone="legacy">
                  <TableCell colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No transactions for selected filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DataPanel>

      <PageFooter>
        <Button
          variant="legacyGhost"
          size="legacy"
          disabled={currentPage <= 1}
          onClick={() => setPage((p) => Math.max(1, Math.min(currentPage, p) - 1))}
        >
          Prev
        </Button>
        <PaginationInfo currentPage={currentPage} totalPages={totalPages} totalItems={data.transactions.length} itemName="rows" />
        <Button
          variant="legacyGhost"
          size="legacy"
          disabled={currentPage >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, Math.min(currentPage, p) + 1))}
        >
          Next
        </Button>
      </PageFooter>
    </PageShell>
  )
}
