import { useMemo, useState } from 'react'
import { getPrograms, getState } from '../bridge/legacyRuntime'
import { useLegacyTick } from '../hooks/useLegacyTick'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { FilterBar, DataPanel, PageFooter, PageHeader, PageMeta, PageShell, PageTitle, StatCard, StatsGrid } from './ui/page'
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
  if (status === 'available') return { tone: 'bg-slate-100 text-slate-700', label: 'AVAILABLE' }
  return { tone: 'bg-slate-100 text-slate-700', label: String(status || '-').toUpperCase() }
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

      <DataPanel>
        <Table density="legacy" className="min-w-[860px]">
          <TableHeader tone="legacy">
            <TableRow tone="legacy">
              <TableHead>RENTER</TableHead>
              <TableHead>PROGRAM</TableHead>
              <TableHead>VEHICLE</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead>PHONE</TableHead>
              <TableHead>NIK</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {pageRows.length > 0 ? (
            pageRows.map(({ vehicle, user, matchedProgram }) => (
              <TableRow key={`renter-${vehicle.id}`} tone="legacy">
                <TableCell>
                  <div className="font-bold text-slate-900">{vehicle.customer || user?.name || 'Unknown'}</div>
                  <div className="font-mono text-xs text-slate-500">
                    {vehicle.userId || user?.userId || ''}
                  </div>
                  <div className="mt-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${scoreTone(user?.riskScore)}`}>
                      SCORE {user?.riskScore ?? '-'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>{matchedProgram?.shortName || matchedProgram?.name || '-'}</div>
                  <div className="text-xs text-slate-500">{vehicle.programId || '-'}</div>
                </TableCell>
                <TableCell>
                  <div className="font-bold text-slate-900">{vehicle.id}</div>
                  <div className="text-xs text-slate-500">{vehicle.plate || '-'}</div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${vehicleStatusTone(vehicle.status).tone}`}>
                    {vehicleStatusTone(vehicle.status).label}
                  </span>
                </TableCell>
                <TableCell>{user?.phone || vehicle.phone || '-'}</TableCell>
                <TableCell>{user?.nik || '-'}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow tone="legacy">
              <TableCell colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                No renters found for selected filters.
              </TableCell>
            </TableRow>
          )}
          </TableBody>
        </Table>
      </DataPanel>

      <PageFooter>
        <div className="text-sm font-semibold text-slate-600">
          Page {currentPage} / {totalPages} ({renters.length} rows)
        </div>
        <div className="flex gap-2">
          <Button
            variant="legacyGhost"
            size="legacy"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <Button
            variant="legacyGhost"
            size="legacy"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </PageFooter>
    </PageShell>
  )
}
