import { useMemo, useRef, useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getState, getVehicles } from '../bridge/legacyRuntime'
import { useLegacyTick } from '../hooks/useLegacyTick'

export function MapView() {
  const mapRef = useRef(null)
  const tick = useLegacyTick()
  const [status, setStatus] = useState('all')
  const [connectivity, setConnectivity] = useState('all')
  const [movement, setMovement] = useState('all')
  const [listPage, setListPage] = useState(1)
  const vehicles = useMemo(() => {
    void tick
    let list = getVehicles({ status }).map((vehicle) => ({
      ...vehicle,
      effectiveSpeed: vehicle.status === 'immobilized' ? 0 : (vehicle.speed || 0),
    }))
    if (connectivity === 'online') list = list.filter((vehicle) => vehicle.isOnline)
    if (connectivity === 'offline') list = list.filter((vehicle) => !vehicle.isOnline)
    if (movement === 'running') list = list.filter((vehicle) => vehicle.effectiveSpeed > 0)
    if (movement === 'stopped') list = list.filter((vehicle) => vehicle.effectiveSpeed <= 0)
    return list
  }, [status, connectivity, movement, tick])
  const enrichedVehicles = useMemo(() => {
    void tick
    const state = getState()
    const programsById = new Map((state.programs || []).map((program) => [program.id, program]))
    const usersById = new Map((state.users || []).map((user) => [user.userId, user]))
    const usersByName = new Map((state.users || []).map((user) => [String(user.name || '').toLowerCase(), user]))
    const gpsByVehicle = new Map()
    for (const gps of state.gpsDevices || []) {
      if (gps.vehicleId && !gpsByVehicle.has(gps.vehicleId)) gpsByVehicle.set(gps.vehicleId, gps)
    }
    return vehicles.map((vehicle) => {
      const user = (vehicle.userId && usersById.get(vehicle.userId)) || usersByName.get(String(vehicle.customer || '').toLowerCase()) || null
      const program = programsById.get(vehicle.programId)
      const gps = gpsByVehicle.get(vehicle.id) || null
      const lastPingAt =
        gps?.lastPingAt ||
        gps?.updatedAt ||
        new Date(Date.now() - (Math.abs(hashCode(vehicle.id || 'veh')) % (6 * 60 * 60 * 1000))).toISOString()
      return {
        ...vehicle,
        userPhone: user?.phone || vehicle.phone || '-',
        programName: program?.name || program?.shortName || '-',
        vehicleBrand: vehicle.brand || String(vehicle.model || '').split(' ')[0] || '-',
        gpsStatus: gps?.status || 'Unassigned',
        lastPingAt,
        movementState: (vehicle.effectiveSpeed || 0) > 0 ? 'RUNNING' : 'STOPPED',
      }
    })
  }, [vehicles, tick])
  const listPageSize = 20
  const listTotalPages = Math.max(1, Math.ceil(enrichedVehicles.length / listPageSize))
  const currentListPage = Math.min(listPage, listTotalPages)
  const listRows = enrichedVehicles.slice((currentListPage - 1) * listPageSize, currentListPage * listPageSize)

  return (
    <section className="vl-container">
      <div className="vl-header">
        <h2 className="vl-title">Live Asset Map</h2>
        <div className="vl-count">{enrichedVehicles.length} Markers</div>
      </div>

      <div className="vl-controls" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <label style={{ fontSize: 'var(--text-sm)', color: 'var(--t2)' }} htmlFor="mapStatusFilter">
          Status
        </label>
        <select
          id="mapStatusFilter"
          className="form-control"
          style={{ maxWidth: 180 }}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setListPage(1)
          }}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="grace">Grace</option>
          <option value="immobilized">Immobilized</option>
          <option value="paused">Paused</option>
          <option value="available">Available</option>
        </select>
        <select
          className="form-control"
          style={{ maxWidth: 180 }}
          value={connectivity}
          onChange={(e) => {
            setConnectivity(e.target.value)
            setListPage(1)
          }}
        >
          <option value="all">All Connectivity</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
        <select
          className="form-control"
          style={{ maxWidth: 180 }}
          value={movement}
          onChange={(e) => {
            setMovement(e.target.value)
            setListPage(1)
          }}
        >
          <option value="all">All Movement</option>
          <option value="running">Running</option>
          <option value="stopped">Stopped</option>
        </select>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--t2)' }}>
          Markers: {enrichedVehicles.length} | Active/Grace/Immobilized visible with movement filters
        </span>
      </div>

      <div className="card" style={{ padding: 10 }}>
        <div style={{ marginBottom: 6, fontSize: 'var(--text-sm)', color: 'var(--t3)', textTransform: 'uppercase' }}>
          Focus Vehicle
        </div>
        <div style={{ display: 'flex', maxHeight: 96, flexWrap: 'wrap', gap: 6, overflowY: 'auto' }}>
          {enrichedVehicles.slice(0, 24).map((vehicle) => (
            <button
              key={vehicle.id}
              className="vl-pill"
              type="button"
              onClick={() => {
                if (mapRef.current) mapRef.current.setView([vehicle.lat, vehicle.lng], 14)
              }}
            >
              {vehicle.id}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 560, overflow: 'hidden', borderRadius: 12, border: '1px solid var(--b1)' }}>
        <MapContainer
          center={[-6.25, 106.85]}
          zoom={11}
          className="h-full w-full"
          whenReady={(event) => {
            mapRef.current = event.target
          }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {enrichedVehicles.map((vehicle) => (
            <CircleMarker
              key={vehicle.id}
              center={[vehicle.lat, vehicle.lng]}
              radius={5}
              pathOptions={{ color: markerColor(vehicle.status) }}
            >
              <Popup>
                <div className="text-xs">
                  <div className="font-semibold">{vehicle.id}</div>
                  <div>{vehicle.plate}</div>
                  <div>Renter: {vehicle.customer || 'Unassigned'}</div>
                  <div>Phone: {vehicle.userPhone}</div>
                  <div>Program: {vehicle.programName}</div>
                  <div>Status: <span className="capitalize">{vehicle.status}</span></div>
                  <div>Connectivity: {vehicle.isOnline ? 'Online' : 'Offline'}</div>
                  <div>GPS: {vehicle.gpsStatus}</div>
                  <div>Last Ping: {new Date(vehicle.lastPingAt).toLocaleString('id-ID')}</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <div className="card" style={{ padding: 10 }}>
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)', textTransform: 'uppercase' }}>
            Vehicle Movement List
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>
            Running: {enrichedVehicles.filter((vehicle) => vehicle.movementState === 'RUNNING').length} | Stopped: {enrichedVehicles.filter((vehicle) => vehicle.movementState === 'STOPPED').length}
          </div>
        </div>
        <div style={{ overflowX: 'auto', border: '1px solid var(--b1)', borderRadius: 10 }}>
          <table className="vl-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>VEHICLE</th>
                <th>BRAND / MODEL</th>
                <th>STATUS</th>
                <th>MOVEMENT</th>
                <th>RENTER</th>
                <th>PROGRAM</th>
                <th>GPS</th>
                <th>LAST PING</th>
                <th>SPEED</th>
              </tr>
            </thead>
            <tbody>
              {listRows.length > 0 ? (
                listRows.map((vehicle) => (
                  <tr key={`map-list-${vehicle.id}`}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{vehicle.id}</div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>{vehicle.plate}</div>
                    </td>
                    <td>{vehicle.vehicleBrand} / {vehicle.model || '-'}</td>
                    <td>
                      <span
                        className="vl-status"
                        style={{
                          background: `${markerColor(vehicle.status)}22`,
                          color: markerColor(vehicle.status),
                        }}
                      >
                        {String(vehicle.status || '-').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span
                        className="vl-status"
                        style={{
                          background: vehicle.movementState === 'RUNNING' ? 'var(--dg1)' : 'var(--s3)',
                          color: vehicle.movementState === 'RUNNING' ? 'var(--dg)' : 'var(--t2)',
                        }}
                      >
                        {vehicle.movementState}
                      </span>
                    </td>
                    <td>
                      <div>{vehicle.customer || 'Unassigned'}</div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>{vehicle.userPhone}</div>
                    </td>
                    <td>{vehicle.programName}</td>
                    <td>
                      <span
                        className="vl-status"
                        style={{
                          background: gpsColor(vehicle.gpsStatus).bg,
                          color: gpsColor(vehicle.gpsStatus).color,
                        }}
                      >
                        {String(vehicle.gpsStatus || '-').toUpperCase()}
                      </span>
                    </td>
                    <td>{new Date(vehicle.lastPingAt).toLocaleString('id-ID')}</td>
                    <td>{Math.max(0, vehicle.effectiveSpeed || 0)} km/h</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ padding: 18, textAlign: 'center', color: 'var(--t3)' }}>
                    No vehicles available for current map filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="vl-pagination" style={{ marginTop: 8 }}>
          <div className="vl-page-info">
            Page {currentListPage} / {listTotalPages} ({enrichedVehicles.length} rows)
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="vl-page-btn" disabled={currentListPage <= 1} onClick={() => setListPage((p) => Math.max(1, p - 1))}>
              Prev
            </button>
            <button className="vl-page-btn" disabled={currentListPage >= listTotalPages} onClick={() => setListPage((p) => Math.min(listTotalPages, p + 1))}>
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function markerColor(status) {
  if (status === 'active') return '#10b981'
  if (status === 'grace') return '#f59e0b'
  if (status === 'immobilized') return '#ef4444'
  if (status === 'paused') return '#8b5cf6'
  return '#94a3b8'
}

function gpsColor(status) {
  if (status === 'Online') return { bg: 'var(--dg1)', color: 'var(--dg)' }
  if (status === 'Low Signal') return { bg: 'var(--dw1)', color: 'var(--dw)' }
  if (status === 'Tampered') return { bg: 'var(--dd1)', color: 'var(--dd)' }
  if (status === 'Offline') return { bg: 'var(--s3)', color: 'var(--t2)' }
  return { bg: 'rgba(148,163,184,0.2)', color: '#94a3b8' }
}

function hashCode(value) {
  let hash = 0
  for (let idx = 0; idx < value.length; idx += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(idx)
    hash |= 0
  }
  return hash
}
