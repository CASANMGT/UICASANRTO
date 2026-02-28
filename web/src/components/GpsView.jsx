import { useMemo, useState } from 'react'
import { createGps, deleteGps, getGpsSnapshot, getState, updateGps } from '../bridge/legacyRuntime'
import { useLegacyTick } from '../hooks/useLegacyTick'

const initialFilter = { status: 'all', brand: 'all', assignment: 'all', simAssignment: 'all', vehicleBrand: 'all', vehicleModel: 'all', search: '' }
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
          return { device, vehicle, program, user, lastPingAt, address, lat, lng }
        }),
    [data.devices, vehicles, programs, users, filter.assignment, filter.simAssignment, filter.vehicleBrand, filter.vehicleModel],
  )
  const vehicleBrands = useMemo(
    () => [...new Set(vehicles.map((vehicle) => vehicleBrand(vehicle)).filter((value) => value && value !== '-'))].sort(),
    [vehicles],
  )
  const vehicleModels = useMemo(() => [...new Set(vehicles.map((vehicle) => vehicle.model).filter(Boolean))].sort(), [vehicles])
  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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
    <section className="vl-container">
      <div className="vl-header">
        <h2 className="vl-title">GPS Device Registry</h2>
        <div className="vl-count">{data.devices.length} Devices</div>
      </div>

      <div className="vl-controls" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr 1fr 1fr 1fr auto', gap: 8 }}>
        <input
          className="vl-search"
          placeholder="Search id/imei/plate/brand"
          value={filter.search}
          onChange={(e) => {
            setFilter((prev) => ({ ...prev, search: e.target.value }))
            setPage(1)
          }}
        />
        <select
          className="form-control"
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
        </select>
        <select
          className="form-control"
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
        </select>
        <select
          className="form-control"
          value={filter.assignment}
          onChange={(e) => {
            setFilter((prev) => ({ ...prev, assignment: e.target.value }))
            setPage(1)
          }}
        >
          <option value="all">All Assignment</option>
          <option value="assigned">Assigned</option>
          <option value="unassigned">Unassigned</option>
        </select>
        <select
          className="form-control"
          value={filter.simAssignment}
          onChange={(e) => {
            setFilter((prev) => ({ ...prev, simAssignment: e.target.value }))
            setPage(1)
          }}
        >
          <option value="all">All SIM</option>
          <option value="assigned">With SIM</option>
          <option value="unassigned">Unassigned SIM</option>
        </select>
        <select
          className="form-control"
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
        </select>
        <select
          className="form-control"
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
        </select>
        <button className="btn btn-primary" type="button" onClick={openCreate}>
          Add Device
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <Stat label="Total" value={data.stats.total || 0} />
        <Stat label="Online" value={data.stats.online || 0} />
        <Stat label="Offline" value={data.stats.offline || 0} />
        <Stat label="Firmware Alert" value={data.stats.firmwareAlert || 0} />
      </div>

      <table className="vl-table">
        <thead>
          <tr>
            <th>DEVICE ID</th>
            <th>BRAND / IMEI</th>
            <th>GPS ID / STATUS / LAST PING</th>
            <th>PROGRAM (FROM VEHICLE)</th>
            <th>VEHICLE / BRAND MODEL</th>
            <th>LAST LOCATION</th>
            <th>SIM</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.length > 0 ? (
            pageRows.map(({ device, vehicle, program, user, lastPingAt, address, lat, lng }) => (
              <tr key={device.id}>
                <td>
                  <div style={{ fontFamily: 'var(--font-mono)' }}>{device.id}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>
                    {new Date(device.createdAt || lastPingAt).toLocaleString('id-ID')}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 700 }}>{device.brand} {device.model || ''}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>{device.imei}</div>
                </td>
                <td>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', marginBottom: 4 }}>{device.id}</div>
                  <span
                    className="vl-status"
                    style={{
                      background: gpsStatusTone(device.status).bg,
                      color: gpsStatusTone(device.status).color,
                    }}
                  >
                    {device.status}
                  </span>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)', marginTop: 4 }}>
                    Last ping: {timeAgo(lastPingAt)}
                  </div>
                </td>
                <td>
                  <div>
                    <span
                      className="vl-status"
                      style={{
                        background: programTone(program?.type).bg,
                        color: programTone(program?.type).color,
                      }}
                    >
                      {program?.name || '-'}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>
                    Name: {user?.name || vehicle?.customer || '-'}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>
                    Phone: {user?.phone || vehicle?.phone || '-'}
                  </div>
                </td>
                <td>
                  <div>{device.vehiclePlate || 'Unassigned Vehicle'}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>
                    {vehicle?.id || 'Not Assigned'}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>
                    {vehicle ? `${vehicleBrand(vehicle)} • ${vehicle.model || '-'}` : '-'}
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: 'var(--text-sm)' }}>{address}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>
                    {lat && lng ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : '-'}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>
                    Last Ping: {new Date(lastPingAt).toLocaleString('id-ID')}
                  </div>
                </td>
                <td>
                  <div>{device.sim?.carrier || 'Unassigned SIM'}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>{device.sim?.number || '-'}</div>
                  <div
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: simExpired(device.sim?.expiry) ? 'var(--dd)' : 'var(--t3)',
                    }}
                  >
                    Exp: {device.sim?.expiry ? new Date(device.sim.expiry).toLocaleDateString('id-ID') : '-'}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!device.vehicleId ? (
                      <button className="vl-pill" type="button" onClick={() => openEdit(device)}>
                        Assign
                      </button>
                    ) : null}
                    <button className="vl-pill" type="button" onClick={() => openEdit(device)}>
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: 'var(--t3)' }}>
                No GPS devices found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="vl-pagination">
        <div className="vl-page-info">
          Page {currentPage} / {totalPages} ({rows.length} rows)
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="vl-page-btn" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Prev
          </button>
          <button className="vl-page-btn" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Next
          </button>
        </div>
      </div>

      <div className={`modal-overlay ${editor.open ? 'active' : ''}`}>
        <div className="modal">
          <h2>{editor.mode === 'create' ? '📡 Add GPS Device' : '✏️ Edit Device'}</h2>
          <div className="form-group">
            <label>Brand</label>
            <select
              className="form-control"
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
            </select>
          </div>
          <div className="form-group">
            <label>Model</label>
            <input
              className="form-control"
              value={editor.form.model}
              onChange={(e) =>
                setEditor((prev) => ({
                  ...prev,
                  form: { ...prev.form, model: e.target.value },
                }))
              }
            />
          </div>
          <div className="form-group">
            <label>IMEI</label>
            <input
              className="form-control"
              value={editor.form.imei}
              onChange={(e) =>
                setEditor((prev) => ({
                  ...prev,
                  form: { ...prev.form, imei: e.target.value },
                }))
              }
            />
          </div>
          <div className="form-group">
            <label>SIM Carrier</label>
            <select
              className="form-control"
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
            </select>
          </div>
          <div className="form-group">
            <label>SIM Number</label>
            <input
              className="form-control"
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
          <div className="form-group">
            <label>SIM Expiry</label>
            <input
              type="date"
              className="form-control"
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
          <div className="form-group">
            <label>Assigned Vehicle</label>
            <select
              className="form-control"
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
            </select>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)', marginTop: 6 }}>
              Only vehicles without GPS assignment are shown.
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" type="button" onClick={() => setEditor((prev) => ({ ...prev, open: false }))}>
              Cancel
            </button>
            {editor.mode === 'edit' && editor.id ? (
              <button
                className="btn btn-danger"
                type="button"
                onClick={() => setDeleteTarget({ id: editor.id })}
              >
                Delete Device
              </button>
            ) : null}
            <button className="btn btn-primary" type="button" onClick={submitEditor}>
              {editor.mode === 'create' ? 'Add Device' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className={`modal-overlay ${deleteTarget ? 'active' : ''}`}>
        <div className="modal">
          <h2>Delete GPS Device</h2>
          <div style={{ color: 'var(--t2)', fontSize: 'var(--text-md)' }}>
            Delete <b>{deleteTarget?.id}</b>? This action cannot be undone.
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" type="button" onClick={() => setDeleteTarget(null)}>
              Cancel
            </button>
            <button
              className="btn btn-danger"
              type="button"
              onClick={() => {
                if (deleteTarget?.id) deleteGps(deleteTarget.id)
                setDeleteTarget(null)
                setEditor((prev) => ({ ...prev, open: false }))
              }}
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value }) {
  return (
    <div className="card stat-card">
      <h3>{label}</h3>
      <div className="value">{value}</div>
      <div className="sub">Live Snapshot</div>
    </div>
  )
}

function gpsStatusTone(status) {
  if (status === 'Online') return { bg: 'var(--dg1)', color: 'var(--dg)' }
  if (status === 'Low Signal') return { bg: 'var(--dw1)', color: 'var(--dw)' }
  if (status === 'Tampered') return { bg: 'var(--dd1)', color: 'var(--dd)' }
  return { bg: 'var(--s3)', color: 'var(--t2)' }
}

function programTone(type) {
  if (type === 'RTO') return { bg: 'var(--dac1)', color: 'var(--dac)' }
  if (type === 'Rent') return { bg: 'var(--dw1)', color: 'var(--dw)' }
  return { bg: 'var(--s3)', color: 'var(--t2)' }
}

function simExpired(expiry) {
  if (!expiry) return false
  return new Date(expiry).getTime() < Date.now()
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
