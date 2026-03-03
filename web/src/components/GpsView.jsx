import { useEffect, useMemo, useState } from 'react'
import { usePagination } from '../context/PaginationContext'
import {
  createGps,
  deleteGps,
  getGeofenceSpeedLimit,
  getGpsSnapshot,
  getState,
  updateGps,
} from '../bridge/legacyRuntime'
import * as XLSX from 'xlsx'
import { useLegacyTick } from '../hooks/useLegacyTick'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { DataPanel, PAGE_SIZE, PageFooter, PageHeader, PageMeta, PageShell, PageTitle, StatCard, StatsGrid, TABLE_MIN_WIDTH, PaginationInfo } from './ui/page'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

const initialFilter = {
  status: 'all',
  brand: 'all',
  assignment: 'all',
  simAssignment: 'all',
  simExpiryState: 'all',
  pingAge: 'all',
  incidentOnly: 'all',
  vehicleBrand: 'all',
  vehicleModel: 'all',
  search: '',
}
const initialForm = {
  imei: '',
  brand: 'Weloop',
  model: 'WL-210 Pro',
  vehicleId: '',
  carrier: '',
  simNumber: '',
  simExpiry: '',
}
const GPS_BRAND_MODEL_STORAGE_KEY = 'casan_gps_brand_model_catalog_v1'
const DEFAULT_GPS_BRAND_MODEL_CATALOG = [
  { id: 'bm-weloop-wl210pro', brand: 'Weloop', model: 'WL-210 Pro' },
  { id: 'bm-teltonika-fmb920', brand: 'Teltonika', model: 'FMB920' },
  { id: 'bm-concox-gt06', brand: 'Concox', model: 'GT06N' },
]

