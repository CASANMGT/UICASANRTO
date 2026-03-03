import { useEffect, useMemo, useState } from 'react'
import { createVehicle, deleteVehicle, getState, getVehicles, lockVehicle, releaseVehicle, updateGps } from '../bridge/legacyRuntime'
import { usePagination } from '../context/PaginationContext'
import * as XLSX from 'xlsx'
import { useLegacyTick } from '../hooks/useLegacyTick'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { DataPanel, PAGE_SIZE, PageFooter, PageHeader, PageMeta, PageShell, PageTitle, StatCard, StatsGrid, TABLE_MIN_WIDTH } from './ui/page'
import { Select } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

const MOTOR_BRAND_MODEL_STORAGE_KEY = 'casan_motor_brand_model_catalog_v1'
const DEFAULT_MOTOR_BRAND_MODEL_CATALOG = [
  { id: 'mbm-zeeho-ae8', brand: 'Zeeho', model: 'Zeeho AE8' },
  { id: 'mbm-maka-one', brand: 'Maka', model: 'Maka One' },
  { id: 'mbm-united-mx1200', brand: 'United', model: 'United MX1200' },
]

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

export function VehiclesView() {
  const tick = useLegacyTick()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [programFilter, setProgramFilter] = useState('all')
  const [connectivity, setConnectivity] = useState('all')
  const [creditBucket, setCreditBucket] = useState('all')
  const [assignment, setAssignment] = useState('all')
  const [gpsDialog, setGpsDialog] = useState({ open: false, vehicleId: null, selectedGpsId: '' })
  const [gpsImeiSearch, setGpsImeiSearch] = useState('')
  const [vehicleDialog, setVehicleDialog] = useState({
    open: false,
    form: {
      plate: '',
      brand: 'Zeeho',
      model: 'Zeeho AE8',
      programId: '',
      status: 'available',
      stnkNumber: '',
      stnkExpiryDate: '',
    },
  })
  const [bulkVehicle, setBulkVehicle] = useState({
    open: false,
    fileName: '',
    rows: [],
    result: null,
    error: '',
  })
  const [motorCatalog, setMotorCatalog] = useState(() => loadMotorCatalog())
  const [motorSettings, setMotorSettings] = useState({
    open: false,
    editId: null,
    brand: '',
    model: '',
  })
  const [page, setPage] = usePagination('vehicles')
  const pageSize = PAGE_SIZE
  const motorBrandOptions = useMemo(
    () => [...new Set(motorCatalog.map((entry) => entry.brand).filter(Boolean))].sort(),
    [motorCatalog],
  )
  const motorModelOptions = useMemo(
    () => motorCatalog.filter((entry) => entry.brand === vehicleDialog.form.brand).map((entry) => entry.model),
    [motorCatalog, vehicleDialog.form.brand],
  )
  useEffect(() => {
    saveMotorCatalog(motorCatalog)
  }, [motorCatalog])

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
  const gpsDevices = useMemo(() => {
    void tick
    return getState().gpsDevices || []
  }, [tick])
  const programsById = useMemo(() => {
    void tick
    return new Map((getState().programs || []).map((program) => [program.id, program]))
  }, [tick])
  const programsList = useMemo(() => {
    void tick
    return getState().programs || []
  }, [tick])
  const vehiclesWithGps = useMemo(() => {
    const gpsByVehicle = new Map(gpsDevices.filter((device) => device.vehicleId).map((device) => [device.vehicleId, device]))
    return vehicles.map((vehicle) => {
      const gps = gpsByVehicle.get(vehicle.id) || null
      const online = gps ? gps.status !== 'Offline' : Boolean(vehicle.isOnline)
      const gpsStatus = gps?.status || (online ? 'Online' : 'Offline')
      const rawLastPingAt = gps?.lastPingAt || gps?.updatedAt || null
      const lastPingAt = normalizeLastPingByStatus(rawLastPingAt, gpsStatus, gps?.id || vehicle.id)
      const signalPercent = normalizePercent(gps?.signalPercent ?? pseudoSignal(gps?.status || (online ? 'Online' : 'Offline'), gps?.id || vehicle.id))
      const program = programsById.get(vehicle.programId) || null
      return {
        ...vehicle,
        gps,
        gpsOnline: online,
        signalPercent,
        lastPingAt,
        programName: program?.name || program?.shortName || 'None',
        programTypeLabel: program?.type || vehicle.programType || 'None',
        motorBrand: vehicle.brand || 'Unknown',
        motorMake: vehicle.model || 'Unknown',
        stnkNumber: vehicle.stnkNumber || deriveStnkNumber(vehicle),
        stnkExpiryDate: vehicle.stnkExpiryDate || deriveStnkExpiryDate(vehicle),
      }
    })
  }, [vehicles, gpsDevices, programsById])
  const assignableGpsDevices = useMemo(() => {
    if (!gpsDialog.vehicleId) return []
    return gpsDevices.filter((device) => !device.vehicleId || device.vehicleId === gpsDialog.vehicleId)
  }, [gpsDevices, gpsDialog.vehicleId])
  const filteredAssignableGpsDevices = useMemo(() => {
    const query = gpsImeiSearch.trim().toLowerCase()
    if (!query) return assignableGpsDevices
    return assignableGpsDevices.filter((device) => String(device.imei || '').toLowerCase().includes(query))
  }, [assignableGpsDevices, gpsImeiSearch])
  const totalPages = Math.max(1, Math.ceil(vehicles.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = vehiclesWithGps.slice((currentPage - 1) * pageSize, currentPage * pageSize)
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
  const submitNewVehicle = () => {
    const form = vehicleDialog.form
    if (!String(form.plate || '').trim()) return
    const createdId = createVehicle({
      plate: String(form.plate || '').trim(),
      brand: String(form.brand || '').trim() || 'Unknown',
      model: String(form.model || '').trim() || 'Unknown',
      programId: form.programId || '',
      status: form.status || 'available',
      stnkNumber: String(form.stnkNumber || '').trim(),
      stnkExpiryDate: form.stnkExpiryDate
        ? new Date(`${form.stnkExpiryDate}T00:00:00`).toISOString()
        : '',
    })
    if (!createdId) return
    setVehicleDialog({
      open: false,
      form: {
        plate: '',
        brand: 'Zeeho',
        model: 'Zeeho AE8',
        programId: '',
        status: 'available',
        stnkNumber: '',
        stnkExpiryDate: '',
      },
    })
  }
  const submitMotorSetting = () => {
    const brand = String(motorSettings.brand || '').trim()
    const model = String(motorSettings.model || '').trim()
    if (!brand || !model) return
    if (motorSettings.editId) {
      setMotorCatalog((prev) =>
        prev.map((entry) => (entry.id === motorSettings.editId ? { ...entry, brand, model } : entry)),
      )
    } else {
      const id = `mbm-${slugify(brand)}-${slugify(model)}-${Date.now()}`
      setMotorCatalog((prev) => [{ id, brand, model }, ...prev])
    }
    setMotorSettings((prev) => ({ ...prev, editId: null, brand: '', model: '' }))
  }
  const removeMotorSetting = (id) => {
    if (motorCatalog.length <= 1) return
    const ok = window.confirm('Remove this motor brand/model from DB?')
    if (!ok) return
    setMotorCatalog((prev) => prev.filter((entry) => entry.id !== id))
    setMotorSettings((prev) => (prev.editId === id ? { ...prev, editId: null, brand: '', model: '' } : prev))
  }
  const submitBulkVehicles = () => {
    const parsed = parseBulkVehicleRows(bulkVehicle.rows)
    if (parsed.rows.length === 0) {
      setBulkVehicle((prev) => ({
        ...prev,
        result: {
          created: 0,
          skipped: parsed.errors.length,
          errors: parsed.errors.length > 0 ? parsed.errors : ['No valid rows found.'],
        },
      }))
      return
    }
    let created = 0
    const errors = [...parsed.errors]
    for (const row of parsed.rows) {
      const createdId = createVehicle({
        plate: row.plate,
        brand: row.brand,
        model: row.model,
        programId: row.programId || '',
        status: row.status || 'available',
        stnkNumber: row.stnkNumber || '',
        stnkExpiryDate: row.stnkExpiryDate
          ? new Date(`${row.stnkExpiryDate}T00:00:00`).toISOString()
          : '',
      })
      if (createdId) created += 1
      else errors.push(`Plate ${row.plate}: failed to create (duplicate vehicle id or invalid data).`)
    }
    setBulkVehicle((prev) => ({
      ...prev,
      result: {
        created,
        skipped: errors.length,
        errors,
      },
    }))
  }
  const handleBulkVehicleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const lowerName = String(file.name || '').toLowerCase()
      let rows = []
      if (lowerName.endsWith('.csv')) {
        const text = await file.text()
        rows = csvTextToRows(text)
      } else {
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const firstSheet = workbook.SheetNames?.[0]
        if (!firstSheet) {
          setBulkVehicle((prev) => ({ ...prev, fileName: file.name, rows: [], result: null, error: 'No sheet found in spreadsheet file.' }))
          return
        }
        rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], {
          header: 1,
          raw: false,
          defval: '',
        })
      }
      setBulkVehicle((prev) => ({
        ...prev,
        fileName: file.name,
        rows,
        result: null,
        error: '',
      }))
    } catch {
      setBulkVehicle((prev) => ({
        ...prev,
        fileName: file.name,
        rows: [],
        result: null,
        error: 'Failed to read file. Please upload a valid CSV/XLS/XLSX file.',
      }))
    }
  }

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
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="legacyPrimary"
            size="legacy"
            className="h-11 shrink-0"
            onClick={() =>
              setVehicleDialog((prev) => ({
                ...prev,
                open: true,
                form: {
                  ...prev.form,
                  brand: prev.form.brand || motorBrandOptions[0] || 'Unknown',
                  model:
                    motorCatalog.find((entry) => entry.brand === (prev.form.brand || motorBrandOptions[0]))?.model ||
                    prev.form.model ||
                    'Unknown',
                  programId: prev.form.programId || programsList[0]?.id || '',
                },
              }))}
          >
            + Add Vehicle
          </Button>
          <Button
            variant="legacyPill"
            size="legacy"
            className="h-11 shrink-0"
            onClick={() => setBulkVehicle({ open: true, fileName: '', rows: [], result: null, error: '' })}
          >
            Bulk Add Vehicles
          </Button>
          <Button
            variant="legacyGhost"
            size="legacy"
            className="h-11 shrink-0"
            onClick={() => setMotorSettings((prev) => ({ ...prev, open: true, editId: null, brand: '', model: '' }))}
          >
            Motor Brand/Model DB
          </Button>
          {statusPills.map((s) => (
            <Button
              key={s}
              variant={status === s ? 'legacyPrimary' : 'legacyPill'}
              size="legacy"
              className="h-11 shrink-0"
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
        <Table density="legacy" className={TABLE_MIN_WIDTH}>
          <TableHeader tone="legacy">
            <TableRow tone="legacy">
              <TableHead>VEHICLE</TableHead>
              <TableHead>MOTOR BRAND / MAKE</TableHead>
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
                  <div className="font-bold text-foreground">{v.id}</div>
                  <div className="text-xs text-muted-foreground">{v.plate}</div>
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-foreground">{v.motorBrand}</div>
                  <div className="text-xs text-muted-foreground">{v.motorMake}</div>
                </TableCell>
                <TableCell>
                  <div>{v.customer || '-'}</div>
                  <div className="text-xs text-muted-foreground">{v.phone || ''}</div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${vehicleStatusTone(v.status).tone}`}>
                    {vehicleStatusTone(v.status).label}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-foreground">{v.programName}</div>
                  <div className="text-xs text-muted-foreground">{v.programTypeLabel}</div>
                </TableCell>
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
                <TableCell>
                  <div className="font-mono text-xs text-foreground">{v.stnkNumber}</div>
                  <div className={`text-xs ${isExpired(v.stnkExpiryDate) ? 'text-rose-600' : 'text-muted-foreground'}`}>
                    Exp: {formatDate(v.stnkExpiryDate)}
                  </div>
                </TableCell>
                <TableCell>
                  {v.gps ? (
                    <div>
                      <div className="font-mono text-xs font-semibold text-foreground">{v.gps.id}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${v.signalPercent >= 60 ? 'bg-emerald-500' : v.signalPercent >= 30 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${v.signalPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{v.signalPercent}%</span>
                      </div>
                      <div className="text-xs text-muted-foreground">IMEI: {v.gps.imei || '-'}</div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Unassigned</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <div className="mb-1">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${
                        v.gpsOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-foreground'
                      }`}
                    >
                      {v.gpsOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                  <div>{timeAgo(v.lastPingAt)}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="legacyPill"
                      size="legacy"
                      onClick={() => {
                        if (v.status === 'immobilized') {
                          const ok = window.confirm(`Release vehicle ${v.id}?`)
                          if (!ok) return
                          releaseVehicle(v.id)
                          return
                        }
                        const ok = window.confirm(`Lock vehicle ${v.id}?`)
                        if (!ok) return
                        lockVehicle(v.id)
                      }}
                    >
                      {v.status === 'immobilized' ? '🔓 Release' : '🔒 Lock'}
                    </Button>
                    <Button
                      variant="legacyPill"
                      size="legacy"
                      onClick={() => {
                        if (v.gps) {
                          const ok = window.confirm(`Unassign GPS ${v.gps.id} from vehicle ${v.id}?`)
                          if (!ok) return
                          updateGps(v.gps.id, { vehicleId: null })
                          return
                        }
                        setGpsDialog({
                          open: true,
                          vehicleId: v.id,
                          selectedGpsId: '',
                        })
                        setGpsImeiSearch('')
                      }}
                    >
                      {v.gps ? 'Remove GPS' : '📡 Add GPS'}
                    </Button>
                    <Button
                      variant="legacyDanger"
                      size="legacy"
                      onClick={() => {
                        const ok = window.confirm(`Delete vehicle ${v.id}? This cannot be undone.`)
                        if (!ok) return
                        deleteVehicle(v.id)
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow tone="legacy">
              <TableCell colSpan={12} className="px-6 py-8 text-center text-sm text-muted-foreground">
                No vehicles found for current filters.
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
          onClick={() => setPage((p) => Math.max(1, Math.min(currentPage, p) - 1))}
        >
          Prev
        </Button>
        <div className="text-sm font-semibold text-muted-foreground">
          Page {currentPage} of {totalPages} ({vehicles.length} rows)
        </div>
        <Button
          variant="legacyGhost"
          size="legacy"
          disabled={currentPage >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, Math.min(currentPage, p) + 1))}
        >
          Next
        </Button>
      </PageFooter>
      <Dialog open={gpsDialog.open} onOpenChange={(open) => setGpsDialog((prev) => ({ ...prev, open }))}>
        <DialogContent tone="legacy">
          <DialogHeader>
            <DialogTitle>Assign GPS Device</DialogTitle>
            <DialogDescription>
              Select GPS by IMEI for vehicle <b>{gpsDialog.vehicleId || '-'}</b>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              variant="legacy"
              placeholder="Search IMEI..."
              value={gpsImeiSearch}
              onChange={(e) => setGpsImeiSearch(e.target.value)}
            />
            <Select
              variant="legacy"
              value={gpsDialog.selectedGpsId}
              onChange={(e) => setGpsDialog((prev) => ({ ...prev, selectedGpsId: e.target.value }))}
            >
              <option value="">Select GPS Device</option>
              {filteredAssignableGpsDevices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.id} • IMEI {device.imei || '-'}
                </option>
              ))}
            </Select>
            <div className="text-xs text-muted-foreground">
              Only unassigned devices (or the current device on this vehicle) are listed.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="legacyGhost"
              onClick={() => {
                setGpsDialog({ open: false, vehicleId: null, selectedGpsId: '' })
                setGpsImeiSearch('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="legacyPrimary"
              onClick={() => {
                if (!gpsDialog.vehicleId || !gpsDialog.selectedGpsId) return
                const ok = window.confirm(`Assign GPS ${gpsDialog.selectedGpsId} to vehicle ${gpsDialog.vehicleId}?`)
                if (!ok) return
                updateGps(gpsDialog.selectedGpsId, { vehicleId: gpsDialog.vehicleId })
                setGpsDialog({ open: false, vehicleId: null, selectedGpsId: '' })
                setGpsImeiSearch('')
              }}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={vehicleDialog.open} onOpenChange={(open) => setVehicleDialog((prev) => ({ ...prev, open }))}>
        <DialogContent tone="legacy">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>Create a vehicle record and include it in the list immediately.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <Input
              variant="legacy"
              placeholder="Plate Number"
              value={vehicleDialog.form.plate}
              onChange={(e) =>
                setVehicleDialog((prev) => ({ ...prev, form: { ...prev.form, plate: e.target.value } }))}
            />
            <Select
              variant="legacy"
              value={vehicleDialog.form.status}
              onChange={(e) =>
                setVehicleDialog((prev) => ({ ...prev, form: { ...prev.form, status: e.target.value } }))}
            >
              <option value="available">Available</option>
              <option value="active">Active</option>
              <option value="grace">Grace</option>
              <option value="paused">Paused</option>
              <option value="immobilized">Immobilized</option>
            </Select>
            <Select
              variant="legacy"
              value={vehicleDialog.form.brand}
              onChange={(e) =>
                setVehicleDialog((prev) => ({
                  ...prev,
                  form: {
                    ...prev.form,
                    brand: e.target.value,
                    model:
                      motorCatalog.find((entry) => entry.brand === e.target.value)?.model ||
                      prev.form.model,
                  },
                }))}
            >
              {motorBrandOptions.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </Select>
            <Select
              variant="legacy"
              value={vehicleDialog.form.model}
              onChange={(e) =>
                setVehicleDialog((prev) => ({ ...prev, form: { ...prev.form, model: e.target.value } }))}
            >
              {motorModelOptions.length > 0 ? (
                motorModelOptions.map((model) => (
                  <option key={`${vehicleDialog.form.brand}-${model}`} value={model}>
                    {model}
                  </option>
                ))
              ) : (
                <option value={vehicleDialog.form.model || ''}>{vehicleDialog.form.model || 'No model configured'}</option>
              )}
            </Select>
            <Select
              variant="legacy"
              value={vehicleDialog.form.programId}
              onChange={(e) =>
                setVehicleDialog((prev) => ({ ...prev, form: { ...prev.form, programId: e.target.value } }))}
            >
              <option value="">No Program</option>
              {programsList.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name || program.shortName || program.id} • {program.type || '-'}
                </option>
              ))}
            </Select>
            <Input
              variant="legacy"
              placeholder="STNK Number"
              value={vehicleDialog.form.stnkNumber}
              onChange={(e) =>
                setVehicleDialog((prev) => ({ ...prev, form: { ...prev.form, stnkNumber: e.target.value } }))}
            />
            <Input
              variant="legacy"
              type="date"
              value={vehicleDialog.form.stnkExpiryDate}
              onChange={(e) =>
                setVehicleDialog((prev) => ({ ...prev, form: { ...prev.form, stnkExpiryDate: e.target.value } }))}
            />
          </div>
          <DialogFooter>
            <Button variant="legacyGhost" onClick={() => setVehicleDialog((prev) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button variant="legacyPrimary" onClick={submitNewVehicle}>
              Add Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={bulkVehicle.open} onOpenChange={(open) => setBulkVehicle((prev) => ({ ...prev, open }))}>
        <DialogContent tone="legacy">
          <DialogHeader>
            <DialogTitle>Bulk Add Vehicles</DialogTitle>
            <DialogDescription>
              Upload CSV or Excel with columns: <code>plate, brand, model, programId, status, stnkNumber, stnkExpiryDate (YYYY-MM-DD)</code>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="legacyPill"
              size="legacy"
              onClick={() =>
                downloadTextFile(
                  'vehicle_bulk_template.xls',
                  vehicleBulkExcelTemplate(),
                  'application/vnd.ms-excel;charset=utf-8',
                )}
            >
              Download Excel Template
            </Button>
          </div>
          <div className="space-y-2">
            <Input
              variant="legacy"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleBulkVehicleFileChange}
            />
            {bulkVehicle.fileName ? (
              <div className="text-xs text-muted-foreground">Selected file: {bulkVehicle.fileName}</div>
            ) : null}
            {bulkVehicle.error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{bulkVehicle.error}</div>
            ) : null}
            {bulkVehicle.result ? (
              <div className="rounded-lg border border-border bg-muted p-3 text-xs text-foreground">
                <div>
                  Created: <b>{bulkVehicle.result.created}</b> | Skipped: <b>{bulkVehicle.result.skipped}</b>
                </div>
                {bulkVehicle.result.errors.length > 0 ? (
                  <ul className="mt-2 list-disc pl-4">
                    {bulkVehicle.result.errors.slice(0, 8).map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="legacyGhost" onClick={() => setBulkVehicle({ open: false, fileName: '', rows: [], result: null, error: '' })}>
              Close
            </Button>
            <Button variant="legacyPrimary" onClick={submitBulkVehicles} disabled={bulkVehicle.rows.length === 0}>
              Import File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={motorSettings.open}
        onOpenChange={(open) =>
          setMotorSettings((prev) => ({ ...prev, open, editId: open ? prev.editId : null }))
        }
      >
        <DialogContent tone="legacy">
          <DialogHeader>
            <DialogTitle>Motor Brand/Model DB</DialogTitle>
            <DialogDescription>Add or remove motor brand/model from the vehicle database list.</DialogDescription>
          </DialogHeader>
          <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            <Input
              variant="legacy"
              placeholder="Brand"
              value={motorSettings.brand}
              onChange={(e) => setMotorSettings((prev) => ({ ...prev, brand: e.target.value }))}
            />
            <Input
              variant="legacy"
              placeholder="Model"
              value={motorSettings.model}
              onChange={(e) => setMotorSettings((prev) => ({ ...prev, model: e.target.value }))}
            />
          </div>
          <div className="mb-3">
            <Button variant="legacyPrimary" onClick={submitMotorSetting}>
              {motorSettings.editId ? 'Save Motor' : 'Add Motor'}
            </Button>
          </div>
          <div className="max-h-64 overflow-auto rounded-lg border border-border">
            <Table density="legacy">
              <TableHeader tone="legacy">
                <TableRow tone="legacy">
                  <TableHead>BRAND</TableHead>
                  <TableHead>MODEL</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {motorCatalog.map((entry) => (
                  <TableRow key={entry.id} tone="legacy">
                    <TableCell>{entry.brand}</TableCell>
                    <TableCell>{entry.model}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="legacyPill"
                          size="legacy"
                          onClick={() =>
                            setMotorSettings((prev) => ({
                              ...prev,
                              editId: entry.id,
                              brand: entry.brand,
                              model: entry.model,
                            }))}
                        >
                          Edit
                        </Button>
                        <Button variant="legacyDanger" size="legacy" onClick={() => removeMotorSetting(entry.id)}>
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="legacyGhost" onClick={() => setMotorSettings((prev) => ({ ...prev, open: false }))}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}

function normalizePercent(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

function hashCode(value) {
  let hash = 0
  for (let idx = 0; idx < value.length; idx += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(idx)
    hash |= 0
  }
  return hash
}

function pseudoSignal(status, seedText) {
  if (status === 'Offline') return 0
  if (status === 'Tampered') return 12 + (Math.abs(hashCode(seedText)) % 18)
  if (status === 'Low Signal') return 20 + (Math.abs(hashCode(seedText)) % 30)
  return 55 + (Math.abs(hashCode(seedText)) % 46)
}

function timeAgo(dateLike) {
  if (!dateLike) return '-'
  const ms = Date.now() - new Date(dateLike).getTime()
  if (!Number.isFinite(ms)) return '-'
  if (ms < 0) return 'just now'
  const minutes = Math.floor(ms / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function normalizeLastPingByStatus(dateLike, status, seedText) {
  const now = Date.now()
  const parsed = dateLike ? new Date(dateLike).getTime() : Number.NaN
  const hasValid = Number.isFinite(parsed)
  const diffMs = hasValid ? now - parsed : Number.NaN
  const isOffline = status === 'Offline'
  const seed = Math.abs(hashCode(String(seedText || status || 'gps')))

  if (isOffline) {
    if (!hasValid || diffMs < 60 * 60 * 1000) {
      const minutesAgo = 65 + (seed % 600) // 65m .. 665m
      return new Date(now - minutesAgo * 60 * 1000).toISOString()
    }
    return new Date(parsed).toISOString()
  }

  // Any non-offline status should look recent (< 1h).
  if (!hasValid || diffMs >= 60 * 60 * 1000 || diffMs < 0) {
    const minutesAgo = 1 + (seed % 55) // 1m .. 55m
    return new Date(now - minutesAgo * 60 * 1000).toISOString()
  }
  return new Date(parsed).toISOString()
}

function deriveStnkNumber(vehicle) {
  const plateSeed = String(vehicle?.plate || '').replace(/\s+/g, '').toUpperCase()
  if (!plateSeed) return 'STNK-N/A'
  return `STNK-${plateSeed}`
}

function deriveStnkExpiryDate(vehicle) {
  const seed = Math.abs(hashCode(String(vehicle?.id || vehicle?.plate || 'stnk')))
  const daysAhead = 30 + (seed % 540)
  return new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString()
}

function isExpired(dateLike) {
  if (!dateLike) return false
  return new Date(dateLike).getTime() < Date.now()
}

function formatDate(dateLike) {
  if (!dateLike) return '-'
  const date = new Date(dateLike)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('id-ID')
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function loadMotorCatalog() {
  try {
    const raw = localStorage.getItem(MOTOR_BRAND_MODEL_STORAGE_KEY)
    if (!raw) return DEFAULT_MOTOR_BRAND_MODEL_CATALOG
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_MOTOR_BRAND_MODEL_CATALOG
    return parsed
      .map((entry, idx) => ({
        id: entry.id || `mbm-import-${idx}`,
        brand: String(entry.brand || '').trim(),
        model: String(entry.model || '').trim(),
      }))
      .filter((entry) => entry.brand && entry.model)
  } catch {
    return DEFAULT_MOTOR_BRAND_MODEL_CATALOG
  }
}

function saveMotorCatalog(catalog) {
  try {
    localStorage.setItem(MOTOR_BRAND_MODEL_STORAGE_KEY, JSON.stringify(catalog))
  } catch {
    // Ignore storage issues when persistence is unavailable.
  }
}

function parseBulkVehicleRows(sheetRows) {
  const rowsInput = Array.isArray(sheetRows) ? sheetRows : []
  if (rowsInput.length === 0) return { rows: [], errors: [] }
  const rows = []
  const errors = []
  const allowedStatus = new Set(['available', 'active', 'grace', 'paused', 'immobilized'])
  for (let idx = 0; idx < rowsInput.length; idx += 1) {
    const cells = (rowsInput[idx] || []).map((cell) => String(cell || '').trim())
    if (cells.every((cell) => !cell)) continue
    if (idx === 0 && /^plate$/i.test(cells[0] || '')) continue
    const [plate, brand, model, programId, status, stnkNumber, stnkExpiryDate] = cells
    if (!plate) {
      errors.push(`Line ${idx + 1}: plate is required`)
      continue
    }
    if (!brand) {
      errors.push(`Line ${idx + 1}: brand is required`)
      continue
    }
    if (!model) {
      errors.push(`Line ${idx + 1}: model is required`)
      continue
    }
    const normalizedStatus = String(status || '').toLowerCase()
    if (normalizedStatus && !allowedStatus.has(normalizedStatus)) {
      errors.push(`Line ${idx + 1}: invalid status "${status}"`)
      continue
    }
    if (stnkExpiryDate && !/^\d{4}-\d{2}-\d{2}$/.test(stnkExpiryDate)) {
      errors.push(`Line ${idx + 1}: stnkExpiryDate must be YYYY-MM-DD`)
      continue
    }
    rows.push({
      plate,
      brand,
      model,
      programId: programId || '',
      status: normalizedStatus || 'available',
      stnkNumber: stnkNumber || '',
      stnkExpiryDate: stnkExpiryDate || '',
    })
  }
  return { rows, errors }
}

function csvTextToRows(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(',').map((cell) => cell.trim()))
}

function vehicleBulkExcelTemplate() {
  // Tab-separated text saved as .xls for easy open in Excel.
  return [
    'plate\tbrand\tmodel\tprogramId\tstatus\tstnkNumber\tstnkExpiryDate',
    'B 7771 XYZ\tZeeho\tZeeho AE8\tP-TA-RTO\tavailable\tSTNK-B7771XYZ\t2027-01-31',
    'B 7772 XYZ\tMaka\tMaka One\t\tactive\t\t',
  ].join('\n')
}

function downloadTextFile(filename, text, mimeType) {
  const blob = new Blob([text], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
