import { useMemo, useRef, useState } from 'react'
import { usePagination } from '../context/PaginationContext'
import { divIcon } from 'leaflet'
import { MapContainer, Marker, Polygon, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  CITIES_POLYGONS,
  PROVINCES_GEOFENCE,
  OUT_OF_ZONE_ACTIONS,
  getDistanceToGeofenceBoundary,
  getGeofenceSpeedLimit,
  getState,
  getVehicles,
  isVehicleInProgramZone,
} from '../bridge/legacyRuntime'
import { useLegacyTick } from '../hooks/useLegacyTick'
import { Button } from './ui/button'
import { CHECKBOX_CLS, PAGE_SIZE, PageFooter, PageHeader, PageMeta, PageShell, PageTitle, StatCard, StatsGrid, TABLE_MIN_WIDTH, PaginationInfo } from './ui/page'
import { Select } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

/** Convert city polygon data to Leaflet positions. GeoJSON [lng,lat] -> Leaflet [lat,lng] */
function toLeafletPositions(cityData) {
  if (!cityData || !Array.isArray(cityData) || cityData.length === 0) return []
  const first = cityData[0]
  if (!first || !Array.isArray(first)) return []
  if (typeof first[0] === 'number') {
    if (cityData.length < 3) return []
    return [cityData.map(([lng, lat]) => [lat, lng])]
  }
  return cityData
    .map((ring) => (Array.isArray(ring) ? ring.map(([lng, lat]) => [lat, lng]) : []))
    .filter((r) => r.length >= 3)
}

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
  const [listPage, setListPage] = usePagination('map')
  const [geofenceCities, setGeofenceCities] = useState([])
  const [geofenceExpandedProvinces, setGeofenceExpandedProvinces] = useState(['dki'])
  const vehicles = useMemo(() => {
    void tick
    const state = getState()
    const programsById = new Map((state.programs || []).map((p) => [p.id, p]))
    let list = getVehicles({ status }).map((vehicle) => {
      const program = programsById.get(vehicle.programId)
      const speedLimit = getGeofenceSpeedLimit(vehicle, program, 80)
      const rawSpeed = vehicle.status === 'immobilized' ? 0 : (vehicle.speed || 0)
      const effectiveSpeed = Math.min(rawSpeed, speedLimit)
      return { ...vehicle, effectiveSpeed }
    })
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
      const headingDeg = normalizeDegree(gps?.headingDeg ?? gps?.heading ?? pseudoHeading(vehicle.id || 'veh'))
      const gpsOnline = String(gps?.status || '').toLowerCase() !== 'offline' && String(gps?.status || '').toLowerCase() !== 'unassigned'
      const signalPercent = normalizePercent(gps?.signalPercent ?? pseudoSignal(gps?.status || (gpsOnline ? 'Online' : 'Offline'), vehicle.id || 'veh'))
      const inZone = program ? isVehicleInProgramZone(vehicle, program) : null
      const distToBoundary = program && inZone === false ? getDistanceToGeofenceBoundary(vehicle, program) : Infinity
      const bufferKm = Math.max(0, Number(program?.outOfZoneBufferKm) ?? 2)
      const geofenceLimit = getGeofenceSpeedLimit(vehicle, program, 80)
      const speedLimitedByGeofence =
        program?.applyOutOfZoneSpeedLimit !== false &&
        inZone === false &&
        distToBoundary > bufferKm &&
        ((vehicle.speed || 0) > geofenceLimit || geofenceLimit === 0)
      const outOfZoneAction = speedLimitedByGeofence && program?.outOfZoneAction === OUT_OF_ZONE_ACTIONS.IMMOBILIZED ? 'immobilized' : 'speedLimit'
      return {
        ...vehicle,
        program,
        userPhone: user?.phone || vehicle.phone || '-',
        programId: program?.id || '',
        programName: program?.name || program?.shortName || '-',
        programType: program?.type || '-',
        programLabel: `${program?.name || program?.shortName || '-'} • ${program?.type || '-'}`,
        programGeofenceCities: program?.geofenceCities || [],
        vehicleBrand: vehicle.brand || String(vehicle.model || '').split(' ')[0] || '-',
        gpsStatus: gps?.status || 'Unassigned',
        gpsOnline,
        signalPercent,
        lastPingAt,
        pingAgeHours: Math.floor((Date.now() - new Date(lastPingAt).getTime()) / (60 * 60 * 1000)),
        movementState: (vehicle.effectiveSpeed || 0) > 0 ? 'RUNNING' : 'STOPPED',
        headingDeg,
        inZone,
        speedLimitedByGeofence,
        outOfZoneAction,
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
  const listPageSize = PAGE_SIZE
  const listTotalPages = Math.max(1, Math.ceil(filteredVehicles.length / listPageSize))
  const currentListPage = Math.min(listPage, listTotalPages)
  const listRows = filteredVehicles.slice((currentListPage - 1) * listPageSize, currentListPage * listPageSize)
  const mapStats = useMemo(
    () => ({
      total: filteredVehicles.length,
      inZone: filteredVehicles.filter((v) => v.inZone === true).length,
      outZone: filteredVehicles.filter((v) => v.inZone === false).length,
      online: filteredVehicles.filter((vehicle) => vehicle.isOnline).length,
    }),
    [filteredVehicles],
  )

  const geofenceCitiesToShow = useMemo(() => {
    const cities = new Set()
    if (programFilter !== 'all') {
      const state = getState()
      const program = (state.programs || []).find((p) => p.id === programFilter)
      if (program) {
        for (const city of program.geofenceCities || []) cities.add(city)
      }
    }
    for (const city of geofenceCities) cities.add(city)
    return cities.size > 0 ? [...cities].sort() : []
  }, [geofenceCities, programFilter, tick])

  const hasGeofenceOverlay = geofenceCitiesToShow.length > 0

  return (
    <PageShell>
      <PageHeader>
        <PageTitle>Live Asset Map</PageTitle>
        <PageMeta>{enrichedVehicles.length} Markers</PageMeta>
      </PageHeader>
      <StatsGrid>
        <StatCard label="Visible Markers" value={mapStats.total} />
        {hasGeofenceOverlay && (
          <>
            <StatCard label="In Zone" value={mapStats.inZone} valueClassName="text-emerald-700" />
            <StatCard label="Out of Zone" value={mapStats.outZone} valueClassName="text-rose-700" />
          </>
        )}
        <StatCard label="Online" value={mapStats.online} valueClassName="text-cyan-700" />
      </StatsGrid>

      <div className="mb-2 rounded-lg border border-border bg-muted/80 px-3 py-2">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Geofence (propinsi → kota/kab)</span>
          {geofenceCities.length > 0 && (
            <button
              type="button"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
              onClick={() => setGeofenceCities([])}
            >
              Clear
            </button>
          )}
        </div>
        <div className="space-y-1">
          {PROVINCES_GEOFENCE.map((prov) => {
            const provinceCities = prov.cities
            const selectedCount = provinceCities.filter((c) => geofenceCities.includes(c)).length
            const allSelected = selectedCount === provinceCities.length
            const someSelected = selectedCount > 0
            const expanded = geofenceExpandedProvinces.includes(prov.id)
            return (
              <div key={prov.id} className="rounded border border-border bg-background/80">
                <div
                  className="flex cursor-pointer items-center gap-2 px-2 py-1.5 hover:bg-muted/50"
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
                      setGeofenceCities((prev) =>
                        allSelected
                          ? prev.filter((c) => !provinceCities.includes(c))
                          : [...new Set([...prev, ...provinceCities])],
                      )
                      setListPage(1)
                    }}
                    className={CHECKBOX_CLS}
                  />
                  <span className="flex-1 text-sm font-medium text-foreground">{prov.label}</span>
                  {someSelected && (
                    <span className="text-xs text-muted-foreground">
                      {selectedCount}/{provinceCities.length}
                    </span>
                  )}
                  <span className="text-muted-foreground">{expanded ? '▼' : '▶'}</span>
                </div>
                {expanded && (
                  <div className="flex flex-wrap gap-x-2 gap-y-1 border-t border-border bg-muted/30 px-2 py-1.5 pl-6">
                    {provinceCities.map((city) => (
                      <label
                        key={city}
                        className="flex cursor-pointer items-center gap-1.5 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={geofenceCities.includes(city)}
                          onChange={(e) => {
                            setGeofenceCities((prev) =>
                              e.target.checked ? [...prev, city] : prev.filter((c) => c !== city),
                            )
                            setListPage(1)
                          }}
                          className={CHECKBOX_CLS}
                        />
                        <span>{city}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="h-[560px] overflow-hidden rounded-lg border border-border">
        <MapContainer
          center={[-6.35, 107.0]}
          zoom={9}
          className="h-full w-full"
          whenReady={(event) => {
            mapRef.current = event.target
          }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {geofenceCitiesToShow.map((cityName) => {
            const poly = CITIES_POLYGONS[cityName]
            if (!poly) return null
            const positionsList = toLeafletPositions(poly)
            return positionsList.map((positions, idx) => (
              <Polygon
                key={`geofence-${cityName}-${idx}`}
                positions={positions}
                pathOptions={{
                  color: 'rgba(14, 165, 233, 0.8)',
                  fillColor: 'rgba(14, 165, 233, 0.15)',
                  fillOpacity: 0.4,
                  weight: 2,
                }}
                eventHandlers={{
                  add: (e) => e.target.bringToBack(),
                }}
              />
            ))
          })}
          {filteredVehicles.map((vehicle) => (
            <Marker
              key={vehicle.id}
              position={[vehicle.lat, vehicle.lng]}
              icon={movementMarkerIcon(vehicle.status, vehicle.headingDeg, vehicle.movementState)}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{vehicle.id}</div>
                  <div>{vehicle.plate}</div>
                  <div>Renter: {vehicle.customer || 'Unassigned'}</div>
                  <div>Phone: {vehicle.userPhone}</div>
                  <div>Program: {vehicle.programName}</div>
                  <div>
                    Zone:{' '}
                    {vehicle.inZone === true ? (
                      <span className="font-semibold text-emerald-600">IN ZONE</span>
                    ) : vehicle.inZone === false ? (
                      <span className="font-semibold text-rose-600">OUT OF ZONE</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                  <div>
                    Speed: {Math.max(0, vehicle.effectiveSpeed || 0)} km/h
                    {vehicle.speedLimitedByGeofence && (
                      <span className="ml-1 text-amber-600" title={vehicle.outOfZoneAction === 'immobilized' ? 'Immobilized (out of zone beyond buffer)' : 'Speed limited (out of zone beyond buffer)'}>
                        ({vehicle.outOfZoneAction === 'immobilized' ? 'immobilized' : 'limited'})
                      </span>
                    )}
                  </div>
                  <div>Status: <span className="capitalize">{vehicle.status}</span></div>
                  <div>Connectivity: {vehicle.isOnline ? 'Online' : 'Offline'}</div>
                  <div>GPS: {vehicle.gpsStatus}</div>
                  <div>Last Ping: {new Date(vehicle.lastPingAt).toLocaleString('id-ID')}</div>
                  <div>Heading: {vehicle.headingDeg}°</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <div className="mb-3 mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="mapStatusFilter">
            Status
          </label>
          <Select
            id="mapStatusFilter"
            variant="legacy"
            className="w-full"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setListPage(1)
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="grace">Grace</option>
            <option value="immobilized">Immobilized</option>
            <option value="paused">Paused</option>
            <option value="available">Available</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="mapConnectivityFilter">
            Connectivity
          </label>
          <Select
            id="mapConnectivityFilter"
            variant="legacy"
            className="w-full"
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
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="mapMovementFilter">
            Movement
          </label>
          <Select
            id="mapMovementFilter"
            variant="legacy"
            className="w-full"
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
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="mapProgramFilter">
            Program (geofence)
          </label>
          <Select
            id="mapProgramFilter"
            variant="legacy"
            className="w-full"
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
        </div>
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
      <p className="mb-2 text-sm text-muted-foreground">
        Markers: {filteredVehicles.length} — filtered by <strong>Status</strong>, Connectivity, Movement, Program, GPS, ping age, and speed.
      </p>

      <div className="mt-3 rounded-lg border border-border bg-muted p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs uppercase text-muted-foreground">
            Vehicle Movement List
          </div>
          <div className="text-xs text-muted-foreground">
            In zone: {mapStats.inZone} | Out: {mapStats.outZone} | Running: {filteredVehicles.filter((v) => v.movementState === 'RUNNING').length} | Stopped: {filteredVehicles.filter((v) => v.movementState === 'STOPPED').length}
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table density="legacy" className={TABLE_MIN_WIDTH}>
            <TableHeader tone="legacy">
              <TableRow tone="legacy">
                <TableHead>VEHICLE</TableHead>
                <TableHead>BRAND / MODEL</TableHead>
                <TableHead>RENTER</TableHead>
                <TableHead>PROGRAM</TableHead>
                <TableHead>ZONE</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>MOVEMENT</TableHead>
                <TableHead>SPEED</TableHead>
                <TableHead>GPS</TableHead>
                <TableHead>LAST PING</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listRows.length > 0 ? (
                listRows.map((vehicle) => (
                  <TableRow
                    key={`map-list-${vehicle.id}`}
                    className="cursor-pointer"
                    tone="legacy"
                    title="Click row to zoom to marker"
                    onClick={() => {
                      if (mapRef.current) mapRef.current.setView([vehicle.lat, vehicle.lng], 14)
                    }}
                  >
                    <TableCell>
                      <div className="font-bold text-foreground">{vehicle.id}</div>
                      <div className="text-xs text-muted-foreground">{vehicle.plate}</div>
                    </TableCell>
                    <TableCell>{vehicle.vehicleBrand} / {vehicle.model || '-'}</TableCell>
                    <TableCell>
                      <div>{vehicle.customer || 'Unassigned'}</div>
                      <div className="text-xs text-muted-foreground">{vehicle.userPhone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground">{vehicle.programName}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(vehicle.programGeofenceCities || []).length > 0 ? (
                          (vehicle.programGeofenceCities || []).map((city) => (
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
                      </div>
                    </TableCell>
                    <TableCell>
                      {vehicle.inZone === true ? (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">IN ZONE</span>
                      ) : vehicle.inZone === false ? (
                        <span className="inline-flex rounded-full bg-rose-100 px-2 py-1 text-xs font-bold text-rose-700">OUT</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-flex rounded-full px-2 py-1 text-xs font-bold"
                        style={{ background: `${markerColor(vehicle.status)}22`, color: markerColor(vehicle.status) }}
                      >
                        {String(vehicle.status || '-').toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${
                          vehicle.movementState === 'RUNNING'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        {vehicle.movementState}
                      </span>
                    </TableCell>
                    <TableCell>{Math.max(0, vehicle.effectiveSpeed || 0)} km/h</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${gpsColor(vehicle.gpsStatus)}`}
                      >
                        {String(vehicle.gpsStatus || '-').toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="mb-1 flex items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${
                            vehicle.gpsOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-foreground'
                          }`}
                        >
                          {vehicle.gpsOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${vehicle.signalPercent >= 60 ? 'bg-emerald-500' : vehicle.signalPercent >= 30 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${vehicle.signalPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{vehicle.signalPercent}%</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{timeAgo(vehicle.lastPingAt)}</div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow tone="legacy">
                  <TableCell colSpan={10} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No vehicles available for current map filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <PageFooter>
          <Button
            variant="legacyGhost"
            size="legacy"
            disabled={currentListPage <= 1}
            onClick={() => setListPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <PaginationInfo currentPage={currentListPage} totalPages={listTotalPages} totalItems={filteredVehicles.length} itemName="vehicles" />
          <Button
            variant="legacyGhost"
            size="legacy"
            disabled={currentListPage >= listTotalPages}
            onClick={() => setListPage((p) => Math.min(listTotalPages, p + 1))}
          >
            Next
          </Button>
        </PageFooter>
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
  if (status === 'Offline') return 'bg-muted text-foreground'
  return 'bg-muted text-muted-foreground'
}

function hashCode(value) {
  let hash = 0
  for (let idx = 0; idx < value.length; idx += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(idx)
    hash |= 0
  }
  return hash
}

function normalizeDegree(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  const deg = Math.round(n) % 360
  return deg < 0 ? deg + 360 : deg
}

function pseudoHeading(seed) {
  return Math.abs(hashCode(String(seed || 'veh'))) % 360
}

function normalizePercent(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
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

function movementMarkerIcon(status, headingDeg, movementState) {
  const color = markerColor(status)
  if (movementState === 'STOPPED') {
    return divIcon({
      className: '',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -10],
      html: `<div style="width:18px;height:18px;border-radius:9999px;background:${color};border:2px solid #ffffff;box-shadow:0 0 0 1px rgba(15,23,42,0.15);"></div>`,
    })
  }
  return divIcon({
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -10],
    html: `<div style="width:22px;height:22px;display:flex;align-items:center;justify-content:center;transform:rotate(${headingDeg}deg);">
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2L20 20L12 16L4 20L12 2Z" fill="${color}" stroke="#ffffff" stroke-width="1.4" />
      </svg>
    </div>`,
  })
}
