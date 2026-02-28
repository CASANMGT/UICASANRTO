import { useMemo, useState } from 'react'
import { createGps, deleteGps, getGpsSnapshot, getState, updateGps } from '../bridge/legacyRuntime'
import { useLegacyTick } from '../hooks/useLegacyTick'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { PageHeader, PageMeta, PageShell, PageTitle, StatCard, StatsGrid } from './ui/page'
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

export function GpsView() {
  const tick = useLegacyTick()
  const [filter, setFilter] = useState(initialFilter)
  const [editor, setEditor] = useState({ open: false, mode: 'create', id: null, form: initialForm })
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState(null)

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
          const pingAgeHours = Math.floor((Date.now() - new Date(lastPingAt).getTime()) / (60 * 60 * 1000))
          const incidentSeverity =
            device.status === 'Tampered'
              ? 'critical'
              : device.status === 'Offline' && pingAgeHours >= 2
                ? 'high'
                : device.status === 'Low Signal' || pingAgeHours >= 1
                  ? 'medium'
                  : 'low'
          return { device, vehicle, program, user, lastPingAt, pingAgeHours, incidentSeverity, address, lat, lng }
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
  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const openCreate = () => {
    setEditor({ open: true, mode: 'create', id: null, form: { ...initialForm } })
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

      <div className="mb-4 grid grid-cols-1 gap-2 xl:grid-cols-8">
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
        <Button variant="legacyPrimary" onClick={openCreate}>
          Add Device
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <Table className="min-w-[1280px]" density="legacy">
          <TableHeader tone="legacy">
            <TableRow tone="legacy">
              <TableHead>DEVICE ID</TableHead>
              <TableHead>BRAND / IMEI</TableHead>
              <TableHead>GPS ID / STATUS / LAST PING</TableHead>
              <TableHead>PROGRAM (FROM VEHICLE)</TableHead>
              <TableHead>VEHICLE / BRAND MODEL</TableHead>
              <TableHead>LAST LOCATION</TableHead>
              <TableHead>SIM</TableHead>
              <TableHead>SEVERITY</TableHead>
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {pageRows.length > 0 ? (
            pageRows.map(({ device, vehicle, program, user, incidentSeverity, lastPingAt, address, lat, lng }) => (
              <TableRow key={device.id} tone="legacy">
                <TableCell>
                  <div className="font-mono text-xs">{device.id}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(device.createdAt || lastPingAt).toLocaleString('id-ID')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-bold text-slate-900">
                    {device.brand} {device.model || ''}
                  </div>
                  <div className="text-xs text-slate-500">{device.imei}</div>
                </TableCell>
                <TableCell>
                  <div className="mb-1 font-mono text-xs">{device.id}</div>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${gpsStatusTone(device.status)}`}
                  >
                    {device.status}
                  </span>
                  <div className="mt-1 text-xs text-slate-500">
                    Last ping: {timeAgo(lastPingAt)}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${programTone(program?.type)}`}
                    >
                      {program?.name || '-'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Name: {user?.name || vehicle?.customer || '-'}
                  </div>
                  <div className="text-xs text-slate-500">
                    Phone: {user?.phone || vehicle?.phone || '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <div>{device.vehiclePlate || 'Unassigned Vehicle'}</div>
                  <div className="text-xs text-slate-500">
                    {vehicle?.id || 'Not Assigned'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {vehicle ? `${vehicleBrand(vehicle)} • ${vehicle.model || '-'}` : '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs">{address}</div>
                  <div className="text-xs text-slate-500">
                    {lat && lng ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : '-'}
                  </div>
                  <div className="text-xs text-slate-500">
                    Last Ping: {new Date(lastPingAt).toLocaleString('id-ID')}
                  </div>
                </TableCell>
                <TableCell>
                  <div>{device.sim?.carrier || 'Unassigned SIM'}</div>
                  <div className="text-xs text-slate-500">{device.sim?.number || '-'}</div>
                  <div
                    className={`text-xs ${simExpired(device.sim?.expiry) ? 'text-rose-600' : 'text-slate-500'}`}
                  >
                    Exp: {device.sim?.expiry ? new Date(device.sim.expiry).toLocaleDateString('id-ID') : '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${
                      incidentSeverity === 'critical'
                        ? 'bg-rose-100 text-rose-700'
                        : incidentSeverity === 'high'
                          ? 'bg-orange-100 text-orange-700'
                          : incidentSeverity === 'medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {incidentSeverity.toUpperCase()}
                  </span>
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
              <TableCell colSpan={9} className="px-6 py-8 text-center text-sm text-slate-500">
                No GPS devices found.
              </TableCell>
            </TableRow>
          )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-600">
          Page {currentPage} / {totalPages} ({filteredRows.length} rows)
        </div>
        <div className="flex gap-2">
          <Button
            variant="legacyGhost"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <Button
            variant="legacyGhost"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={editor.open} onOpenChange={(open) => setEditor((prev) => ({ ...prev, open }))}>
        <DialogContent tone="legacy">
          <DialogHeader>
            <DialogTitle>{editor.mode === 'create' ? '📡 Add GPS Device' : '✏️ Edit Device'}</DialogTitle>
          </DialogHeader>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-slate-600">Brand</label>
            <Select
              variant="legacy"
              value={editor.form.brand}
              onChange={(e) =>
                setEditor((prev) => ({
                  ...prev,
                  form: { ...prev.form, brand: e.target.value },
                }))
              }
            >
              <option value="Weloop">Weloop</option>
              <option value="Teltonika">Teltonika</option>
              <option value="Concox">Concox</option>
            </Select>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-slate-600">Model</label>
            <Input
              variant="legacy"
              value={editor.form.model}
              onChange={(e) =>
                setEditor((prev) => ({
                  ...prev,
                  form: { ...prev.form, model: e.target.value },
                }))
              }
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-slate-600">IMEI</label>
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
            <label className="mb-1 block text-sm font-semibold text-slate-600">SIM Carrier</label>
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
            <label className="mb-1 block text-sm font-semibold text-slate-600">SIM Number</label>
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
            <label className="mb-1 block text-sm font-semibold text-slate-600">SIM Expiry</label>
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
            <label className="mb-1 block text-sm font-semibold text-slate-600">Assigned Vehicle</label>
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
            <div className="mt-1 text-xs text-slate-500">
              Only vehicles without GPS assignment are shown.
            </div>
          </div>
          <DialogFooter>
            <Button variant="legacyGhost" onClick={() => setEditor((prev) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            {editor.mode === 'edit' && editor.id ? (
              <Button variant="legacyDanger" onClick={() => setDeleteTarget({ id: editor.id })}>
                Delete Device
              </Button>
            ) : null}
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
    </PageShell>
  )
}

function gpsStatusTone(status) {
  if (status === 'Online') return 'bg-emerald-100 text-emerald-700'
  if (status === 'Low Signal') return 'bg-amber-100 text-amber-700'
  if (status === 'Tampered') return 'bg-rose-100 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}

function programTone(type) {
  if (type === 'RTO') return 'bg-cyan-100 text-cyan-700'
  if (type === 'Rent') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-700'
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
