import { Fragment, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePagination } from '../context/PaginationContext'
import { createProgram, editProgram, getPrograms, getState, removeProgram } from '../api/client'
import {
  PROVINCES_GEOFENCE,
  DEFAULT_OUT_OF_ZONE_BUFFER_KM,
  DEFAULT_OUT_OF_ZONE_SPEED_LIMIT_KMH,
  OUT_OF_ZONE_ACTIONS,
} from '../utils/geofence'
import { useRefreshVersion } from '../hooks/useApiState'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
  CHECKBOX_CLS,
  DataPanel,
  FilterBar,
  FORM_CONTROL_CLS,
  PAGE_SIZE,
  PageFooter,
  PageHeader,
  PageMeta,
  PageShell,
  PageTitle,
  StatCard,
  StatsGrid,
  TABLE_MIN_WIDTH,
  PaginationInfo,
} from './ui/page'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

function makeId(shortName) {
  const token = (shortName || 'PRG').slice(0, 2).toUpperCase()
  return `P-${token}-${Date.now().toString().slice(-4)}`
}

function buildPickupMapQuery(location, address) {
  const q = [location, address].map((item) => String(item || '').trim()).filter(Boolean).join(', ')
  return q || 'Program Pickup Point'
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MODAL_PAGE_SIZE = 10

function formatOffDays(offDays) {
  if (!Array.isArray(offDays) || offDays.length === 0) return '—'
  return [...offDays]
    .filter((d) => d >= 0 && d <= 6)
    .sort((a, b) => a - b)
    .map((d) => WEEKDAY_NAMES[d])
    .join(', ')
}

export function ProgramsView() {
  const tick = useRefreshVersion()
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
    durationDays: '180',
    offDays: [0],
    holidayDates: [],
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
  const [geofenceExpandedProvinces, setGeofenceExpandedProvinces] = useState(['dki'])
  const [vehicleModalPage, setVehicleModalPage] = useState(1)
  const [rentersModalPage, setRentersModalPage] = useState(1)

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
    const program = (state.programs || []).find((p) => p.id === rentersModal.programId)
    const txByVehicleId = (state.transactions || []).reduce((map, tx) => {
      const key = String(tx.vehicleId || '').trim()
      if (!key) return map
      map[key] = map[key] || []
      map[key].push(tx)
      return map
    }, {})
    const paidDaysByVehicle = (state.transactions || []).reduce((map, tx) => {
      if (tx.status !== 'paid' || !tx.vehicleId) return map
      map[tx.vehicleId] = (map[tx.vehicleId] || 0) + 1
      return map
    }, {})
    return (state.vehicles || [])
      .filter((vehicle) => vehicle.programId === rentersModal.programId)
      .map((vehicle) => {
        const user =
          (vehicle.userId && usersById.get(vehicle.userId)) ||
          (state.users || []).find((item) => (item.name || '').toLowerCase() === (vehicle.customer || '').toLowerCase()) ||
          null
        const paidDays = paidDaysByVehicle[vehicle.id] || 0
        const totalDays = Math.max(1, Number(program?.durationDays || 180))
        const progressPercent = program?.type === 'RTO' ? Math.min(100, Math.round((paidDays / totalDays) * 100)) : null
        const userTx = txByVehicleId[vehicle.id] || []
        const failedTxCount = userTx.filter((tx) => String(tx.status || '').toLowerCase() === 'failed').length
        const missedPayments = Number(user?.missedPayments || 0)
        const estimatedGraceCount = Math.max(0, missedPayments + (vehicle.status === 'grace' ? 1 : 0))
        const estimatedImmobilizedCount = Math.max(0, failedTxCount + (vehicle.status === 'immobilized' ? 1 : 0))
        const movementState = Number(vehicle.speed || 0) > 0 ? 'RUNNING' : 'STOPPED'
        return {
          vehicle,
          user,
          paidDays,
          totalDays,
          progressPercent,
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

  // Modal pagination
  const vehicleTotalPages = Math.max(1, Math.ceil(vehicleRows.length / MODAL_PAGE_SIZE))
  const vehicleCurrentPage = Math.min(vehicleModalPage, vehicleTotalPages)
  const vehiclePaginatedRows = vehicleRows.slice((vehicleCurrentPage - 1) * MODAL_PAGE_SIZE, vehicleCurrentPage * MODAL_PAGE_SIZE)

  const rentersTotalPages = Math.max(1, Math.ceil(filteredRentersRows.length / MODAL_PAGE_SIZE))
  const rentersCurrentPage = Math.min(rentersModalPage, rentersTotalPages)
  const rentersPaginatedRows = filteredRentersRows.slice((rentersCurrentPage - 1) * MODAL_PAGE_SIZE, rentersCurrentPage * MODAL_PAGE_SIZE)

  useEffect(() => {
    if (totalPages >= 1 && page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages, setPage])

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
    durationDays: '180',
    offDays: [0],
    holidayDates: [],
    geofenceCities: DEFAULT_GEOFENCE.tangkas,
    applyOutOfZoneSpeedLimit: true,
      outOfZoneBufferKm: DEFAULT_OUT_OF_ZONE_BUFFER_KM,
      outOfZoneAction: OUT_OF_ZONE_ACTIONS.SPEED_LIMIT,
      outOfZoneSpeedLimitKmh: DEFAULT_OUT_OF_ZONE_SPEED_LIMIT_KMH,
    })
  }

  const openEditModal = (program) => {
    const geofenceCities = Array.isArray(program.geofenceCities) && program.geofenceCities.length > 0
      ? [...program.geofenceCities]
      : DEFAULT_GEOFENCE[program.partnerId] || ['Jakarta']
    const provincesToExpand = PROVINCES_GEOFENCE.filter((p) =>
      p.cities.some((c) => geofenceCities.includes(c)),
    ).map((p) => p.id)
    setGeofenceExpandedProvinces(provincesToExpand.length > 0 ? provincesToExpand : ['dki'])
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
      durationDays: String(program.durationDays ?? (program.type === 'RTO' ? 180 : 30)),
      offDays: Array.isArray(program.offDays) ? [...program.offDays] : [0],
      holidayDates: Array.isArray(program.holidayDates) ? [...program.holidayDates] : [],
      geofenceCities,
      applyOutOfZoneSpeedLimit: program.applyOutOfZoneSpeedLimit !== false,
      outOfZoneBufferKm: Math.max(0, Number(program.outOfZoneBufferKm) || DEFAULT_OUT_OF_ZONE_BUFFER_KM),
      outOfZoneAction: program.outOfZoneAction === OUT_OF_ZONE_ACTIONS.IMMOBILIZED ? OUT_OF_ZONE_ACTIONS.IMMOBILIZED : OUT_OF_ZONE_ACTIONS.SPEED_LIMIT,
      outOfZoneSpeedLimitKmh: Math.max(0, Math.min(80, Number(program.outOfZoneSpeedLimitKmh) || DEFAULT_OUT_OF_ZONE_SPEED_LIMIT_KMH)),
    })
  }

  const closeProgramModal = () => setProgramModal((prev) => ({ ...prev, open: false }))

  const closeVehicleModal = () => setVehicleModal({ open: false, programId: '' })
  const closeRentersModal = () => {
    setExpandedRenterVehicleId('')
    setRentersTab('all')
    setRentersModal({ open: false, programId: '' })
  }
  const closeDeleteModal = () => setDeleteTarget(null)

  useEffect(() => {
    const anyOpen = programModal.open || vehicleModal.open || rentersModal.open || !!deleteTarget
    if (!anyOpen) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (programModal.open) closeProgramModal()
      else if (vehicleModal.open) closeVehicleModal()
      else if (rentersModal.open) closeRentersModal()
      else if (deleteTarget) closeDeleteModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [programModal.open, vehicleModal.open, rentersModal.open, deleteTarget])

  const submitProgramModal = async () => {
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
      durationDays: Math.max(1, Number(programModal.durationDays) || (programModal.type === 'RTO' ? 180 : 30)),
      offDays: Array.isArray(programModal.offDays) ? [...programModal.offDays] : [0],
      holidayDates: Array.isArray(programModal.holidayDates) ? programModal.holidayDates.filter((d) => d >= 1 && d <= 31) : [],
      geofenceCities: Array.isArray(programModal.geofenceCities) ? programModal.geofenceCities : DEFAULT_GEOFENCE[programModal.partnerId] || ['Jakarta'],
      applyOutOfZoneSpeedLimit: programModal.applyOutOfZoneSpeedLimit !== false,
      outOfZoneBufferKm: Math.max(0, Number(programModal.outOfZoneBufferKm) || DEFAULT_OUT_OF_ZONE_BUFFER_KM),
      outOfZoneAction: programModal.outOfZoneAction === OUT_OF_ZONE_ACTIONS.IMMOBILIZED ? OUT_OF_ZONE_ACTIONS.IMMOBILIZED : OUT_OF_ZONE_ACTIONS.SPEED_LIMIT,
      outOfZoneSpeedLimitKmh: Math.max(0, Math.min(80, Number(programModal.outOfZoneSpeedLimitKmh) || DEFAULT_OUT_OF_ZONE_SPEED_LIMIT_KMH)),
      eligibleModels: [],
      minSalary: 0,
      promotions: [],
    }
    try {
      if (programModal.mode === 'create') {
        await createProgram({
          id: makeId(payload.shortName || payload.name),
          ...payload,
        })
      } else {
        await editProgram(programModal.id, payload)
      }
      closeProgramModal()
    } catch (err) {
      window.alert(err?.message || 'Failed to save program')
    }
  }

  const selectedVehicleProgram = programs.find((item) => item.id === vehicleModal.programId)
  const selectedRentersProgram = programs.find((item) => item.id === rentersModal.programId)
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
                    <div className="mt-1 text-xs text-muted-foreground">
                      {program.durationDays ?? 180} days
                      {Array.isArray(program.offDays) && program.offDays.length > 0 && (
                        <> • Weekly: {formatOffDays(program.offDays)}</>
                      )}
                      {Array.isArray(program.holidayDates) && program.holidayDates.length > 0 && (
                        <> • Monthly: {program.holidayDates.sort((a, b) => a - b).join(', ')}</>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{program.partnerId}</TableCell>
                  <TableCell>{program.type}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex rounded-full bg-cyan-50 px-2 py-1 text-xs font-bold text-cyan-700">
                        {vehiclesByProgram[program.id] || 0}
                      </span>
                      <Button
                        variant="legacyPill"
                        size="legacy"
                        className="h-auto px-3 py-1 text-xs"
                        type="button"
                        onClick={() => {
                          setVehicleModalPage(1)
                          setVehicleModal({ open: true, programId: program.id })
                        }}
                      >
                        Vehicle List
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex rounded-full bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">
                        {rentersByProgram[program.id] || 0}
                      </span>
                      <Button
                        variant="legacyPill"
                        size="legacy"
                        className="h-auto px-3 py-1 text-xs"
                        type="button"
                        onClick={() => {
                          setExpandedRenterVehicleId('')
                          setRentersTab('all')
                          setRentersModalPage(1)
                          setRentersModal({ open: true, programId: program.id })
                        }}
                      >
                        Renters List
                      </Button>
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
                      <Button variant="legacyPill" size="legacy" className="h-auto px-3 py-1 text-xs" type="button" onClick={() => openEditModal(program)}>
                        Edit
                      </Button>
                      <Button variant="legacyPill" size="legacy" className="h-auto px-3 py-1 text-xs" type="button" onClick={() => setDeleteTarget(program)}>
                        Delete
                      </Button>
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
          {programModal.open && (
          <div
            className="app-modal-backdrop fixed inset-0 z-[100] cursor-pointer items-center justify-center bg-black/45 p-4"
            onClick={closeProgramModal}
          >
            <div
              className="app-modal-content max-h-[92vh] w-full max-w-xl overflow-auto rounded-lg border border-border bg-background p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
          <div className="mb-3 flex items-start justify-between gap-2">
          <h2 className="text-lg font-extrabold text-foreground">
            {programModal.mode === 'create' ? 'Launch New Program' : 'Update Program Scheme'}
          </h2>
          <button
            type="button"
            className="shrink-0 rounded p-2 text-xl leading-none text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={closeProgramModal}
            aria-label="Close"
          >
            ×
          </button>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Display Name</label>
            <input className={FORM_CONTROL_CLS} value={programModal.name} onChange={(e) => setProgramModal((prev) => ({ ...prev, name: e.target.value }))} />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Short Name</label>
            <input className={FORM_CONTROL_CLS} value={programModal.shortName} onChange={(e) => setProgramModal((prev) => ({ ...prev, shortName: e.target.value }))} />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Partner</label>
            <select
              className={FORM_CONTROL_CLS}
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
            <select className={FORM_CONTROL_CLS} value={programModal.type} onChange={(e) => setProgramModal((prev) => ({ ...prev, type: e.target.value }))}>
              <option value="RTO">Rent To Own (RTO)</option>
              <option value="Rental">Daily Rental</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Daily Price (IDR)</label>
            <input className={FORM_CONTROL_CLS} value={programModal.price} onChange={(e) => setProgramModal((prev) => ({ ...prev, price: e.target.value }))} />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Grace Period (Days)</label>
            <input className={FORM_CONTROL_CLS} value={programModal.grace} onChange={(e) => setProgramModal((prev) => ({ ...prev, grace: e.target.value }))} />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Program Duration (Days)</label>
            <input
              type="number"
              min="1"
              className={FORM_CONTROL_CLS}
              value={programModal.durationDays}
              placeholder={programModal.type === 'RTO' ? '180' : '30'}
              onChange={(e) => setProgramModal((prev) => ({ ...prev, durationDays: e.target.value }))}
            />
            <p className="mt-0.5 text-xs text-muted-foreground">Total contract length (e.g. 180 for 6-month RTO)</p>
          </div>
          <div className="mb-3 rounded-lg border border-border p-3">
            <label className="mb-2 block text-sm font-semibold text-muted-foreground">Holiday / Off Days (no pickup)</label>
            <div className="mb-2">
              <span className="text-xs font-medium text-muted-foreground">Weekly — select weekday(s):</span>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                {WEEKDAY_NAMES.map((name, idx) => (
                  <label key={idx} className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={(programModal.offDays || []).includes(idx)}
                      onChange={(e) => {
                        const current = programModal.offDays || []
                        const next = e.target.checked ? [...current, idx] : current.filter((d) => d !== idx)
                        setProgramModal((prev) => ({ ...prev, offDays: next.sort((a, b) => a - b) }))
                      }}
                      className={CHECKBOX_CLS}
                    />
                    <span className="text-xs text-foreground">{name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Monthly — dates (e.g. 1, 15):</span>
              <input
                className={`${FORM_CONTROL_CLS} mt-1`}
                placeholder="1, 15"
                value={(programModal.holidayDates || []).sort((a, b) => a - b).join(', ')}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\s/g, '')
                  const nums = raw ? raw.split(',').map((s) => parseInt(s, 10)).filter((n) => n >= 1 && n <= 31) : []
                  setProgramModal((prev) => ({ ...prev, holidayDates: [...new Set(nums)] }))
                }}
              />
              <p className="mt-0.5 text-xs text-muted-foreground">Day(s) of month (1–31), e.g. 1 and 15 = 1st & 15th every month</p>
            </div>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Commission Type</label>
            <select className={FORM_CONTROL_CLS} value={programModal.commissionType} onChange={(e) => setProgramModal((prev) => ({ ...prev, commissionType: e.target.value }))}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (IDR)</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">
              {programModal.commissionType === 'fixed' ? 'Commission Fixed (IDR)' : 'Commission Rate (%)'}
            </label>
            <input className={FORM_CONTROL_CLS} value={programModal.commissionValue} onChange={(e) => setProgramModal((prev) => ({ ...prev, commissionValue: e.target.value }))} />
          </div>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-semibold text-muted-foreground">
              Geofence Zone (propinsi → kota/kab)
            </label>
            <p className="mb-2 text-xs text-muted-foreground">
              Renters must stay within selected boundaries. Expand province to pick cities.
            </p>
            <div className="space-y-1 rounded-lg border border-border bg-muted/30">
              {PROVINCES_GEOFENCE.map((prov) => {
                const cities = prov.cities
                const selected = cities.filter((c) => (programModal.geofenceCities || []).includes(c))
                const allSelected = selected.length === cities.length
                const someSelected = selected.length > 0
                const expanded = geofenceExpandedProvinces.includes(prov.id)
                return (
                  <div key={prov.id} className="border-b border-border last:border-b-0">
                    <div
                      className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-muted/50"
                      onClick={() =>
                        setGeofenceExpandedProvinces((prev) =>
                          expanded ? prev.filter((p) => p !== prov.id) : [...prev, prov.id],
                        )
                      }
                    >
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation()
                          setProgramModal((prev) => {
                            const current = prev.geofenceCities || []
                            const next = e.target.checked
                              ? [...new Set([...current, ...cities])]
                              : current.filter((c) => !cities.includes(c))
                            return { ...prev, geofenceCities: next.length > 0 ? next : DEFAULT_GEOFENCE[prev.partnerId] }
                          })
                        }}
                        className={CHECKBOX_CLS}
                      />
                      <span className="flex-1 text-sm font-medium text-foreground">{prov.label}</span>
                      {someSelected && (
                        <span className="text-xs text-muted-foreground">
                          {selected.length}/{cities.length}
                        </span>
                      )}
                      <span className="text-muted-foreground">{expanded ? '▼' : '▶'}</span>
                    </div>
                    {expanded && (
                      <div className="border-t border-border bg-background px-3 py-2 pl-8">
                        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                          {cities.map((city) => (
                            <label key={city} className="flex cursor-pointer items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
                                className={CHECKBOX_CLS}
                              />
                              <span className="text-xs text-foreground">{city}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <label className="mt-3 flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={programModal.applyOutOfZoneSpeedLimit !== false}
                onChange={(e) => setProgramModal((prev) => ({ ...prev, applyOutOfZoneSpeedLimit: e.target.checked }))}
                className={CHECKBOX_CLS}
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
                    className={FORM_CONTROL_CLS}
                    value={programModal.outOfZoneBufferKm ?? DEFAULT_OUT_OF_ZONE_BUFFER_KM}
                    onChange={(e) => setProgramModal((prev) => ({ ...prev, outOfZoneBufferKm: Math.max(0, parseFloat(e.target.value) || 0) }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">Beyond buffer — action</label>
                  <select
                    className={FORM_CONTROL_CLS}
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
                      className={FORM_CONTROL_CLS}
                      value={programModal.outOfZoneSpeedLimitKmh ?? DEFAULT_OUT_OF_ZONE_SPEED_LIMIT_KMH}
                      onChange={(e) => setProgramModal((prev) => ({ ...prev, outOfZoneSpeedLimitKmh: Math.max(0, Math.min(80, parseFloat(e.target.value) || 0)) }))}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="mb-4 rounded-lg border border-border bg-muted/30 p-3">
            <div className="mb-2 text-sm font-semibold text-muted-foreground">Pickup Location & Address</div>
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Location name</label>
              <input
                className={FORM_CONTROL_CLS}
                value={programModal.pickupLocation}
                placeholder="e.g. Tangkas Hub - Kemayoran"
                onChange={(e) => setProgramModal((prev) => ({ ...prev, pickupLocation: e.target.value }))}
              />
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Full address</label>
              <textarea
                className={`${FORM_CONTROL_CLS} min-h-[72px]`}
                value={programModal.pickupAddress}
                placeholder="Full pickup address for operators and renters"
                onChange={(e) => setProgramModal((prev) => ({ ...prev, pickupAddress: e.target.value }))}
              />
            </div>
            <a
              className="mb-3 inline-flex text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(buildPickupMapQuery(programModal.pickupLocation, programModal.pickupAddress))}`}
              target="_blank"
              rel="noreferrer"
            >
              Open in Google Maps
            </a>
            <div className="overflow-hidden rounded-lg border border-border">
              <iframe
                title="Program pickup map preview"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(buildPickupMapQuery(programModal.pickupLocation, programModal.pickupAddress))}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                style={{ border: 0, width: '100%', height: 180 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="legacyGhost" size="legacy" onClick={closeProgramModal}>
              Cancel
            </Button>
            <Button variant="legacyPrimary" size="legacy" onClick={submitProgramModal}>
              {programModal.mode === 'create' ? 'Initialize Program' : 'Save Changes'}
            </Button>
          </div>
            </div>
          </div>
          )}

          {vehicleModal.open && (
          <div
            className="app-modal-backdrop fixed inset-0 z-[100] cursor-pointer items-center justify-center bg-black/45 p-4"
            onClick={closeVehicleModal}
          >
            <div
              className="app-modal-content max-h-[92vh] w-[94vw] max-w-5xl overflow-auto rounded-lg border border-border bg-background p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
          <div className="mb-3 flex items-start justify-between gap-2">
          <h2 className="text-lg font-extrabold text-foreground">
            Vehicle List for {selectedVehicleProgram?.shortName || selectedVehicleProgram?.name || 'Program'}
          </h2>
          <button
            type="button"
            className="shrink-0 rounded p-2 text-xl leading-none text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={closeVehicleModal}
            aria-label="Close"
          >
            ×
          </button>
          </div>
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
                {vehiclePaginatedRows.length > 0 ? (
                  vehiclePaginatedRows.map((vehicle) => (
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
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="legacyGhost"
                size="legacy"
                disabled={vehicleCurrentPage <= 1}
                onClick={() => setVehicleModalPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <span className="text-sm font-semibold text-muted-foreground">
                Page {vehicleCurrentPage} of {vehicleTotalPages} ({vehicleRows.length} vehicles)
              </span>
              <Button
                variant="legacyGhost"
                size="legacy"
                disabled={vehicleCurrentPage >= vehicleTotalPages}
                onClick={() => setVehicleModalPage((p) => Math.min(vehicleTotalPages, p + 1))}
              >
                Next
              </Button>
            </div>
            <Button variant="legacyGhost" size="legacy" onClick={closeVehicleModal}>
              Close
            </Button>
          </div>
            </div>
          </div>
          )}

          {rentersModal.open && (
          <div
            className="app-modal-backdrop fixed inset-0 z-[100] cursor-pointer items-center justify-center bg-black/45 p-4"
            onClick={closeRentersModal}
          >
            <div
              className="app-modal-content max-h-[92vh] w-[95vw] max-w-6xl overflow-auto rounded-lg border border-border bg-background p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
          <div className="mb-3 flex items-start justify-between gap-2">
          <h2 className="text-lg font-extrabold text-foreground">
            Renter Details for {selectedRentersProgram?.shortName || selectedRentersProgram?.name || 'Program'}
          </h2>
          <button
            type="button"
            className="shrink-0 rounded p-2 text-xl leading-none text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={closeRentersModal}
            aria-label="Close"
          >
            ×
          </button>
          </div>
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
                  setRentersModalPage(1)
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
                  <TableHead>RTO PROGRESS</TableHead>
                  <TableHead>ACTIVE ADDRESS</TableHead>
                  <TableHead>NOPOL / ID</TableHead>
                  <TableHead>CREDITS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rentersPaginatedRows.length > 0 ? (
                  rentersPaginatedRows.map(({ vehicle, user, paidDays, totalDays, progressPercent, estimatedGraceCount, estimatedImmobilizedCount, movementState }) => {
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
                            {progressPercent != null ? (
                              <div>
                                <div className="font-semibold text-foreground">
                                  {paidDays} / {totalDays} days
                                </div>
                                <div className="mt-0.5 flex items-center gap-2">
                                  <div className="h-1.5 flex-1 max-w-[60px] overflow-hidden rounded-full bg-muted">
                                    <div
                                      className="h-full rounded-full bg-cyan-500"
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium text-muted-foreground">{progressPercent}%</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
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
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="legacyGhost"
                size="legacy"
                disabled={rentersCurrentPage <= 1}
                onClick={() => setRentersModalPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <span className="text-sm font-semibold text-muted-foreground">
                Page {rentersCurrentPage} of {rentersTotalPages} ({filteredRentersRows.length} renters)
              </span>
              <Button
                variant="legacyGhost"
                size="legacy"
                disabled={rentersCurrentPage >= rentersTotalPages}
                onClick={() => setRentersModalPage((p) => Math.min(rentersTotalPages, p + 1))}
              >
                Next
              </Button>
            </div>
            <Button variant="legacyGhost" size="legacy" onClick={closeRentersModal}>
              Close
            </Button>
          </div>
            </div>
          </div>
          )}

          {deleteTarget && (
          <div
            className="app-modal-backdrop fixed inset-0 z-[100] cursor-pointer items-center justify-center bg-black/45 p-4"
            onClick={closeDeleteModal}
          >
            <div
              className="app-modal-content w-full max-w-md rounded-lg border border-border bg-background p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
          <div className="mb-2 flex items-start justify-between gap-2">
          <h2 className="text-lg font-extrabold text-foreground">Delete Program</h2>
          <button
            type="button"
            className="shrink-0 rounded p-2 text-xl leading-none text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={closeDeleteModal}
            aria-label="Close"
          >
            ×
          </button>
          </div>
          <div className="text-sm text-muted-foreground">
            Delete <b>{deleteTarget?.name}</b>? This cannot be undone.
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="legacyGhost" size="legacy" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button
              variant="legacyDanger"
              size="legacy"
              onClick={async () => {
                if (deleteTarget) await removeProgram(deleteTarget.id)
                closeDeleteModal()
              }}
            >
              Delete
            </Button>
          </div>
            </div>
          </div>
          )}
        </>,
        document.body,
      )}
    </PageShell>
  )
}
