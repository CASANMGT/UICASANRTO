import { Fragment, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePagination } from '../context/PaginationContext'
import {
  CITIES_GEOFENCE,
  createProgram,
  DEFAULT_OUT_OF_ZONE_BUFFER_KM,
  DEFAULT_OUT_OF_ZONE_SPEED_LIMIT_KMH,
  editProgram,
  getPrograms,
  getState,
  OUT_OF_ZONE_ACTIONS,
  removeProgram,
} from '../bridge/legacyRuntime'
import { useLegacyTick } from '../hooks/useLegacyTick'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { DataPanel, FilterBar, PAGE_SIZE, PageFooter, PageHeader, PageMeta, PageShell, PageTitle, StatCard, StatsGrid, TABLE_MIN_WIDTH, PaginationInfo } from './ui/page'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

function makeId(shortName) {
  const token = (shortName || 'PRG').slice(0, 2).toUpperCase()
  return `P-${token}-${Date.now().toString().slice(-4)}`
}

function buildPickupMapQuery(location, address) {
  const q = [location, address].map((item) => String(item || '').trim()).filter(Boolean).join(', ')
  return q || 'Program Pickup Point'
}

export function ProgramsView() {
  const tick = useLegacyTick()
  const [search, setSearch] = useState('')
  const [page, setPage] = usePagination('programs')
  const DEFAULT_GEOFENCE = { tangkas: ['Jakarta'], maka: ['Jakarta'], united: ['Bekasi'] }
  const [programModal, setProgramModal] = useState({
    open: false,
    mode: 'create',
    id: '',
    name: '',
    shortName: '',
    partnerId: 'tangkas',
    type: 'RTO',
    price: '35000',
    grace: '7',
    commissionType: 'percentage',
    commissionValue: '10',
    pickupLocation: '',
    pickupAddress: '',
    geofenceCities: ['Jakarta'],
    applyOutOfZoneSpeedLimit: true,
    outOfZoneBufferKm: DEFAULT_OUT_OF_ZONE_BUFFER_KM,
    outOfZoneAction: OUT_OF_ZONE_ACTIONS.SPEED_LIMIT,
    outOfZoneSpeedLimitKmh: DEFAULT_OUT_OF_ZONE_SPEED_LIMIT_KMH,
  })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [rentersModal, setRentersModal] = useState({ open: false, programId: '' })
  const [vehicleModal, setVehicleModal] = useState({ open: false, programId: '' })
  const [expandedRenterVehicleId, setExpandedRenterVehicleId] = useState('')
  const [rentersTab, setRentersTab] = useState('all')

  const programs = useMemo(() => {
    void tick
    const q = search.trim().toLowerCase()
    const all = getPrograms()
    if (!q) return all
    return all.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.shortName || '').toLowerCase().includes(q) ||
        (p.partnerId || '').toLowerCase().includes(q),
    )
  }, [search, tick])
  const rentersByProgram = useMemo(() => {
    void tick
    const state = getState()
    const counts = {}
    for (const program of state.programs || []) counts[program.id] = 0
    for (const vehicle of state.vehicles || []) {
      if (vehicle.programId && (vehicle.customer || vehicle.userId)) {
        counts[vehicle.programId] = (counts[vehicle.programId] || 0) + 1
      }
    }
    return counts
  }, [tick])
  const vehiclesByProgram = useMemo(() => {
    void tick
    const state = getState()
    const counts = {}
    for (const program of state.programs || []) counts[program.id] = 0
    for (const vehicle of state.vehicles || []) {
      if (vehicle.programId) counts[vehicle.programId] = (counts[vehicle.programId] || 0) + 1
    }
    return counts
  }, [tick])
  const vehicleRows = useMemo(() => {
    if (!vehicleModal.programId) return []
    const state = getState()
    return (state.vehicles || []).filter((vehicle) => vehicle.programId === vehicleModal.programId)
  }, [vehicleModal.programId, tick])
  const programStats = useMemo(() => {
    const totalPrograms = programs.length
    const totalAssignedVehicles = programs.reduce((sum, p) => sum + (vehiclesByProgram[p.id] || 0), 0)
    const totalRenters = programs.reduce((sum, p) => sum + (rentersByProgram[p.id] || 0), 0)
    const avgCommissionPct =
      programs.length > 0
        ? Math.round(
            (programs.reduce((sum, p) => {
              if (p.commissionType === 'fixed') return sum
              return sum + Number(p.commissionRate || 0) * 100
            }, 0) /
              programs.length) *
              10,
          ) / 10
        : 0
    return { totalPrograms, totalAssignedVehicles, totalRenters, avgCommissionPct }
  }, [programs, vehiclesByProgram, rentersByProgram])
  const rentersRows = useMemo(() => {
    if (!rentersModal.programId) return []
    const state = getState()
    const usersById = new Map((state.users || []).map((user) => [user.userId, user]))
    const txByVehicleId = (state.transactions || []).reduce((map, tx) => {
      const key = String(tx.vehicleId || '').trim()
      if (!key) return map
      map[key] = map[key] || []
      map[key].push(tx)
      return map
    }, {})
    return (state.vehicles || [])
      .filter((vehicle) => vehicle.programId === rentersModal.programId)
      .map((vehicle) => {
        const user =
          (vehicle.userId && usersById.get(vehicle.userId)) ||
          (state.users || []).find((item) => (item.name || '').toLowerCase() === (vehicle.customer || '').toLowerCase()) ||
          null
        const progressPct = Math.max(0, Math.min(100, vehicle.programType === 'RTO' ? 100 - (vehicle.credits || 0) : 0))
        const userTx = txByVehicleId[vehicle.id] || []
        const failedTxCount = userTx.filter((tx) => String(tx.status || '').toLowerCase() === 'failed').length
        const missedPayments = Number(user?.missedPayments || 0)
        const estimatedGraceCount = Math.max(0, missedPayments + (vehicle.status === 'grace' ? 1 : 0))
        const estimatedImmobilizedCount = Math.max(0, failedTxCount + (vehicle.status === 'immobilized' ? 1 : 0))
        const movementState = Number(vehicle.speed || 0) > 0 ? 'RUNNING' : 'STOPPED'
        return {
          vehicle,
          user,
          progressPct,
          estimatedGraceCount,
          estimatedImmobilizedCount,
          movementState,
        }
      })
  }, [rentersModal.programId, tick])
  const rentersTabCounts = useMemo(() => {
    const counts = { all: rentersRows.length, online: 0, offline: 0, running: 0, stopped: 0, grace: 0, immobilized: 0 }
    for (const row of rentersRows) {
      if (row.vehicle.isOnline) counts.online += 1
      else counts.offline += 1
      if (row.movementState === 'RUNNING') counts.running += 1
      else counts.stopped += 1
      if (row.vehicle.status === 'grace') counts.grace += 1
      if (row.vehicle.status === 'immobilized') counts.immobilized += 1
    }
    return counts
  }, [rentersRows])
  const filteredRentersRows = useMemo(() => {
    if (rentersTab === 'all') return rentersRows
    if (rentersTab === 'online') return rentersRows.filter((row) => row.vehicle.isOnline)
    if (rentersTab === 'offline') return rentersRows.filter((row) => !row.vehicle.isOnline)
    if (rentersTab === 'running') return rentersRows.filter((row) => row.movementState === 'RUNNING')
    if (rentersTab === 'stopped') return rentersRows.filter((row) => row.movementState === 'STOPPED')
    if (rentersTab === 'grace') return rentersRows.filter((row) => row.vehicle.status === 'grace')
    if (rentersTab === 'immobilized') return rentersRows.filter((row) => row.vehicle.status === 'immobilized')
    return rentersRows
  }, [rentersRows, rentersTab])
  const pageSize = PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(programs.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = programs.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const openCreateModal = () => {
    setProgramModal({
      open: true,
      mode: 'create',
      id: '',
      name: '',
      shortName: '',
      partnerId: 'tangkas',
      type: 'RTO',
      price: '35000',
      grace: '7',
      commissionType: 'percentage',
      commissionValue: '10',
      pickupLocation: '',
      pickupAddress: '',
      geofenceCities: DEFAULT_GEOFENCE.tangkas,
      applyOutOfZoneSpeedLimit: true,
      outOfZoneBufferKm: DEFAULT_OUT_OF_ZONE_BUFFER_KM,
      outOfZoneAction: OUT_OF_ZONE_ACTIONS.SPEED_LIMIT,
      outOfZoneSpeedLimitKmh: DEFAULT_OUT_OF_ZONE_SPEED_LIMIT_KMH,
    })
  }

  const openEditModal = (program) => {
    setProgramModal({
      open: true,
      mode: 'edit',
      id: program.id,
      name: program.name || '',
      shortName: program.shortName || '',
      partnerId: program.partnerId || 'tangkas',
      type: program.type || 'RTO',
      price: String(program.price || 0),
      grace: String(program.grace || 7),
      commissionType: program.commissionType || 'percentage',
      commissionValue: String(program.commissionType === 'fixed' ? program.commissionFixed || 0 : Math.round((program.commissionRate || 0) * 100)),
      pickupLocation: program.pickupLocation || '',
      pickupAddress: program.pickupAddress || '',
      geofenceCities: Array.isArray(program.geofenceCities) && program.geofenceCities.length > 0
        ? [...program.geofenceCities]
        : DEFAULT_GEOFENCE[program.partnerId] || ['Jakarta'],
      applyOutOfZoneSpeedLimit: program.applyOutOfZoneSpeedLimit !== false,
      outOfZoneBufferKm: Math.max(0, Number(program.outOfZoneBufferKm) || DEFAULT_OUT_OF_ZONE_BUFFER_KM),
      outOfZoneAction: program.outOfZoneAction === OUT_OF_ZONE_ACTIONS.IMMOBILIZED ? OUT_OF_ZONE_ACTIONS.IMMOBILIZED : OUT_OF_ZONE_ACTIONS.SPEED_LIMIT,
      outOfZoneSpeedLimitKmh: Math.max(0, Math.min(80, Number(program.outOfZoneSpeedLimitKmh) || DEFAULT_OUT_OF_ZONE_SPEED_LIMIT_KMH)),
    })
  }

  const submitProgramModal = () => {
    const name = programModal.name.trim()
    if (!name) return
    const payload = {
      name,
      shortName: (programModal.shortName || name).trim().slice(0, 8),
      partnerId: programModal.partnerId,
      type: programModal.type,
      price: Number(programModal.price || 0),
      grace: Number(programModal.grace || 7),
      commissionType: programModal.commissionType,
      commissionRate: programModal.commissionType === 'percentage' ? Number(programModal.commissionValue || 0) / 100 : 0,
      commissionFixed: programModal.commissionType === 'fixed' ? Number(programModal.commissionValue || 0) : 0,
      pickupLocation: programModal.pickupLocation.trim() || 'Program Pickup Point',
      pickupAddress: programModal.pickupAddress.trim(),
      geofenceCities: Array.isArray(programModal.geofenceCities) ? programModal.geofenceCities : DEFAULT_GEOFENCE[programModal.partnerId] || ['Jakarta'],
      applyOutOfZoneSpeedLimit: programModal.applyOutOfZoneSpeedLimit !== false,
      outOfZoneBufferKm: Math.max(0, Number(programModal.outOfZoneBufferKm) || DEFAULT_OUT_OF_ZONE_BUFFER_KM),
      outOfZoneAction: programModal.outOfZoneAction === OUT_OF_ZONE_ACTIONS.IMMOBILIZED ? OUT_OF_ZONE_ACTIONS.IMMOBILIZED : OUT_OF_ZONE_ACTIONS.SPEED_LIMIT,
      outOfZoneSpeedLimitKmh: Math.max(0, Math.min(80, Number(programModal.outOfZoneSpeedLimitKmh) || DEFAULT_OUT_OF_ZONE_SPEED_LIMIT_KMH)),
      eligibleModels: [],
      minSalary: 0,
      promotions: [],
    }
    if (programModal.mode === 'create') {
      createProgram({
        id: makeId(payload.shortName || payload.name),
        ...payload,
      })
    } else {
      editProgram(programModal.id, payload)
    }
    setProgramModal((prev) => ({ ...prev, open: false }))
  }

  const selectedVehicleProgram = programs.find((item) => item.id === vehicleModal.programId)
  const selectedRentersProgram = programs.find((item) => item.id === rentersModal.programId)
  const inputCls =
    'w-full rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground outline-none ring-ring focus:ring-2'
  const actionBtnCls =
    'rounded-full border border-input bg-background px-3 py-1 text-xs font-semibold text-foreground transition hover:bg-accent'

  return (
    <PageShell>
      <PageHeader>
        <PageTitle>Program Management</PageTitle>
        <PageMeta>{programs.length} Programs</PageMeta>
      </PageHeader>

      <StatsGrid className="xl:grid-cols-4">
        <StatCard label="Programs" value={programStats.totalPrograms} />
        <StatCard label="Assigned Vehicles" value={programStats.totalAssignedVehicles} />
        <StatCard label="Active Renters" value={programStats.totalRenters} />
        <StatCard label="Avg Commission (%)" value={`${programStats.avgCommissionPct}%`} />
      </StatsGrid>

      <FilterBar className="lg:grid-cols-5">
        <Input
          variant="legacy"
          className="lg:col-span-2"
          placeholder="Search program..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <div className="flex justify-end lg:col-span-3">
          <Button variant="legacyPrimary" onClick={openCreateModal}>
            + New Program
          </Button>
        </div>
      </FilterBar>

      <DataPanel>
        <Table density="legacy" className={TABLE_MIN_WIDTH}>
          <TableHeader tone="legacy">
            <TableRow tone="legacy">
              <TableHead>PROGRAM</TableHead>
              <TableHead>PARTNER</TableHead>
              <TableHead>TYPE</TableHead>
              <TableHead>VEHICLES ASSIGNED</TableHead>
              <TableHead>RENTERS</TableHead>
              <TableHead>PRICE (COMMISSION)</TableHead>
              <TableHead>PICKUP LOCATION</TableHead>
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length > 0 ? (
              pageRows.map((program) => (
                <TableRow key={program.id} tone="legacy">
                  <TableCell>
                    <div className="font-bold text-foreground">{program.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{program.id}</div>
                  </TableCell>
                  <TableCell>{program.partnerId}</TableCell>
                  <TableCell>{program.type}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex rounded-full bg-cyan-50 px-2 py-1 text-xs font-bold text-cyan-700">
                        {vehiclesByProgram[program.id] || 0}
                      </span>
                      <button
                        className={actionBtnCls}
                        type="button"
                        onClick={() => setVehicleModal({ open: true, programId: program.id })}
                      >
                        Vehicle List
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex rounded-full bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">
                        {rentersByProgram[program.id] || 0}
                      </span>
                      <button
                        className={actionBtnCls}
                        type="button"
                        onClick={() => {
                          setExpandedRenterVehicleId('')
                          setRentersTab('all')
                          setRentersModal({ open: true, programId: program.id })
                        }}
                      >
                        Renters List
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {program.commissionType === 'fixed'
                      ? `Rp ${Math.round(program.price || 0).toLocaleString('id-ID')} (Rp ${Math.round(program.commissionFixed || 0).toLocaleString('id-ID')})`
                      : `Rp ${Math.round(program.price || 0).toLocaleString('id-ID')} (${Math.round(Number(program.commissionRate || 0) * 100)}%)`}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-foreground">{program.pickupLocation || 'Program Pickup Point'}</div>
                    <div className="text-xs text-muted-foreground">{program.pickupAddress || 'Address not set'}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {(program.geofenceCities || []).length > 0 ? (
                        (program.geofenceCities || []).map((city) => (
                          <span
                            key={city}
                            className="inline-flex rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-700"
                          >
                            {city}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                      {program.applyOutOfZoneSpeedLimit !== false && (
                        <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700" title={`Beyond ${program.outOfZoneBufferKm ?? 2} km: ${program.outOfZoneAction === 'immobilized' ? 'Immobilized' : `${program.outOfZoneSpeedLimitKmh ?? 15} km/h`}`}>
                          {program.outOfZoneBufferKm ?? 2}km → {program.outOfZoneAction === 'immobilized' ? 'Immob.' : `${program.outOfZoneSpeedLimitKmh ?? 15} km/h`}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <button className={actionBtnCls} type="button" onClick={() => openEditModal(program)}>
                        Edit
                      </button>
                      <button className={actionBtnCls} type="button" onClick={() => setDeleteTarget(program)}>
                        Delete
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow tone="legacy">
                <TableCell colSpan={8} className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No programs found.
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
        <PaginationInfo currentPage={currentPage} totalPages={totalPages} totalItems={programs.length} itemName="programs" />
        <Button
          variant="legacyGhost"
          size="legacy"
          disabled={currentPage >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </Button>
      </PageFooter>

      {createPortal(
        <>
          <div className={`${programModal.open ? 'flex' : 'hidden'} app-modal-backdrop fixed inset-0 z-[100] items-center justify-center bg-black/45 p-4`}>
            <div className="app-modal-content max-h-[92vh] w-full max-w-xl overflow-auto rounded-lg border border-border bg-background p-4 shadow-xl">
          <h2 className="mb-3 text-lg font-extrabold text-foreground">
            {programModal.mode === 'create' ? 'Launch New Program' : 'Update Program Scheme'}
          </h2>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Display Name</label>
            <input className={inputCls} value={programModal.name} onChange={(e) => setProgramModal((prev) => ({ ...prev, name: e.target.value }))} />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Short Name</label>
            <input className={inputCls} value={programModal.shortName} onChange={(e) => setProgramModal((prev) => ({ ...prev, shortName: e.target.value }))} />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Partner</label>
            <select
              className={inputCls}
              value={programModal.partnerId}
              onChange={(e) => {
                const partnerId = e.target.value
                setProgramModal((prev) => ({
                  ...prev,
                  partnerId,
                  geofenceCities: prev.mode === 'create' ? DEFAULT_GEOFENCE[partnerId] || prev.geofenceCities : prev.geofenceCities,
                }))
              }}
            >
              <option value="tangkas">Tangkas</option>
              <option value="maka">Maka</option>
              <option value="united">United</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Program Intent</label>
            <select className={inputCls} value={programModal.type} onChange={(e) => setProgramModal((prev) => ({ ...prev, type: e.target.value }))}>
              <option value="RTO">Rent To Own (RTO)</option>
              <option value="Rental">Daily Rental</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Daily Price (IDR)</label>
            <input className={inputCls} value={programModal.price} onChange={(e) => setProgramModal((prev) => ({ ...prev, price: e.target.value }))} />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Grace Period (Days)</label>
            <input className={inputCls} value={programModal.grace} onChange={(e) => setProgramModal((prev) => ({ ...prev, grace: e.target.value }))} />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Commission Type</label>
            <select className={inputCls} value={programModal.commissionType} onChange={(e) => setProgramModal((prev) => ({ ...prev, commissionType: e.target.value }))}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (IDR)</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">
              {programModal.commissionType === 'fixed' ? 'Commission Fixed (IDR)' : 'Commission Rate (%)'}
            </label>
            <input className={inputCls} value={programModal.commissionValue} onChange={(e) => setProgramModal((prev) => ({ ...prev, commissionValue: e.target.value }))} />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Pickup Location</label>
            <input
              className={inputCls}
              value={programModal.pickupLocation}
              placeholder="Location name (example: Tangkas Hub - Kemayoran)"
              onChange={(e) => setProgramModal((prev) => ({ ...prev, pickupLocation: e.target.value }))}
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Pickup Address</label>
            <textarea
              className={`${inputCls} min-h-[84px]`}
              value={programModal.pickupAddress}
              placeholder="Full pickup address for operators and renters"
              onChange={(e) => setProgramModal((prev) => ({ ...prev, pickupAddress: e.target.value }))}
            />
          </div>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-semibold text-muted-foreground">
              Geofence Zone (cities allowed for this program)
            </label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {CITIES_GEOFENCE.map((city) => (
                <label key={city} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(programModal.geofenceCities || []).includes(city)}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setProgramModal((prev) => {
                        const current = prev.geofenceCities || []
                        const next = checked ? [...current, city] : current.filter((c) => c !== city)
                        return { ...prev, geofenceCities: next.length > 0 ? next : DEFAULT_GEOFENCE[prev.partnerId] }
                      })
                    }}
                    className="h-4 w-4 rounded border-input accent-cyan-600"
                  />
                  <span className="text-sm text-foreground">{city}</span>
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Renters in this program must stay within selected city boundaries. Map shows in/out of zone.
            </p>
            <label className="mt-3 flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={programModal.applyOutOfZoneSpeedLimit !== false}
                onChange={(e) => setProgramModal((prev) => ({ ...prev, applyOutOfZoneSpeedLimit: e.target.checked }))}
                className="h-4 w-4 rounded border-input accent-cyan-600"
              />
              <span className="text-sm font-semibold text-foreground">Apply out-of-zone rule beyond boundary</span>
            </label>
            {programModal.applyOutOfZoneSpeedLimit !== false && (
              <div className="ml-6 mt-2 space-y-2 rounded-lg border border-border bg-muted p-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">Buffer (km) — no penalty within this distance from boundary</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className={inputCls}
                    value={programModal.outOfZoneBufferKm ?? DEFAULT_OUT_OF_ZONE_BUFFER_KM}
                    onChange={(e) => setProgramModal((prev) => ({ ...prev, outOfZoneBufferKm: Math.max(0, parseFloat(e.target.value) || 0) }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">Beyond buffer — action</label>
                  <select
                    className={inputCls}
                    value={programModal.outOfZoneAction ?? OUT_OF_ZONE_ACTIONS.SPEED_LIMIT}
                    onChange={(e) => setProgramModal((prev) => ({ ...prev, outOfZoneAction: e.target.value }))}
                  >
                    <option value={OUT_OF_ZONE_ACTIONS.SPEED_LIMIT}>Speed limit (cap max km/h)</option>
                    <option value={OUT_OF_ZONE_ACTIONS.IMMOBILIZED}>Immobilized (0 km/h)</option>
                  </select>
                </div>
                {programModal.outOfZoneAction === OUT_OF_ZONE_ACTIONS.SPEED_LIMIT && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Max speed (km/h) when beyond buffer</label>
                    <input
                      type="number"
                      min="0"
                      max="80"
                      className={inputCls}
                      value={programModal.outOfZoneSpeedLimitKmh ?? DEFAULT_OUT_OF_ZONE_SPEED_LIMIT_KMH}
                      onChange={(e) => setProgramModal((prev) => ({ ...prev, outOfZoneSpeedLimitKmh: Math.max(0, Math.min(80, parseFloat(e.target.value) || 0)) }))}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted p-3">
              <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Pickup Preview</div>
              <div className="text-sm font-bold text-foreground">
                {programModal.pickupLocation.trim() || 'Program Pickup Point'}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {programModal.pickupAddress.trim() || 'Address not set'}
              </div>
              <a
                className="mt-2 inline-flex text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(buildPickupMapQuery(programModal.pickupLocation, programModal.pickupAddress))}`}
                target="_blank"
                rel="noreferrer"
              >
                Open in Google Maps
              </a>
            </div>
            <div className="overflow-hidden rounded-lg border border-border bg-muted">
              <iframe
                title="Program pickup map preview"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(buildPickupMapQuery(programModal.pickupLocation, programModal.pickupAddress))}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                style={{ border: 0, width: '100%', height: 170 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
              type="button"
              onClick={() => setProgramModal((prev) => ({ ...prev, open: false }))}
            >
              Cancel
            </button>
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90" type="button" onClick={submitProgramModal}>
              {programModal.mode === 'create' ? 'Initialize Program' : 'Save Changes'}
            </button>
          </div>
            </div>
          </div>

          <div className={`${vehicleModal.open ? 'flex' : 'hidden'} app-modal-backdrop fixed inset-0 z-[100] items-center justify-center bg-black/45 p-4`}>
            <div className="app-modal-content max-h-[92vh] w-[94vw] max-w-5xl overflow-auto rounded-lg border border-border bg-background p-4 shadow-xl">
          <h2 className="mb-3 text-lg font-extrabold text-foreground">
            Vehicle List for {selectedVehicleProgram?.shortName || selectedVehicleProgram?.name || 'Program'}
          </h2>
          <div className="max-h-[70vh] overflow-auto rounded-lg border border-border">
            <Table density="legacy">
              <TableHeader tone="legacy">
                <TableRow tone="legacy">
                  <TableHead>VEHICLE ID</TableHead>
                  <TableHead>PLATE</TableHead>
                  <TableHead>RENTER</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>CREDITS</TableHead>
                  <TableHead>GPS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicleRows.length > 0 ? (
                  vehicleRows.map((vehicle) => (
                    <TableRow key={`program-vehicle-${vehicle.id}`} tone="legacy">
                      <TableCell>{vehicle.id}</TableCell>
                      <TableCell>{vehicle.plate || '-'}</TableCell>
                      <TableCell>{vehicle.customer || 'Unassigned'}</TableCell>
                      <TableCell>
                        <span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-bold text-foreground">
                          {vehicle.status}
                        </span>
                      </TableCell>
                      <TableCell>{vehicle.credits !== undefined ? `${vehicle.credits}d` : '-'}</TableCell>
                      <TableCell>{vehicle.isOnline ? 'ON' : 'OFF'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow tone="legacy">
                    <TableCell colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                      No vehicles assigned to this program yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
              type="button"
              onClick={() => setVehicleModal({ open: false, programId: '' })}
            >
              Close
            </button>
          </div>
            </div>
          </div>

          <div className={`${rentersModal.open ? 'flex' : 'hidden'} app-modal-backdrop fixed inset-0 z-[100] items-center justify-center bg-black/45 p-4`}>
            <div className="app-modal-content max-h-[92vh] w-[95vw] max-w-6xl overflow-auto rounded-lg border border-border bg-background p-4 shadow-xl">
          <h2 className="mb-3 text-lg font-extrabold text-foreground">
            Renter Details for {selectedRentersProgram?.shortName || selectedRentersProgram?.name || 'Program'}
          </h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {[
              ['all', 'All'],
              ['online', 'Online'],
              ['offline', 'Offline'],
              ['running', 'Running'],
              ['stopped', 'Stopped'],
              ['grace', 'Grace'],
              ['immobilized', 'Immobilized'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  rentersTab === id
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.22)]'
                    : 'border-input bg-background text-foreground hover:bg-muted'
                }`}
                onClick={() => {
                  setExpandedRenterVehicleId('')
                  setRentersTab(id)
                }}
              >
                {label} ({rentersTabCounts[id] || 0})
              </button>
            ))}
          </div>
          <div className="max-h-[70vh] overflow-auto rounded-lg border border-border">
            <Table density="legacy">
              <TableHeader tone="legacy">
                <TableRow tone="legacy">
                  <TableHead>RENTER INFO</TableHead>
                  <TableHead>PHONE</TableHead>
                  <TableHead>RISK AUDIT</TableHead>
                  <TableHead>RISK FACTORS</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>CONNECTIVITY</TableHead>
                  <TableHead>MOVEMENT</TableHead>
                  <TableHead>PROGRESS</TableHead>
                  <TableHead>ACTIVE ADDRESS</TableHead>
                  <TableHead>NOPOL / ID</TableHead>
                  <TableHead>CREDITS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRentersRows.length > 0 ? (
                  filteredRentersRows.map(({ vehicle, user, progressPct, estimatedGraceCount, estimatedImmobilizedCount, movementState }) => {
                    const expanded = expandedRenterVehicleId === vehicle.id
                    return (
                      <Fragment key={`renters-group-${vehicle.id}`}>
                        <TableRow
                          className="cursor-pointer"
                          tone="legacy"
                          onClick={() => setExpandedRenterVehicleId((prev) => (prev === vehicle.id ? '' : vehicle.id))}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{expanded ? '▼' : '▶'}</span>
                              <div>
                                <div className="font-bold text-foreground">{vehicle.customer || 'Unknown'}</div>
                                <div className="font-mono text-xs text-muted-foreground">{vehicle.userId || ''}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-foreground">{user?.phone || vehicle.phone || '-'}</div>
                            <div className="text-xs text-muted-foreground">{user?.nik || ''}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-foreground">{user?.riskLabel || '-'}</div>
                            <div className="text-xs text-muted-foreground">Score: {user?.riskScore ?? '-'}</div>
                            <div className="text-xs text-muted-foreground">Risk rises with grace/immobilized events.</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-muted-foreground">Grace: {estimatedGraceCount}x</div>
                            <div className="text-xs text-muted-foreground">Immobilized: {estimatedImmobilizedCount}x</div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-bold text-foreground">
                              {String(vehicle.status || '').toUpperCase()}
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
                            <div className="font-bold text-foreground">{progressPct}%</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-muted-foreground">{vehicle.lastActiveLocation || vehicle.address || 'Location Hidden'}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-foreground">{vehicle.plate || vehicle.id}</div>
                            <div className="text-xs text-muted-foreground">{vehicle.model || ''}</div>
                          </TableCell>
                          <TableCell>{vehicle.credits !== undefined ? `${vehicle.credits}d` : '--'}</TableCell>
                        </TableRow>
                        {expanded ? (
                          <tr className="bg-muted">
                            <TableCell colSpan={11}>
                              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                <div>
                                  <div className="mb-1 text-xs font-semibold text-muted-foreground">Rider Info</div>
                                  <div className="text-sm">NIK: {user?.nik || '--'}</div>
                                  <div className="text-sm">Phone: {user?.phone || vehicle.phone || '--'}</div>
                                  <div className="text-sm">
                                    Join: {user?.joinDate ? new Date(user.joinDate).toLocaleDateString('id-ID') : '--'}
                                  </div>
                                </div>
                                <div>
                                  <div className="mb-1 text-xs font-semibold text-muted-foreground">Performance</div>
                                  <div className="text-sm">
                                    Total Paid: Rp {Math.round(user?.totalPaid || 0).toLocaleString('id-ID')}
                                  </div>
                                  <div className="text-sm">Missed: {user?.missedPayments ?? 0}</div>
                                  <div className="text-sm">Grace Events (est): {estimatedGraceCount}x</div>
                                  <div className="text-sm">Immobilized Events (est): {estimatedImmobilizedCount}x</div>
                                </div>
                                <div>
                                  <div className="mb-1 text-xs font-semibold text-muted-foreground">Emergency</div>
                                  <div className="text-sm">Name: {user?.emergencyContacts?.[0]?.name || '--'}</div>
                                  <div className="text-sm">Phone: {user?.emergencyContacts?.[0]?.phone || '--'}</div>
                                </div>
                              </div>
                            </TableCell>
                          </tr>
                        ) : null}
                      </Fragment>
                    )
                  })
                ) : (
                  <TableRow tone="legacy">
                    <TableCell colSpan={11} className="px-6 py-8 text-center text-sm text-muted-foreground">
                      No renters found for selected tab.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
              type="button"
              onClick={() => {
                setExpandedRenterVehicleId('')
                setRentersTab('all')
                setRentersModal({ open: false, programId: '' })
              }}
            >
              Close
            </button>
          </div>
            </div>
          </div>

          <div className={`${deleteTarget ? 'flex' : 'hidden'} app-modal-backdrop fixed inset-0 z-[100] items-center justify-center bg-black/45 p-4`}>
            <div className="app-modal-content w-full max-w-md rounded-lg border border-border bg-background p-4 shadow-xl">
          <h2 className="mb-2 text-lg font-extrabold text-foreground">Delete Program</h2>
          <div className="text-sm text-muted-foreground">
            Delete <b>{deleteTarget?.name}</b>? This cannot be undone.
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
              type="button"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
              type="button"
              onClick={() => {
                if (deleteTarget) removeProgram(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              Delete
            </button>
          </div>
            </div>
          </div>
        </>,
        document.body,
      )}
    </PageShell>
  )
}
