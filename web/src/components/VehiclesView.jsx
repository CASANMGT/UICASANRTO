import { useMemo, useState } from 'react'
import { extendVehicleCredits, getVehicles, lockVehicle, releaseVehicle } from '../bridge/legacyRuntime'
import { useLegacyTick } from '../hooks/useLegacyTick'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { DataPanel, PageFooter, PageHeader, PageMeta, PageShell, PageTitle, StatCard, StatsGrid } from './ui/page'
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

export function VehiclesView() {
  const tick = useLegacyTick()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [programFilter, setProgramFilter] = useState('all')
  const [connectivity, setConnectivity] = useState('all')
  const [creditBucket, setCreditBucket] = useState('all')
  const [assignment, setAssignment] = useState('all')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const vehicles = useMemo(
    () => {
      void tick
      let list = getVehicles({ search, status, sortBy: 'id', sortDir: 'asc' })
      if (programFilter !== 'all') list = list.filter((vehicle) => String(vehicle.programType || '').toLowerCase() === programFilter)
      if (connectivity === 'online') list = list.filter((vehicle) => !!vehicle.isOnline)
      if (connectivity === 'offline') list = list.filter((vehicle) => !vehicle.isOnline)
      if (creditBucket === 'critical') list = list.filter((vehicle) => Number(vehicle.credits || 0) <= 0)
      if (creditBucket === 'warning') list = list.filter((vehicle) => {
        const credits = Number(vehicle.credits || 0)
        return credits > 0 && credits <= 3
      })
      if (creditBucket === 'ok') list = list.filter((vehicle) => Number(vehicle.credits || 0) > 3)
      if (assignment === 'assigned') list = list.filter((vehicle) => vehicle.customer || vehicle.userId)
      if (assignment === 'unassigned') list = list.filter((vehicle) => !vehicle.customer && !vehicle.userId)
      return list
    },
    [search, status, programFilter, connectivity, creditBucket, assignment, tick],
  )
  const totalPages = Math.max(1, Math.ceil(vehicles.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = vehicles.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const vehicleStats = useMemo(() => {
    const counts = { total: vehicles.length, active: 0, immobilized: 0, online: 0 }
    for (const vehicle of vehicles) {
      if (vehicle.status === 'active') counts.active += 1
      if (vehicle.status === 'immobilized') counts.immobilized += 1
      if (vehicle.isOnline) counts.online += 1
    }
    return counts
  }, [vehicles])

  const statusPills = ['all', 'active', 'grace', 'immobilized', 'paused', 'available']

  return (
    <PageShell>
      <PageHeader>
        <PageTitle>Assets Management</PageTitle>
        <PageMeta>{vehicles.length} Units</PageMeta>
      </PageHeader>
      <StatsGrid>
        <StatCard label="Total Units" value={vehicleStats.total} />
        <StatCard label="Active" value={vehicleStats.active} valueClassName="text-emerald-700" />
        <StatCard label="Immobilized" value={vehicleStats.immobilized} valueClassName="text-rose-700" />
        <StatCard label="GPS Online" value={vehicleStats.online} valueClassName="text-cyan-700" />
      </StatsGrid>

      <div className="mb-4 space-y-3">
        <Input
          variant="legacy"
          placeholder="Search id, plate, customer..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
          <Select
            variant="legacy"
            value={programFilter}
            onChange={(e) => {
              setProgramFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All Programs</option>
            <option value="rto">RTO</option>
            <option value="rental">Rental</option>
          </Select>
          <Select
            variant="legacy"
            value={connectivity}
            onChange={(e) => {
              setConnectivity(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All Connectivity</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </Select>
          <Select
            variant="legacy"
            value={creditBucket}
            onChange={(e) => {
              setCreditBucket(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All Credit Buckets</option>
            <option value="critical">Critical (&lt;= 0d)</option>
            <option value="warning">Warning (1-3d)</option>
            <option value="ok">Healthy (&gt; 3d)</option>
          </Select>
          <Select
            variant="legacy"
            value={assignment}
            onChange={(e) => {
              setAssignment(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All Assignment</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          {statusPills.map((s) => (
            <Button
              key={s}
              variant={status === s ? 'legacyPrimary' : 'legacyPill'}
              size="legacy"
              onClick={() => {
                setStatus(s)
                setPage(1)
              }}
            >
              {s.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      <DataPanel>
        <Table density="legacy" className="min-w-[960px]">
          <TableHeader tone="legacy">
            <TableRow tone="legacy">
              <TableHead>VEHICLE</TableHead>
              <TableHead>RIDER</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead>PROGRAM</TableHead>
              <TableHead>CREDIT</TableHead>
              <TableHead>ARREARS RISK</TableHead>
              <TableHead>PROGRESS</TableHead>
              <TableHead>STNK</TableHead>
              <TableHead>GPS</TableHead>
              <TableHead>LAST PING</TableHead>
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {pageRows.length > 0 ? (
            pageRows.map((v) => (
              <TableRow key={v.id} tone="legacy">
                <TableCell>
                  <div className="font-bold text-slate-900">{v.id}</div>
                  <div className="text-xs text-slate-500">{v.plate}</div>
                </TableCell>
                <TableCell>
                  <div>{v.customer || '-'}</div>
                  <div className="text-xs text-slate-500">{v.phone || ''}</div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${vehicleStatusTone(v.status).tone}`}>
                    {vehicleStatusTone(v.status).label}
                  </span>
                </TableCell>
                <TableCell>{v.programType || '-'}</TableCell>
                <TableCell>{v.credits || 0}d</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${
                      Number(v.credits || 0) <= 0 ? 'bg-rose-100 text-rose-700' : Number(v.credits || 0) <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {Number(v.credits || 0) <= 0 ? 'CRITICAL' : Number(v.credits || 0) <= 3 ? 'WARNING' : 'HEALTHY'}
                  </span>
                </TableCell>
                <TableCell>
                  {v.programType === 'RTO' ? (
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${scoreTone(Math.min(100, Math.max(0, 100 - (v.credits || 0))))}`}>
                      {Math.min(100, Math.max(0, 100 - (v.credits || 0)))}%
                    </span>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>OK</TableCell>
                <TableCell>{v.isOnline ? 'On' : 'Off'}</TableCell>
                <TableCell className="text-xs text-slate-500">
                  {v.lastPingAt ? new Date(v.lastPingAt).toLocaleString('id-ID') : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="legacyPill" size="legacy" onClick={() => lockVehicle(v.id)}>
                      Lock
                    </Button>
                    <Button variant="legacyPill" size="legacy" onClick={() => releaseVehicle(v.id)}>
                      Release
                    </Button>
                    <Button variant="legacyPill" size="legacy" onClick={() => extendVehicleCredits(v.id, 1)}>
                      +1 Day
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow tone="legacy">
              <TableCell colSpan={11} className="px-6 py-8 text-center text-sm text-slate-500">
                No vehicles found for current filters.
              </TableCell>
            </TableRow>
          )}
          </TableBody>
        </Table>
      </DataPanel>

      <PageFooter>
        <div className="text-sm font-semibold text-slate-600">
          Page {currentPage} / {totalPages} ({vehicles.length} rows)
        </div>
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