export function GpsView() {
  const tick = useLegacyTick()
  const [filter, setFilter] = useState(initialFilter)
  const [editor, setEditor] = useState({ open: false, mode: 'create', id: null, form: initialForm })
  const [bulkImport, setBulkImport] = useState({
    open: false,
    fileName: '',
    rows: [],
    result: null,
    error: '',
  })
  const [brandModelSettings, setBrandModelSettings] = useState({
    open: false,
    editId: null,
    brand: '',
    model: '',
  })
  const [brandModelCatalog, setBrandModelCatalog] = useState(() => loadBrandModelCatalog())
  const [page, setPage] = usePagination('gps')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const brandOptions = useMemo(
    () => [...new Set(brandModelCatalog.map((entry) => entry.brand).filter(Boolean))].sort(),
    [brandModelCatalog],
  )
  const modelOptionsForBrand = useMemo(
    () =>
      brandModelCatalog
        .filter((entry) => entry.brand === editor.form.brand)
        .map((entry) => entry.model)
        .filter(Boolean),
    [brandModelCatalog, editor.form.brand],
  )
  useEffect(() => {
    saveBrandModelCatalog(brandModelCatalog)
  }, [brandModelCatalog])

  const data = useMemo(() => {
    void tick
    return getGpsSnapshot(filter)
  }, [filter, tick])
  const state = useMemo(() => {
    void tick
    return getState()
  }, [tick])
  const vehicles = state.vehicles || []
  const programs = state.programs || []
  const users = state.users || []
  const assignedVehicleIds = useMemo(
    () => new Set((state.gpsDevices || []).map((device) => device.vehicleId).filter(Boolean)),
    [state.gpsDevices],
  )
  const assignableVehicles = useMemo(
    () =>
      vehicles.filter(
        (vehicle) => !assignedVehicleIds.has(vehicle.id) || (editor.mode === 'edit' && editor.form.vehicleId === vehicle.id),
      ),
    [vehicles, assignedVehicleIds, editor.mode, editor.form.vehicleId],
  )
  const rows = useMemo(
    () =>
      data.devices
        .filter((device) => {
          if (filter.assignment === 'assigned') return !!device.vehicleId
          if (filter.assignment === 'unassigned') return !device.vehicleId
          return true
        })
        .filter((device) => {
          const hasSim = Boolean(device.sim?.number || device.sim?.carrier)
          if (filter.simAssignment === 'assigned') return hasSim
          if (filter.simAssignment === 'unassigned') return !hasSim
          return true
        })
        .filter((device) => {
          if (filter.simExpiryState === 'all') return true
          const expiry = device.sim?.expiry
          if (!expiry) return filter.simExpiryState === 'none'
          const days = simExpiryDays(expiry)
          if (filter.simExpiryState === 'expired') return days < 0
          if (filter.simExpiryState === 'soon') return days >= 0 && days <= 7
          if (filter.simExpiryState === 'valid') return days > 7
          return true
        })
        .filter((device) => {
          const vehicle = vehicles.find((v) => v.id === device.vehicleId) || null
          if (filter.vehicleBrand !== 'all' && vehicleBrand(vehicle) !== filter.vehicleBrand) return false
          if (filter.vehicleModel !== 'all' && (vehicle?.model || '-') !== filter.vehicleModel) return false
          return true
        })
        .sort((a, b) => {
          const aTime = Date.parse(a.createdAt || a.updatedAt || 0) || 0
          const bTime = Date.parse(b.createdAt || b.updatedAt || 0) || 0
          return bTime - aTime
        })
        .slice(0, 120)
        .map((device) => {
        const vehicle = vehicles.find((v) => v.id === device.vehicleId) || null
        const program = programs.find((p) => p.id === vehicle?.programId) || null
        const user =
          users.find((u) => u.userId === vehicle?.userId) ||
          users.find((u) => (u.name || '').toLowerCase() === (vehicle?.customer || '').toLowerCase()) ||
          null
        const lastPingAt =
          device.lastPingAt ||
          new Date(Date.now() - (Math.abs(hashCode(device.id || 'gps')) % (8 * 60 * 60 * 1000))).toISOString()
        const address = device.address || vehicle?.lastActiveLocation || `Zone ${((Math.abs(hashCode(device.id || 'gps')) % 12) + 1)} Jakarta`
        const lat = device.lat ?? vehicle?.lat
        const lng = device.lng ?? vehicle?.lng
        const rawSpeed = Math.max(0, Math.round(Number(device.speedKmh ?? device.speed ?? vehicle?.speed ?? 0)))
        const vehicleForGeofence = vehicle ? { ...vehicle, lat: lat ?? vehicle.lat, lng: lng ?? vehicle.lng } : null
        const speedLimit = getGeofenceSpeedLimit(vehicleForGeofence, program, 80)
        const speedKmh = Math.min(rawSpeed, speedLimit)
        const movement = speedKmh > 0 ? 'Running' : 'Stopped'
          const headingDeg = normalizeDegree(device.headingDeg ?? device.heading ?? pseudoHeading(device.id || vehicle?.id || 'gps'))
          const signalPercent = normalizePercent(device.signalPercent ?? pseudoSignal(device.status, device.id || vehicle?.id || 'gps'))
          const pingAgeHours = Math.floor((Date.now() - new Date(lastPingAt).getTime()) / (60 * 60 * 1000))
          const incidentSeverity =
            device.status === 'Tampered'
              ? 'critical'
              : device.status === 'Offline' && pingAgeHours >= 2
                ? 'high'
                : device.status === 'Low Signal' || pingAgeHours >= 1
                  ? 'medium'
                  : 'low'
          return {
            device,
            vehicle,
            program,
            user,
            lastPingAt,
            pingAgeHours,
            incidentSeverity,
            address,
            lat,
            lng,
            movement,
            speedKmh,
            speedLimitedByGeofence: rawSpeed > speedKmh,
            headingDeg,
            signalPercent,
          }
        }),
    [data.devices, vehicles, programs, users, filter.assignment, filter.simAssignment, filter.simExpiryState, filter.vehicleBrand, filter.vehicleModel],
  )
  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (filter.pingAge === 'stale' && row.pingAgeHours < 2) return false
        if (filter.pingAge === 'fresh' && row.pingAgeHours >= 2) return false
        if (filter.incidentOnly === 'yes' && !['critical', 'high', 'medium'].includes(row.incidentSeverity)) return false
        return true
      }),
    [rows, filter.pingAge, filter.incidentOnly],
  )
  const vehicleBrands = useMemo(
    () => [...new Set(vehicles.map((vehicle) => vehicleBrand(vehicle)).filter((value) => value && value !== '-'))].sort(),
    [vehicles],
  )
  const vehicleModels = useMemo(() => [...new Set(vehicles.map((vehicle) => vehicle.model).filter(Boolean))].sort(), [vehicles])
  const pageSize = PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const openCreate = () => {
    const fallbackBrand = brandOptions[0] || initialForm.brand
    const fallbackModel = brandModelCatalog.find((entry) => entry.brand === fallbackBrand)?.model || initialForm.model
    setEditor({
      open: true,
      mode: 'create',
      id: null,
      form: { ...initialForm, brand: fallbackBrand, model: fallbackModel },
    })
  }

  const openEdit = (device) => {
    setEditor({
      open: true,
      mode: 'edit',
      id: device.id,
      form: {
        imei: device.imei || '',
        brand: device.brand || 'Weloop',
        model: device.model || 'WL-210 Pro',
        vehicleId: device.vehicleId || '',
        carrier: device.sim?.carrier || '',
        simNumber: device.sim?.number || '',
        simExpiry: (device.sim?.expiry || '').slice(0, 10),
      },
    })
  }

  const submitEditor = () => {
    const form = editor.form
    if (!form.imei.trim()) return
    if (editor.mode === 'create') {
      createGps({
        imei: form.imei.trim(),
        brand: form.brand,
        model: form.model || (form.brand === 'Teltonika' ? 'FMB920' : 'WL-210 Pro'),
        vehicleId: form.vehicleId || null,
        sim: {
          carrier: form.carrier || '',
          number: form.simNumber || '',
          expiry: form.simExpiry ? new Date(`${form.simExpiry}T00:00:00`).toISOString() : '',
        },
      })
    } else if (editor.id) {
      updateGps(editor.id, {
        imei: form.imei.trim(),
        brand: form.brand,
        model: form.model || (form.brand === 'Teltonika' ? 'FMB920' : 'WL-210 Pro'),
        vehicleId: form.vehicleId || null,
        sim: {
          carrier: form.carrier || '',
          number: form.simNumber || '',
          expiry: form.simExpiry ? new Date(`${form.simExpiry}T00:00:00`).toISOString() : '',
        },
      })
    }
    setEditor((prev) => ({ ...prev, open: false }))
  }
  const submitBulkImport = () => {
    const parsed = parseBulkGpsRows(bulkImport.rows)
    if (parsed.rows.length === 0) {
      setBulkImport((prev) => ({
        ...prev,
        result: {
          created: 0,
          skipped: parsed.errors.length,
          errors: parsed.errors.length > 0 ? parsed.errors : ['No valid rows found.'],
        },
      }))
      return
    }
    for (const row of parsed.rows) {
      createGps({
        imei: row.imei,
        brand: row.brand,
        model: row.model,
        vehicleId: row.vehicleId || null,
        sim: {
          carrier: row.carrier || '',
          number: row.simNumber || '',
          expiry: row.simExpiry ? new Date(`${row.simExpiry}T00:00:00`).toISOString() : '',
        },
      })
    }
    setBulkImport((prev) => ({
      ...prev,
      result: {
        created: parsed.rows.length,
        skipped: parsed.errors.length,
        errors: parsed.errors,
      },
    }))
  }
  const handleBulkImportFileChange = async (event) => {
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
          setBulkImport((prev) => ({ ...prev, fileName: file.name, rows: [], result: null, error: 'No sheet found in spreadsheet file.' }))
          return
        }
        rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], {
          header: 1,
          raw: false,
          defval: '',
        })
      }
      setBulkImport((prev) => ({
        ...prev,
        fileName: file.name,
        rows,
        result: null,
        error: '',
      }))
    } catch {
      setBulkImport((prev) => ({
        ...prev,
        fileName: file.name,
        rows: [],
        result: null,
        error: 'Failed to read file. Please upload a valid CSV/XLS/XLSX file.',
      }))
    }
  }
  const submitBrandModelSetting = () => {
    const brand = brandModelSettings.brand.trim()
    const model = brandModelSettings.model.trim()
    if (!brand || !model) return
    if (brandModelSettings.editId) {
      setBrandModelCatalog((prev) =>
        prev.map((entry) => (entry.id === brandModelSettings.editId ? { ...entry, brand, model } : entry)),
      )
    } else {
      const id = `bm-${slugify(brand)}-${slugify(model)}-${Date.now()}`
      setBrandModelCatalog((prev) => [{ id, brand, model }, ...prev])
    }
    setBrandModelSettings((prev) => ({ ...prev, editId: null, brand: '', model: '' }))
  }
  const deleteBrandModelSetting = (id) => {
    if (brandModelCatalog.length <= 1) return
    const ok = window.confirm('Delete this brand/model setting?')
    if (!ok) return
    setBrandModelCatalog((prev) => prev.filter((entry) => entry.id !== id))
    setBrandModelSettings((prev) => (prev.editId === id ? { ...prev, editId: null, brand: '', model: '' } : prev))
  }

  return (
    <PageShell>
      <PageHeader>
        <PageTitle>GPS Device Registry</PageTitle>
        <PageMeta>{data.devices.length} Devices</PageMeta>
      </PageHeader>

      <StatsGrid>
        <StatCard label="Total" value={data.stats.total || 0} />
        <StatCard label="Online" value={data.stats.online || 0} valueClassName="text-emerald-700" />
        <StatCard label="Offline" value={data.stats.offline || 0} valueClassName="text-amber-700" />
        <StatCard label="Firmware Alert" value={data.stats.firmwareAlert || 0} valueClassName="text-rose-700" />
      </StatsGrid>

      <div className="mb-4 grid grid-cols-1 items-center gap-2 xl:grid-cols-8">
        <Input
          variant="legacy"
          className="xl:col-span-2"
          placeholder="Search id/imei/plate/brand"
          value={filter.search}
          onChange={(e) => {
            setFilter((prev) => ({ ...prev, search: e.target.value }))
            setPage(1)
          }}
        />
        <Select
          variant="legacy"
          value={filter.status}
          onChange={(e) => {
            setFilter((prev) => ({ ...prev, status: e.target.value }))
            setPage(1)
          }}
        >
          <option value="all">All Status</option>
          <option value="Online">Online</option>
          <option value="Offline">Offline</option>
          <option value="Low Signal">Low Signal</option>
          <option value="Tampered">Tampered</option>
        </Select>
        <Select
          variant="legacy"
          value={filter.brand}
          onChange={(e) => {
            setFilter((prev) => ({ ...prev, brand: e.target.value }))
            setPage(1)
          }}
        >
          <option value="all">All Brands</option>
          <option value="Weloop">Weloop</option>
          <option value="Teltonika">Teltonika</option>
          <option value="Concox">Concox</option>
        </Select>
        <Select
          variant="legacy"
          value={filter.assignment}
          onChange={(e) => {
            setFilter((prev) => ({ ...prev, assignment: e.target.value }))
            setPage(1)
          }}
        >
          <option value="all">All Assignment</option>
          <option value="assigned">Assigned</option>
          <option value="unassigned">Unassigned</option>
        </Select>
        <Select
          variant="legacy"
          value={filter.simAssignment}
          onChange={(e) => {
            setFilter((prev) => ({ ...prev, simAssignment: e.target.value }))
            setPage(1)
          }}
        >
          <option value="all">All SIM</option>
          <option value="assigned">With SIM</option>
          <option value="unassigned">Unassigned SIM</option>
        </Select>
        <Select
          variant="legacy"
          value={filter.simExpiryState}
          onChange={(e) => {
            setFilter((prev) => ({ ...prev, simExpiryState: e.target.value }))
            setPage(1)
          }}
        >
          <option value="all">All SIM Expiry</option>
          <option value="expired">Expired</option>
          <option value="soon">Expiring &lt;= 7d</option>
          <option value="valid">Valid &gt; 7d</option>
          <option value="none">No Expiry Date</option>
        </Select>
        <Select
          variant="legacy"
          value={filter.pingAge}
          onChange={(e) => {
            setFilter((prev) => ({ ...prev, pingAge: e.target.value }))
            setPage(1)
          }}
        >
          <option value="all">All Ping Ages</option>
          <option value="stale">Stale (&gt;= 2h)</option>
          <option value="fresh">Fresh (&lt; 2h)</option>
        </Select>
        <Select
          variant="legacy"
          value={filter.incidentOnly}
          onChange={(e) => {
            setFilter((prev) => ({ ...prev, incidentOnly: e.target.value }))
            setPage(1)
          }}
        >
          <option value="all">All Incidents</option>
          <option value="yes">Incident Only</option>
        </Select>
        <Select
          variant="legacy"
          value={filter.vehicleBrand}
          onChange={(e) => {
            setFilter((prev) => ({ ...prev, vehicleBrand: e.target.value }))
            setPage(1)
          }}
        >
          <option value="all">All Vehicle Brand</option>
          {vehicleBrands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </Select>
        <Select
          variant="legacy"
          value={filter.vehicleModel}
          onChange={(e) => {
            setFilter((prev) => ({ ...prev, vehicleModel: e.target.value }))
            setPage(1)
          }}
        >
          <option value="all">All Vehicle Model</option>
          {vehicleModels.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </Select>
        <Button variant="legacyPrimary" size="legacy" className="h-11 shrink-0" onClick={openCreate}>
          Add Device
        </Button>
        <Button
          variant="legacyPill"
          size="legacy"
          className="h-11 shrink-0"
          onClick={() => setBulkImport({ open: true, fileName: '', rows: [], result: null, error: '' })}
        >
          Bulk Add Devices
        </Button>
        <Button
          variant="legacyGhost"
          size="legacy"
          className="h-11 shrink-0"
          onClick={() => setBrandModelSettings((prev) => ({ ...prev, open: true, editId: null, brand: '', model: '' }))}
        >
          Brand/Model Settings
        </Button>
      </div>

      <DataPanel>
        <Table className={TABLE_MIN_WIDTH} density="legacy">
          <TableHeader tone="legacy">
            <TableRow tone="legacy">
              <TableHead>DEVICE ID</TableHead>
              <TableHead>BRAND / IMEI</TableHead>
              <TableHead>SIGNAL / STATUS / LAST PING</TableHead>
              <TableHead>MOVEMENT / SPEED / HEADING</TableHead>
              <TableHead>PROGRAM (FROM VEHICLE)</TableHead>
              <TableHead>VEHICLE / BRAND MODEL</TableHead>
              <TableHead>LAST LOCATION</TableHead>
              <TableHead>SIM</TableHead>
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {pageRows.length > 0 ? (
            pageRows.map(({ device, vehicle, program, user, incidentSeverity, lastPingAt, address, lat, lng, movement, speedKmh, speedLimitedByGeofence, headingDeg, signalPercent }) => (
              <TableRow key={device.id} tone="legacy">
                <TableCell>
                  <div className="font-mono text-xs">{device.id}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(device.createdAt || lastPingAt).toLocaleString('id-ID')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-bold text-foreground">
                    {device.brand} {device.model || ''}
                  </div>
                  <div className="text-xs text-muted-foreground">{device.imei}</div>
                </TableCell>
                <TableCell>
                  <div className="mb-1 flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${signalPercent >= 60 ? 'bg-emerald-500' : signalPercent >= 30 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${signalPercent}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{signalPercent}%</span>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${gpsStatusTone(device.status)}`}
                  >
                    {device.status}
                  </span>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Last ping: {timeAgo(lastPingAt)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${
                        movement === 'Running' ? 'bg-cyan-100 text-cyan-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {movement}
                    </span>
                    <span className="text-xs font-semibold text-foreground">{speedKmh} km/h</span>
                    {speedLimitedByGeofence && (
                      <span className="text-xs text-amber-600" title="Out of zone beyond buffer">
                        (limited)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Heading: {headingDeg}°</div>
                </TableCell>
                <TableCell>
                  <div>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${programTone(program?.type)}`}
                    >
                      {program?.name || '-'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Name: {user?.name || vehicle?.customer || '-'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Phone: {user?.phone || vehicle?.phone || '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <div>{device.vehiclePlate || 'Unassigned Vehicle'}</div>
                  <div className="text-xs text-muted-foreground">
                    {vehicle?.id || 'Not Assigned'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {vehicle ? `${vehicleBrand(vehicle)} • ${vehicle.model || '-'}` : '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs">{address}</div>
                  <div className="text-xs text-muted-foreground">
                    {lat && lng ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : '-'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last Ping: {new Date(lastPingAt).toLocaleString('id-ID')}
                  </div>
                </TableCell>
                <TableCell>
                  <div>{device.sim?.carrier || 'Unassigned SIM'}</div>
                  <div className="text-xs text-muted-foreground">{device.sim?.number || '-'}</div>
                  <div
                    className={`text-xs ${simExpired(device.sim?.expiry) ? 'text-rose-600' : 'text-muted-foreground'}`}
                  >
                    Exp: {device.sim?.expiry ? new Date(device.sim.expiry).toLocaleDateString('id-ID') : '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {!device.vehicleId ? (
                      <Button
                        variant="legacyPill"
                        size="legacy"
                        onClick={() => openEdit(device)}
                      >
                        Assign
                      </Button>
                    ) : null}
                    <Button
                      variant="legacyPill"
                      size="legacy"
                      onClick={() => openEdit(device)}
                    >
                      Edit
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow tone="legacy">
              <TableCell colSpan={9} className="px-6 py-8 text-center text-sm text-muted-foreground">
                No GPS devices found.
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
        <PaginationInfo currentPage={currentPage} totalPages={totalPages} totalItems={filteredRows.length} itemName="devices" />
        <Button
          variant="legacyGhost"
          size="legacy"
          disabled={currentPage >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </Button>
      </PageFooter>

      <Dialog open={editor.open} onOpenChange={(open) => setEditor((prev) => ({ ...prev, open }))}>
        <DialogContent tone="legacy">
          <DialogHeader>
            <DialogTitle>{editor.mode === 'create' ? '📡 Add GPS Device' : '✏️ Edit Device'}</DialogTitle>
          </DialogHeader>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Brand</label>
            <Select
              variant="legacy"
              value={editor.form.brand}
              onChange={(e) =>
                setEditor((prev) => ({
                  ...prev,
                  form: {
                    ...prev.form,
                    brand: e.target.value,
                    model:
                      brandModelCatalog.find((entry) => entry.brand === e.target.value)?.model ||
                      prev.form.model,
                  },
                }))
              }
            >
              {brandOptions.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </Select>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Model</label>
            <Select
              variant="legacy"
              value={editor.form.model}
              onChange={(e) =>
                setEditor((prev) => ({
                  ...prev,
                  form: { ...prev.form, model: e.target.value },
                }))
              }
            >
              {modelOptionsForBrand.length > 0 ? (
                modelOptionsForBrand.map((model) => (
                  <option key={`${editor.form.brand}-${model}`} value={model}>
                    {model}
                  </option>
                ))
              ) : (
                <option value={editor.form.model || ''}>{editor.form.model || 'No model configured'}</option>
              )}
            </Select>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">IMEI</label>
            <Input
              variant="legacy"
              value={editor.form.imei}
              onChange={(e) =>
                setEditor((prev) => ({
                  ...prev,
                  form: { ...prev.form, imei: e.target.value },
                }))
              }
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">SIM Carrier</label>
            <Select
              variant="legacy"
              value={editor.form.carrier}
              onChange={(e) =>
                setEditor((prev) => ({
                  ...prev,
                  form: { ...prev.form, carrier: e.target.value },
                }))
              }
            >
              <option value="">Unassigned SIM</option>
              <option value="Telkomsel">Telkomsel</option>
              <option value="XL">XL</option>
              <option value="Indosat">Indosat</option>
              <option value="Tri">Tri</option>
              <option value="Smartfren">Smartfren</option>
            </Select>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">SIM Number</label>
            <Input
              variant="legacy"
              value={editor.form.simNumber}
              placeholder={editor.form.carrier ? 'e.g. 081312345678' : 'Leave blank for unassigned SIM'}
              onChange={(e) =>
                setEditor((prev) => ({
                  ...prev,
                  form: { ...prev.form, simNumber: e.target.value },
                }))
              }
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">SIM Expiry</label>
            <Input
              variant="legacy"
              type="date"
              value={editor.form.simExpiry}
              disabled={!editor.form.carrier && !editor.form.simNumber}
              onChange={(e) =>
                setEditor((prev) => ({
                  ...prev,
                  form: { ...prev.form, simExpiry: e.target.value },
                }))
              }
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-semibold text-muted-foreground">Assigned Vehicle</label>
            <Select
              variant="legacy"
              value={editor.form.vehicleId}
              onChange={(e) =>
                setEditor((prev) => ({
                  ...prev,
                  form: { ...prev.form, vehicleId: e.target.value },
                }))
              }
            >
              <option value="">Unassigned</option>
              {assignableVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.id} • {vehicle.plate} • {vehicleBrand(vehicle)} • {vehicle.model || '-'}
                </option>
              ))}
            </Select>
            <div className="mt-1 text-xs text-muted-foreground">
              Only vehicles without GPS assignment are shown.
            </div>
          </div>
          {editor.mode === 'edit' && editor.id ? (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
              <div className="text-sm font-semibold text-rose-700">Danger Zone</div>
              <div className="mt-1 text-xs text-rose-600">
                Delete this GPS device permanently. This action cannot be undone.
              </div>
              <div className="mt-3">
                <Button variant="legacyDanger" size="legacy" onClick={() => setDeleteTarget({ id: editor.id })}>
                  Delete Device
                </Button>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="legacyGhost" onClick={() => setEditor((prev) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button variant="legacyPrimary" onClick={submitEditor}>
              {editor.mode === 'create' ? 'Add Device' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md" tone="legacy">
          <DialogHeader>
            <DialogTitle>Delete GPS Device</DialogTitle>
            <DialogDescription>
              Delete <b>{deleteTarget?.id}</b>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="legacyGhost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="legacyDanger"
              onClick={() => {
                if (deleteTarget?.id) deleteGps(deleteTarget.id)
                setDeleteTarget(null)
                setEditor((prev) => ({ ...prev, open: false }))
              }}
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={bulkImport.open} onOpenChange={(open) => setBulkImport((prev) => ({ ...prev, open }))}>
        <DialogContent tone="legacy">
          <DialogHeader>
            <DialogTitle>Bulk Add GPS Devices</DialogTitle>
            <DialogDescription>
              Upload CSV or Excel with columns: <code>imei,brand,model,carrier,simNumber,simExpiry(YYYY-MM-DD),vehicleId</code>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="legacyPill"
              size="legacy"
              onClick={() =>
                downloadTextFile(
                  'gps_bulk_template.xls',
                  gpsBulkExcelTemplate(),
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
              onChange={handleBulkImportFileChange}
            />
            {bulkImport.fileName ? (
              <div className="text-xs text-muted-foreground">Selected file: {bulkImport.fileName}</div>
            ) : null}
            {bulkImport.error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{bulkImport.error}</div>
            ) : null}
            {bulkImport.result ? (
              <div className="rounded-xl border border-border bg-muted p-3 text-xs text-foreground">
                <div>
                  Created: <b>{bulkImport.result.created}</b> | Skipped: <b>{bulkImport.result.skipped}</b>
                </div>
                {bulkImport.result.errors.length > 0 ? (
                  <ul className="mt-2 list-disc pl-4">
                    {bulkImport.result.errors.slice(0, 8).map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="legacyGhost" onClick={() => setBulkImport({ open: false, fileName: '', rows: [], result: null, error: '' })}>
              Close
            </Button>
            <Button variant="legacyPrimary" onClick={submitBulkImport} disabled={bulkImport.rows.length === 0}>
              Import File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={brandModelSettings.open}
        onOpenChange={(open) =>
          setBrandModelSettings((prev) => ({ ...prev, open, editId: open ? prev.editId : null }))
        }
      >
        <DialogContent tone="legacy">
          <DialogHeader>
            <DialogTitle>GPS Brand / Model Settings</DialogTitle>
            <DialogDescription>Manage reusable brand/model options (add, edit, delete).</DialogDescription>
          </DialogHeader>
          <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            <Input
              variant="legacy"
              placeholder="Brand (e.g. Teltonika)"
              value={brandModelSettings.brand}
              onChange={(e) => setBrandModelSettings((prev) => ({ ...prev, brand: e.target.value }))}
            />
            <Input
              variant="legacy"
              placeholder="Model (e.g. FMB920)"
              value={brandModelSettings.model}
              onChange={(e) => setBrandModelSettings((prev) => ({ ...prev, model: e.target.value }))}
            />
          </div>
          <div className="mb-3">
            <Button variant="legacyPrimary" onClick={submitBrandModelSetting}>
              {brandModelSettings.editId ? 'Save Brand/Model' : 'Add Brand/Model'}
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
                {brandModelCatalog.map((entry) => (
                  <TableRow key={entry.id} tone="legacy">
                    <TableCell>{entry.brand}</TableCell>
                    <TableCell>{entry.model}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="legacyPill"
                          size="legacy"
                          onClick={() =>
                            setBrandModelSettings((prev) => ({
                              ...prev,
                              editId: entry.id,
                              brand: entry.brand,
                              model: entry.model,
                            }))}
                        >
                          Edit
                        </Button>
                        <Button variant="legacyDanger" size="legacy" onClick={() => deleteBrandModelSetting(entry.id)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="legacyGhost" onClick={() => setBrandModelSettings((prev) => ({ ...prev, open: false }))}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}

function gpsStatusTone(status) {
  if (status === 'Online') return 'bg-emerald-100 text-emerald-700'
  if (status === 'Low Signal') return 'bg-amber-100 text-amber-700'
  if (status === 'Tampered') return 'bg-rose-100 text-rose-700'
  return 'bg-muted text-foreground'
}

function programTone(type) {
  if (type === 'RTO') return 'bg-cyan-100 text-cyan-700'
  if (type === 'Rent') return 'bg-amber-100 text-amber-700'
  return 'bg-muted text-foreground'
}

function simExpired(expiry) {
  if (!expiry) return false
  return new Date(expiry).getTime() < Date.now()
}

function simExpiryDays(expiry) {
  if (!expiry) return Number.NaN
  const ms = new Date(expiry).getTime() - Date.now()
  return Math.floor(ms / (24 * 60 * 60 * 1000))
}

function vehicleBrand(vehicle) {
  if (!vehicle) return '-'
  if (vehicle.brand) return vehicle.brand
  const model = String(vehicle.model || '')
  const token = model.split(' ')[0] || ''
  return token || '-'
}

function hashCode(value) {
  let hash = 0
  for (let idx = 0; idx < value.length; idx += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(idx)
    hash |= 0
  }
  return hash
}

function normalizePercent(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

function normalizeDegree(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  const deg = Math.round(n) % 360
  return deg < 0 ? deg + 360 : deg
}

function pseudoHeading(seedText) {
  return Math.abs(hashCode(seedText)) % 360
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
  if (ms < 0) return 'just now'
  const minutes = Math.floor(ms / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function loadBrandModelCatalog() {
  try {
    const raw = localStorage.getItem(GPS_BRAND_MODEL_STORAGE_KEY)
    if (!raw) return DEFAULT_GPS_BRAND_MODEL_CATALOG
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_GPS_BRAND_MODEL_CATALOG
    return parsed
      .map((entry, idx) => ({
        id: entry.id || `bm-import-${idx}`,
        brand: String(entry.brand || '').trim(),
        model: String(entry.model || '').trim(),
      }))
      .filter((entry) => entry.brand && entry.model)
  } catch {
    return DEFAULT_GPS_BRAND_MODEL_CATALOG
  }
}

function saveBrandModelCatalog(catalog) {
  try {
    localStorage.setItem(GPS_BRAND_MODEL_STORAGE_KEY, JSON.stringify(catalog))
  } catch {
    // Ignore storage failures in non-persistent environments.
  }
}

function parseBulkGpsRows(sheetRows) {
  const rowsInput = Array.isArray(sheetRows) ? sheetRows : []
  if (rowsInput.length === 0) return { rows: [], errors: [] }
  const rows = []
  const errors = []
  for (let idx = 0; idx < rowsInput.length; idx += 1) {
    const cells = (rowsInput[idx] || []).map((cell) => String(cell || '').trim())
    if (cells.every((cell) => !cell)) continue
    if (idx === 0 && /^imei$/i.test(cells[0] || '')) continue
    const [imei, brand, model, carrier, simNumber, simExpiry, vehicleId] = cells
    if (!imei) {
      errors.push(`Line ${idx + 1}: IMEI is required`)
      continue
    }
    if (!brand) {
      errors.push(`Line ${idx + 1}: Brand is required`)
      continue
    }
    if (!model) {
      errors.push(`Line ${idx + 1}: Model is required`)
      continue
    }
    if (simExpiry && !/^\d{4}-\d{2}-\d{2}$/.test(simExpiry)) {
      errors.push(`Line ${idx + 1}: SIM expiry must be YYYY-MM-DD`)
      continue
    }
    rows.push({
      imei,
      brand,
      model,
      carrier: carrier || '',
      simNumber: simNumber || '',
      simExpiry: simExpiry || '',
      vehicleId: vehicleId || '',
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

function gpsBulkExcelTemplate() {
  return [
    'imei\tbrand\tmodel\tcarrier\tsimNumber\tsimExpiry\tvehicleId',
    '86881000000011\tWeloop\tWL-210 Pro\tTelkomsel\t081300000011\t2026-12-31\tCSN-001',
    '86881000000012\tTeltonika\tFMB920\t\t\t\t',
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
