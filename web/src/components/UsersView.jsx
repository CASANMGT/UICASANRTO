import { useMemo, useState } from 'react'
import { getPrograms, getUsers } from '../bridge/legacyRuntime'
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

export function UsersView() {
  const tick = useLegacyTick()
  const [search, setSearch] = useState('')
  const [risk, setRisk] = useState('all')
  const [program, setProgram] = useState('all')
  const [sortBy, setSortBy] = useState('joinDate')
  const [sortDir, setSortDir] = useState('desc')
  const [profileUser, setProfileUser] = useState(null)
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
  const userStats = useMemo(() => {
    return {
      total: users.length,
      lowRisk: users.filter((user) => Number(user.riskScore || 0) >= 80).length,
      medRisk: users.filter((user) => {
        const score = Number(user.riskScore || 0)
        return score >= 60 && score < 80
      }).length,
      highRisk: users.filter((user) => Number(user.riskScore || 0) < 60).length,
    }
  }, [users])

  return (
    <PageShell>
      <PageHeader>
        <div>
          <PageTitle>Rider KYC & Profiles</PageTitle>
          <div className="mt-0.5 text-sm text-slate-500">Operational Behavioral Auditing</div>
        </div>
        <PageMeta>{users.length} Riders Displayed</PageMeta>
      </PageHeader>
      <StatsGrid>
        <StatCard label="Total Riders" value={userStats.total} />
        <StatCard label="Low Risk" value={userStats.lowRisk} valueClassName="text-emerald-700" />
        <StatCard label="Medium Risk" value={userStats.medRisk} valueClassName="text-amber-700" />
        <StatCard label="High Risk" value={userStats.highRisk} valueClassName="text-rose-700" />
      </StatsGrid>

      <FilterBar className="lg:grid-cols-5">
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
        <Select
          variant="legacy"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="joinDate">Join Date</option>
          <option value="name">Name</option>
          <option value="riskScore">Risk Score</option>
          <option value="totalPaid">Total Paid</option>
        </Select>
        <Select
          variant="legacy"
          value={sortDir}
          onChange={(e) => setSortDir(e.target.value)}
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </Select>
      </FilterBar>

      <DataPanel>
        <Table density="legacy" className="min-w-[900px]">
          <TableHeader tone="legacy">
            <TableRow tone="legacy">
              <TableHead>USER</TableHead>
              <TableHead>PROGRAM</TableHead>
              <TableHead>PROGRESS</TableHead>
              <TableHead className="text-center">COLLECTION AUDIT</TableHead>
              <TableHead>RISK SCORE</TableHead>
              <TableHead>VEHICLE</TableHead>
              <TableHead>CONTACT</TableHead>
              <TableHead>JOINED</TableHead>
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {pageRows.length > 0 ? (
            pageRows.map((user) => (
              <TableRow key={user.userId} tone="legacy">
                <TableCell>
                  <div className="font-bold text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.userId}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(user.vehicleIds || []).map((id) => (
                      <span
                        key={`${user.userId}-${id}`}
                        className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700"
                      >
                        {id}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {(user.vehicleIds || []).length > 0 ? (
                    <span>{Math.min(100, user.riskScore)}%</span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
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
                <TableCell>{user.vehicleIds?.[0] || '-'}</TableCell>
                <TableCell>
                  <div>{user.phone}</div>
                  <div className="text-xs text-slate-500">NIK: {user.nik || '-'}</div>
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
