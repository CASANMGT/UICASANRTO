import { useMemo, useRef, useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getVehicles } from '../bridge/legacyRuntime'
import { useLegacyTick } from '../hooks/useLegacyTick'

export function MapView() {
  const mapRef = useRef(null)
  const tick = useLegacyTick()
  const [status, setStatus] = useState('all')
  const [connectivity, setConnectivity] = useState('all')
  const [movement, setMovement] = useState('all')
  const vehicles = useMemo(() => {
    void tick
    let list = getVehicles({ status })
    if (connectivity === 'online') list = list.filter((vehicle) => vehicle.isOnline)
    if (connectivity === 'offline') list = list.filter((vehicle) => !vehicle.isOnline)
    if (movement === 'running') list = list.filter((vehicle) => (vehicle.speed || 0) > 0)
    if (movement === 'stopped') list = list.filter((vehicle) => (vehicle.speed || 0) <= 0)
    return list
  }, [status, connectivity, movement, tick])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-slate-300" htmlFor="mapStatusFilter">
          Status
        </label>
        <select
          id="mapStatusFilter"
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="grace">Grace</option>
          <option value="immobilized">Immobilized</option>
          <option value="paused">Paused</option>
          <option value="available">Available</option>
        </select>
        <select
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={connectivity}
          onChange={(e) => setConnectivity(e.target.value)}
        >
          <option value="all">All Connectivity</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
        <select
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={movement}
          onChange={(e) => setMovement(e.target.value)}
        >
          <option value="all">All Movement</option>
          <option value="running">Running</option>
          <option value="stopped">Stopped</option>
        </select>
        <span className="text-xs text-slate-300">Markers: {vehicles.length}</span>
      </div>
      <div className="rounded border border-slate-800 bg-slate-900/40 p-2">
        <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">Focus Vehicle</div>
        <div className="flex max-h-24 flex-wrap gap-1 overflow-y-auto">
          {vehicles.slice(0, 24).map((vehicle) => (
            <button
              key={vehicle.id}
              className="rounded bg-slate-700 px-2 py-1 text-xs"
              onClick={() => {
                if (mapRef.current) mapRef.current.setView([vehicle.lat, vehicle.lng], 14)
              }}
            >
              {vehicle.id}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[560px] overflow-hidden rounded border border-slate-800">
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
          {vehicles.map((vehicle) => (
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
                  <div className="capitalize">{vehicle.status}</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
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
