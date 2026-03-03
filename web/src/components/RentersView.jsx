import { useMemo, useState } from 'react'
import { getPrograms, getState } from '../bridge/legacyRuntime'
import { useLegacyTick } from '../hooks/useLegacyTick'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { FilterBar, DataPanel, PAGE_SIZE, PageFooter, PageHeader, PageMeta, PageShell, PageTitle, StatCard, StatsGrid, TABLE_MIN_WIDTH } from './ui/page'
import { Select } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

function scoreTone(score) {
  const value = Number(score || 0)
  if (value >= 80) return 'bg-emerald-100 text-emerald-700'
  if (value >= 60) return 'bg-cyan-100 text-cyan-700'
  if (value >= 41) return 'bg-amber-100 text-amber-700'
  if (value >= 21) return 'bg-orange-100 text-orange-700'
  return 'bg-rose-100 text-rose-700'
}

function vehicleStatusTone(status) {
  if (status === 'active') return { tone: 'bg-emerald-100 text-emerald-700', label: 'ACTIVE' }
  if (status === 'grace') return { tone: 'bg-amber-100 text-amber-700', label: 'GRACE' }
  if (status === 'immobilized') return { tone: 'bg-rose-100 text-rose-700', label: 'IMMOBILIZED' }
  if (status === 'paused') return { tone: 'bg-cyan-100 text-cyan-700', label: 'PAUSED' }
  if (status === 'available') return { tone: 'bg-muted text-foreground', label: 'AVAILABLE' }
  return { tone: 'bg-muted text-foreground', label: String(status || '-').toUpperCase() }
}

