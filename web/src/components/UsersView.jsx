import { useMemo, useState } from 'react'
import { getPrograms, getState, getUsers } from '../bridge/legacyRuntime'
import { useLegacyTick } from '../hooks/useLegacyTick'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { DataPanel, FilterBar, PageFooter, PageHeader, PageMeta, PageShell, PageTitle, StatCard, StatsGrid } from './ui/page'
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

function toAvatarDataUrl(name = '') {
  const trimmed = String(name || '').trim()
  const initials = trimmed
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'U'
  const safeName = trimmed || 'User'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1d4ed8"/><stop offset="1" stop-color="#0284c7"/></linearGradient></defs><rect width="96" height="96" rx="48" fill="url(#g)"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff">${initials}</text><title>${safeName}</title></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function formatLastPing(value) {
  if (!value) return '-'
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return '-'
  const diffMs = Date.now() - timestamp
  const diffMin = Math.max(0, Math.floor(diffMs / 60000))
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}h ago`
  const diffDay = Math.floor(diffHour / 24)
  return `${diffDay}d ago`
}

export function UsersView() {
  const tick = useLegacyTick()
  const [search, setSearch] = useState('')
  const [risk, setRisk] = useState('all')
  const [program, setProgram] = useState('all')
  const [profileUser, setProfileUser] = useState(null)
  const programs = useMemo(() => {
    void tick
    return getPrograms()
  }, [tick])

  const users = useMemo(
    () => {
      void tick
      return getUsers({ search, risk, program, sortBy: 'joinDate', sortDir: 'desc' })
    },
    [search, risk, program, tick],
  )
  const userRows = useMemo(() => {
    void tick
    const state = getState()
    const vehiclesById = new Map((state.vehicles || []).map((vehicle) => [vehicle.id, vehicle]))
    const programsById = new Map((state.programs || []).map((item) => [item.id, item]))
    const gpsByVehicleId = new Map((state.gpsDevices || []).filter((device) => device.vehicleId).map((device) => [device.vehicleId, device]))
    const txByVehicleId = new Map()
    for (const tx of state.transactions || []) {
      if (tx.status !== 'paid' || !tx.vehicleId) continue
      txByVehicleId.set(tx.vehicleId, (txByVehicleId.get(tx.vehicleId) || 0) + 1)
    }
    return users.map((user) => {
      const linkedVehicles = (user.vehicleIds || [])
        .map((vehicleId) => vehiclesById.get(vehicleId))
        .filter(Boolean)
      const primaryVehicle = linkedVehicles[0] || null
      const linkedProgram = primaryVehicle?.programId ? programsById.get(primaryVehicle.programId) : null
      const primaryGps = primaryVehicle?.id ? gpsByVehicleId.get(primaryVehicle.id) : null
      const paidDays = linkedVehicles.reduce((sum, vehicle) => sum + (txByVehicleId.get(vehicle.id) || 0), 0)
      const totalDays = Math.max(1, Number(linkedProgram?.durationDays || 180))
      const normalizedPaidDays = Math.min(totalDays, paidDays)
      const progressPercent = Math.min(100, Math.round((normalizedPaidDays / totalDays) * 100))
      const isOnline = primaryGps ? primaryGps.status !== 'Offline' : Boolean(primaryVehicle?.isOnline)
      const movementLabel = Number(primaryVehicle?.speed || 0) > 0 ? 'Running' : 'Stopped'
      return {
        ...user,
        avatarUrl: user.avatarUrl || toAvatarDataUrl(user.name),
        programName: linkedProgram?.name || linkedProgram?.shortName || '-',
        programType: linkedProgram?.type || '-',
        paidDays: normalizedPaidDays,
        totalDays,
        progressPercent,
        primaryVehicle,
        gpsStatusLabel: isOnline ? 'Online' : 'Offline',
        gpsLastPingLabel: formatLastPing(primaryGps?.updatedAt),
        movementLabel,
      }
    })
  }, [users, tick])
  const countsByProgram = useMemo(() => {
    void tick
    const entries = programs.map((p) => [p.id, getUsers({ program: p.id }).length])
    return Object.fromEntries(entries)
  }, [programs, tick])

  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(userRows.length / pageSize))
  const [page, setPage] = useState(1)
  const currentPage = Math.min(page, totalPages)
  const pageRows = userRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const userStats = useMemo(() => {
    return {
      total: userRows.length,
      lowRisk: userRows.filter((user) => Number(user.riskScore || 0) >= 80).length,
      medRisk: userRows.filter((user) => {
        const score = Number(user.riskScore || 0)
        return score >= 60 && score < 80
      }).length,
      highRisk: userRows.filter((user) => Number(user.riskScore || 0) < 60).length,
    }
  }, [userRows])

  return (
    <PageShell>
      <PageHeader>
        <div>
          <PageTitle>Rider KYC & Profiles</PageTitle>
          <div className="mt-0.5 text-sm text-slate-500">Operational Behavioral Auditing</div>
        </div>
        <PageMeta>{userRows.length} Riders Displayed</PageMeta>
      </PageHeader>
      <StatsGrid>
        <StatCard label="Total Riders" value={userStats.total} />
        <StatCard label="Low Risk" value={userStats.lowRisk} valueClassName="text-emerald-700" />
        <StatCard label="Medium Risk" value={userStats.medRisk} valueClassName="text-amber-700" />
        <StatCard label="High Risk" value={userStats.highRisk} valueClassName="text-rose-700" />
      </StatsGrid>

      <FilterBar className="lg:grid-cols-3">
        <Input
          variant="legacy"
          placeholder="Search name, phone, NIK..."
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
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {`${p.name || p.shortName || p.id} • ${p.type || '-'}`} ({countsByProgram[p.id] || 0})
            </option>
          ))}
        </Select>
        <Select
          variant="legacy"
          value={risk}
          onChange={(e) => {
            setRisk(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All Risk</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </Select>
      </FilterBar>

      <DataPanel>
        <Table density="legacy" className="min-w-[900px]">
          <TableHeader tone="legacy">
            <TableRow tone="legacy">
              <TableHead>USER</TableHead>
              <TableHead>PROGRAM NAME</TableHead>
              <TableHead>PROGRESS</TableHead>
              <TableHead className="text-center">COLLECTION AUDIT</TableHead>
              <TableHead>RISK SCORE</TableHead>
              <TableHead>VEHICLE</TableHead>
              <TableHead>GPS STATUS</TableHead>
              <TableHead>JOINED PROGRAM</TableHead>
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {pageRows.length > 0 ? (
            pageRows.map((user) => (
              <TableRow key={user.userId} tone="legacy">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <img
                      src={user.avatarUrl}
                      alt={`${user.name} avatar`}
                      className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200"
                      loading="lazy"
                    />
                    <div>
                      <div className="font-bold text-slate-900">{user.name}</div>
                      <div className="text-xs text-slate-500">{user.userId}</div>
                      <div className="text-xs text-slate-500">{user.phone || '-'}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-slate-800">{user.programName}</div>
                  <div className="text-xs text-slate-500">{user.programType}</div>
                </TableCell>
                <TableCell>
                  <div className="min-w-[180px]">
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>{user.paidDays} paid days</span>
                      <span>{user.totalDays} total</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${user.progressPercent}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{user.progressPercent}% complete</div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {Math.max(0, user.missedPayments || 0)}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${scoreTone(user.riskScore)}`}
                  >
                    {user.riskLabel} ({user.riskScore})
                  </span>
                </TableCell>
                <TableCell>
                  {user.primaryVehicle ? (
                    <div>
                      <div className="font-semibold text-slate-800">
                        {[user.primaryVehicle.brand, user.primaryVehicle.model].filter(Boolean).join(' ')}
                      </div>
                      <div className="text-xs text-slate-500">No Pol: {user.primaryVehicle.plate || '-'}</div>
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          user.gpsStatusLabel === 'Online' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {user.gpsStatusLabel}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          user.movementLabel === 'Running' ? 'bg-cyan-100 text-cyan-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {user.movementLabel}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">Last ping: {user.gpsLastPingLabel}</div>
                  </div>
                </TableCell>
                <TableCell>{new Date(user.joinDate).toLocaleDateString('id-ID')}</TableCell>
                <TableCell>
                  <Button variant="legacyPill" size="legacy" type="button" onClick={() => setProfileUser(user)}>
                    Profile
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow tone="legacy">
              <TableCell colSpan={9} className="px-6 py-8 text-center text-sm text-slate-500">
                No users found for current filters.
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
        <div className="text-sm font-semibold text-slate-600">
          Page {currentPage} of {totalPages}
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
      <Dialog open={!!profileUser} onOpenChange={(open) => !open && setProfileUser(null)}>
        <DialogContent tone="legacy">
          <DialogHeader>
            <DialogTitle>{profileUser?.name || 'Rider Profile'}</DialogTitle>
            <DialogDescription>Operational profile snapshot</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 text-sm text-slate-700">
            <div className="mb-2 flex items-center gap-3">
              <img
                src={profileUser?.avatarUrl || toAvatarDataUrl(profileUser?.name)}
                alt={`${profileUser?.name || 'User'} avatar`}
                className="h-14 w-14 rounded-full object-cover ring-1 ring-slate-200"
              />
              <div>
                <div className="text-sm font-semibold text-slate-900">{profileUser?.name || '-'}</div>
                <div className="text-xs text-slate-500">{profileUser?.userId || '-'}</div>
              </div>
            </div>
            <div>
              <strong>User ID:</strong> {profileUser?.userId || '-'}
            </div>
            <div>
              <strong>Phone:</strong> {profileUser?.phone || '-'}
            </div>
            <div>
              <strong>NIK:</strong> {profileUser?.nik || '-'}
            </div>
            <div>
              <strong>Risk:</strong> {profileUser?.riskLabel || '-'} ({profileUser?.riskScore ?? '-'})
            </div>
            <div>
              <strong>Vehicles:</strong> {(profileUser?.vehicleIds || []).join(', ') || '-'}
            </div>
            <div>
              <strong>Joined:</strong>{' '}
              {profileUser?.joinDate ? new Date(profileUser.joinDate).toLocaleDateString('id-ID') : '-'}
            </div>
          </div>
          <DialogFooter>
            <Button variant="legacyGhost" onClick={() => setProfileUser(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
