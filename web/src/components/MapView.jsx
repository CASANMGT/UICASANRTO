import { useMemo, useRef, useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getState, getVehicles } from '../bridge/legacyRuntime'
import { useLegacyTick } from '../hooks/useLegacyTick'
import { Button } from './ui/button'
import { PageHeader, PageMeta, PageShell, PageTitle, StatCard, StatsGrid } from './ui/page'
import { Select } from './ui/select'

export function MapView() {
  const mapRef = useRef(null)
  const tick = useLegacyTick()
  const [status, setStatus] = useState('all')
  const [connectivity, setConnectivity] = useState('all')
  const [movement, setMovement] = useState('all')
  const [programFilter, setProgramFilter] = useState('all')
  const [gpsFilter, setGpsFilter] = useState('all')
  const [pingAgeFilter, setPingAgeFilter] = useState('all')
  const [speedBand, setSpeedBand] = useState('all')
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
        programId: program?.id || '',
        programName: program?.name || program?.shortName || '-',
        programType: program?.type || '-',
        programLabel: `${program?.name || program?.shortName || '-'} • ${program?.type || '-'}`,
        vehicleBrand: vehicle.brand || String(vehicle.model || '').split(' ')[0] || '-',
        gpsStatus: gps?.status || 'Unassigned',
        lastPingAt,
        pingAgeHours: Math.floor((Date.now() - new Date(lastPingAt).getTime()) / (60 * 60 * 1000)),
        movementState: (vehicle.effectiveSpeed || 0) > 0 ? 'RUNNING' : 'STOPPED',
      }
    })
  }, [vehicles, tick])
  const filteredVehicles = useMemo(() => {
    return enrichedVehicles.filter((vehicle) => {
      if (programFilter !== 'all' && String(vehicle.programId || '') !== programFilter) return false
      if (gpsFilter !== 'all' && String(vehicle.gpsStatus || '').toLowerCase() !== gpsFilter) return false
      if (pingAgeFilter === 'stale' && vehicle.pingAgeHours < 2) return false
      if (pingAgeFilter === 'fresh' && vehicle.pingAgeHours >= 2) return false
      if (speedBand === 'high' && Number(vehicle.effectiveSpeed || 0) < 40) return false
      if (speedBand === 'mid' && (Number(vehicle.effectiveSpeed || 0) < 10 || Number(vehicle.effectiveSpeed || 0) >= 40)) return false
      if (speedBand === 'low' && Number(vehicle.effectiveSpeed || 0) >= 10) return false
      return true
    })
  }, [enrichedVehicles, programFilter, gpsFilter, pingAgeFilter, speedBand])
  const listPageSize = 20
  const listTotalPages = Math.max(1, Math.ceil(filteredVehicles.length / listPageSize))
  const currentListPage = Math.min(listPage, listTotalPages)
  const listRows = filteredVehicles.slice((currentListPage - 1) * listPageSize, currentListPage * listPageSize)
  const mapStats = useMemo(
    () => ({
      total: filteredVehicles.length,
      running: filteredVehicles.filter((vehicle) => vehicle.movementState === 'RUNNING').length,
      stopped: filteredVehicles.filter((vehicle) => vehicle.movementState === 'STOPPED').length,
      online: filteredVehicles.filter((vehicle) => vehicle.isOnline).length,
    }),
    [filteredVehicles],
  )

  return (
    <PageShell>
      <PageHeader>
        <PageTitle>Live Asset Map</PageTitle>
        <PageMeta>{enrichedVehicles.length} Markers</PageMeta>
      </PageHeader>
      <StatsGrid>
        <StatCard label="Visible Markers" value={mapStats.total} />
        <StatCard label="Running" value={mapStats.running} valueClassName="text-emerald-700" />
        <StatCard label="Stopped" value={mapStats.stopped} valueClassName="text-amber-700" />
        <StatCard label="Online" value={mapStats.online} valueClassName="text-cyan-700" />
      </StatsGrid>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="text-sm text-slate-600" htmlFor="mapStatusFilter">
          Status
        </label>
        <Select
          id="mapStatusFilter"
          variant="legacy"
          className="max-w-[180px]"
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
        </Select>
        <Select
          variant="legacy"
          className="max-w-[180px]"
          value={connectivity}
          onChange={(e) => {
            setConnectivity(e.target.value)
            setListPage(1)
          }}
        >
          <option value="all">All Connectivity</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </Select>
        <Select
          variant="legacy"
          className="max-w-[180px]"
          value={movement}
          onChange={(e) => {
            setMovement(e.target.value)
            setListPage(1)
          }}
        >
          <option value="all">All Movement</option>
          <option value="running">Running</option>
          <option value="stopped">Stopped</option>
        </Select>
        <span className="text-sm text-slate-600">
          Markers: {filteredVehicles.length} | Active/Grace/Immobilized visible with movement filters
        </span>
      </div>
      <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        <Select
          variant="legacy"
          value={programFilter}
          onChange={(e) => {
            setProgramFilter(e.target.value)
            setListPage(1)
          }}
        >
          <option value="all">All Programs</option>
          {[...new Map(enrichedVehicles.filter((vehicle) => vehicle.programId).map((vehicle) => [vehicle.programId, vehicle.programLabel])).entries()].map(([programId, programLabel]) => (
            <option key={programId} value={programId}>
              {programLabel}
            </option>
          ))}
        </Select>
        <Select
          variant="legacy"
          value={gpsFilter}
          onChange={(e) => {
            setGpsFilter(e.target.value)
            setListPage(1)
          }}
        >
          <option value="all">All GPS Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="low signal">Low Signal</option>
          <option value="tampered">Tampered</option>
          <option value="unassigned">Unassigned</option>
        </Select>
        <Select
          variant="legacy"
          value={pingAgeFilter}
          onChange={(e) => {
            setPingAgeFilter(e.target.value)
            setListPage(1)
          }}
        >
          <option value="all">All Ping Ages</option>
          <option value="stale">Stale (&gt;= 2h)</option>
          <option value="fresh">Fresh (&lt; 2h)</option>
        </Select>
        <Select
          variant="legacy"
          value={speedBand}
          onChange={(e) => {
            setSpeedBand(e.target.value)
            setListPage(1)
          }}
        >
          <option value="all">All Speed Bands</option>
          <option value="high">High (&gt;=40 km/h)</option>
          <option value="mid">Mid (10-39 km/h)</option>
          <option value="low">Low (&lt;10 km/h)</option>
        </Select>
      </div>

      <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-1.5 text-xs uppercase text-slate-500">
          Focus Vehicle
        </div>
        <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
          {filteredVehicles.slice(0, 24).map((vehicle) => (
            <button
              key={vehicle.id}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
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

      <div className="h-[560px] overflow-hidden rounded-xl border border-slate-200">
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
          {filteredVehicles.map((vehicle) => (
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

      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs uppercase text-slate-500">
            Vehicle Movement List
          </div>
          <div className="text-xs text-slate-500">
            Running: {filteredVehicles.filter((vehicle) => vehicle.movementState === 'RUNNING').length} | Stopped: {filteredVehicles.filter((vehicle) => vehicle.movementState === 'STOPPED').length}
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-[1040px] w-full border-collapse text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">VEHICLE</th>
                <th className="px-3 py-2 text-left">BRAND / MODEL</th>
                <th className="px-3 py-2 text-left">STATUS</th>
                <th className="px-3 py-2 text-left">MOVEMENT</th>
                <th className="px-3 py-2 text-left">RENTER</th>
                <th className="px-3 py-2 text-left">PROGRAM</th>
                <th className="px-3 py-2 text-left">GPS</th>
                <th className="px-3 py-2 text-left">LAST PING</th>
                <th className="px-3 py-2 text-left">SPEED</th>
              </tr>
            </thead>
            <tbody>
              {listRows.length > 0 ? (
                listRows.map((vehicle) => (
                  <tr key={`map-list-${vehicle.id}`} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <div className="font-bold text-slate-900">{vehicle.id}</div>
                      <div className="text-xs text-slate-500">{vehicle.plate}</div>
                    </td>
                    <td className="px-3 py-2">{vehicle.vehicleBrand} / {vehicle.model || '-'}</td>
                    <td className="px-3 py-2">
                      <span
                        className="inline-flex rounded-full px-2 py-1 text-xs font-bold"
                        style={{ background: `${markerColor(vehicle.status)}22`, color: markerColor(vehicle.status) }}
                      >
                        {String(vehicle.status || '-').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${
                          vehicle.movementState === 'RUNNING'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {vehicle.movementState}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div>{vehicle.customer || 'Unassigned'}</div>
                      <div className="text-xs text-slate-500">{vehicle.userPhone}</div>
                    </td>
                    <td className="px-3 py-2">{vehicle.programName}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${gpsColor(vehicle.gpsStatus)}`}
                      >
                        {String(vehicle.gpsStatus || '-').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2">{new Date(vehicle.lastPingAt).toLocaleString('id-ID')}</td>
                    <td className="px-3 py-2">{Math.max(0, vehicle.effectiveSpeed || 0)} km/h</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-sm text-slate-500">
                    No vehicles available for current map filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-600">
            Page {currentListPage} / {listTotalPages} ({filteredVehicles.length} rows)
          </div>
          <div className="flex gap-2">
            <Button
              variant="legacyGhost"
              size="legacy"
              disabled={currentListPage <= 1}
              onClick={() => setListPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <Button
              variant="legacyGhost"
              size="legacy"
              disabled={currentListPage >= listTotalPages}
              onClick={() => setListPage((p) => Math.min(listTotalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
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
  if (status === 'Online') return 'bg-emerald-100 text-emerald-700'
  if (status === 'Low Signal') return 'bg-amber-100 text-amber-700'
  if (status === 'Tampered') return 'bg-rose-100 text-rose-700'
  if (status === 'Offline') return 'bg-slate-100 text-slate-700'
  return 'bg-slate-100 text-slate-500'
}

function hashCode(value) {
  let hash = 0
  for (let idx = 0; idx < value.length; idx += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(idx)
    hash |= 0
  }
  return hash
}