export function RentersView() {
  const tick = useLegacyTick()
  const [search, setSearch] = useState('')
  const [program, setProgram] = useState('all')
  const [status, setStatus] = useState('all')
  const [renterTab, setRenterTab] = useState('all')
  const [page, setPage] = useState(1)

  const programs = useMemo(() => {
    void tick
    return getPrograms()
  }, [tick])

  const renters = useMemo(() => {
    void tick
    const state = getState()
    const usersById = new Map((state.users || []).map((user) => [user.userId, user]))
    const txByVehicleId = (state.transactions || []).reduce((map, tx) => {
      const key = String(tx.vehicleId || '').trim()
      if (!key) return map
      map[key] = map[key] || []
      map[key].push(tx)
      return map
    }, {})
    let list = (state.vehicles || [])
      .filter((vehicle) => (vehicle.customer || vehicle.userId) && vehicle.handoverCompleted !== false)
      .map((vehicle) => {
        const user =
          (vehicle.userId && usersById.get(vehicle.userId)) ||
          (state.users || []).find((item) => (item.name || '').toLowerCase() === (vehicle.customer || '').toLowerCase()) ||
          null
        const matchedProgram = (state.programs || []).find((item) => item.id === vehicle.programId)
        const userTx = txByVehicleId[vehicle.id] || []
        const failedTxCount = userTx.filter((tx) => String(tx.status || '').toLowerCase() === 'failed').length
        const missedPayments = Number(user?.missedPayments || 0)
        const estimatedGraceCount = Math.max(0, missedPayments + (vehicle.status === 'grace' ? 1 : 0))
        const estimatedImmobilizedCount = Math.max(0, failedTxCount + (vehicle.status === 'immobilized' ? 1 : 0))
        const movementState = Number(vehicle.speed || 0) > 0 ? 'RUNNING' : 'STOPPED'
        return { vehicle, user, matchedProgram, estimatedGraceCount, estimatedImmobilizedCount, movementState }
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
    if (renterTab === 'online') list = list.filter((item) => item.vehicle.isOnline)
    if (renterTab === 'offline') list = list.filter((item) => !item.vehicle.isOnline)
    if (renterTab === 'running') list = list.filter((item) => item.movementState === 'RUNNING')
    if (renterTab === 'stopped') list = list.filter((item) => item.movementState === 'STOPPED')
    if (renterTab === 'grace_only') list = list.filter((item) => item.vehicle.status === 'grace')
    if (renterTab === 'immobilized_only') list = list.filter((item) => item.vehicle.status === 'immobilized')
    return list
  }, [tick, program, status, search, renterTab])
  const renterTabCounts = useMemo(() => {
    const state = getState()
    const list = (state.vehicles || []).filter((vehicle) => vehicle.customer || vehicle.userId)
    return {
      all: list.length,
      online: list.filter((v) => v.isOnline).length,
      offline: list.filter((v) => !v.isOnline).length,
      running: list.filter((v) => Number(v.speed || 0) > 0).length,
      stopped: list.filter((v) => Number(v.speed || 0) <= 0).length,
      grace_only: list.filter((v) => v.status === 'grace').length,
      immobilized_only: list.filter((v) => v.status === 'immobilized').length,
    }
  }, [tick])
  const pageSize = PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(renters.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = renters.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const statusStats = useMemo(() => {
    const counts = { total: renters.length, active: 0, grace: 0, immobilized: 0 }
    for (const item of renters) {
      if (item.vehicle.status === 'active') counts.active += 1
      if (item.vehicle.status === 'grace') counts.grace += 1
      if (item.vehicle.status === 'immobilized') counts.immobilized += 1
    }
    return counts
  }, [renters])

  return (
    <PageShell>
      <PageHeader>
        <PageTitle>Renters List</PageTitle>
        <PageMeta>{renters.length} Renters</PageMeta>
      </PageHeader>
      <StatsGrid>
        <StatCard label="Total Renters" value={statusStats.total} />
        <StatCard label="Active" value={statusStats.active} valueClassName="text-emerald-700" />
        <StatCard label="Grace" value={statusStats.grace} valueClassName="text-amber-700" />
        <StatCard label="Immobilized" value={statusStats.immobilized} valueClassName="text-rose-700" />
      </StatsGrid>

      <FilterBar>
        <Input
          variant="legacy"
          placeholder="Search renter, vehicle, phone, NIK..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <Select
          variant="legacy"
          value={program}
          onChange={(e) => {
            setProgram(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All Programs</option>
          {programs.map((item) => (
            <option key={item.id} value={item.id}>
              {`${item.name || item.shortName || item.id} • ${item.type || '-'}`}
            </option>
          ))}
        </Select>
        <Select
          variant="legacy"
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
        </Select>
      </FilterBar>
      <div className="mb-3 flex flex-wrap gap-2">
        {[
          ['all', 'All'],
          ['online', 'Online'],
          ['offline', 'Offline'],
          ['running', 'Running'],
          ['stopped', 'Stopped'],
          ['grace_only', 'Grace'],
          ['immobilized_only', 'Immobilized'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              renterTab === id
                ? 'border-indigo-600 bg-indigo-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.22)]'
                : 'border-input bg-background text-foreground hover:bg-accent'
            }`}
            onClick={() => {
              setRenterTab(id)
              setPage(1)
            }}
          >
            {label} ({renterTabCounts[id] || 0})
          </button>
        ))}
      </div>

      <DataPanel>
        <Table density="legacy" className={TABLE_MIN_WIDTH}>
          <TableHeader tone="legacy">
            <TableRow tone="legacy">
              <TableHead>RENTER</TableHead>
              <TableHead>PROGRAM</TableHead>
              <TableHead>VEHICLE</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead>CONNECTIVITY</TableHead>
              <TableHead>MOVEMENT</TableHead>
              <TableHead>RISK FACTORS</TableHead>
              <TableHead>PHONE</TableHead>
              <TableHead>NIK</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {pageRows.length > 0 ? (
            pageRows.map(({ vehicle, user, matchedProgram, movementState, estimatedGraceCount, estimatedImmobilizedCount }) => (
              <TableRow key={`renter-${vehicle.id}`} tone="legacy">
                <TableCell>
                  <div className="font-bold text-foreground">{vehicle.customer || user?.name || 'Unknown'}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {vehicle.userId || user?.userId || ''}
                  </div>
                  <div className="mt-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${scoreTone(user?.riskScore)}`}>
                      SCORE {user?.riskScore ?? '-'}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">Risk relates to grace + immobilized frequency.</div>
                </TableCell>
                <TableCell>
                  <div>{matchedProgram?.shortName || matchedProgram?.name || '-'}</div>
                  <div className="text-xs text-muted-foreground">{vehicle.programId || '-'}</div>
                </TableCell>
                <TableCell>
                  <div className="font-bold text-foreground">{vehicle.id}</div>
                  <div className="text-xs text-muted-foreground">{vehicle.plate || '-'}</div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${vehicleStatusTone(vehicle.status).tone}`}>
                    {vehicleStatusTone(vehicle.status).label}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${vehicle.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-foreground'}`}>
                    {vehicle.isOnline ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${movementState === 'RUNNING' ? 'bg-cyan-100 text-cyan-700' : 'bg-muted text-foreground'}`}>
                    {movementState}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="text-xs text-muted-foreground">Grace: {estimatedGraceCount}x</div>
                  <div className="text-xs text-muted-foreground">Immobilized: {estimatedImmobilizedCount}x</div>
                </TableCell>
                <TableCell>{user?.phone || vehicle.phone || '-'}</TableCell>
                <TableCell>{user?.nik || '-'}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow tone="legacy">
              <TableCell colSpan={9} className="px-6 py-8 text-center text-sm text-muted-foreground">
                No renters found. Only handover-completed renters are shown.
              </TableCell>
            </TableRow>
          )}
          </TableBody>
        </Table>
      </DataPanel>

      <PageFooter>
        <Button
          variant="legacyGhost"
          size="legacy"
          disabled={currentPage <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </Button>
        <div className="text-sm font-semibold text-muted-foreground">
          Page {currentPage} of {totalPages} ({renters.length} rows)
        </div>
        <Button
          variant="legacyGhost"
          size="legacy"
          disabled={currentPage >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </Button>
      </PageFooter>
    </PageShell>
  )
}
