import cityPolygonsData from '../data/cityPolygons.json'

const runtimeState = {
  loaded: false,
  loadingPromise: null,
}

/** City boundary polygons from cityPolygons.json. Format: { cityName: [[lng,lat],...] | [ [[lng,lat],...], ... ] } */
export const CITIES_POLYGONS = cityPolygonsData || {}

/** City to province (propinsi) mapping for grouped geofence filter */
const CITY_TO_PROVINCE = {
  Jakarta: 'DKI Jakarta',
  Bekasi: 'Jawa Barat',
  'Kabupaten Bekasi': 'Jawa Barat',
  'Kota Bekasi': 'Jawa Barat',
  Depok: 'Jawa Barat',
  Bogor: 'Jawa Barat',
  'Kabupaten Bogor': 'Jawa Barat',
  'Kota Bogor': 'Jawa Barat',
  'Kabupaten Purwakarta': 'Jawa Barat',
  'Kabupaten Karawang': 'Jawa Barat',
  'Kabupaten Bandung Barat': 'Jawa Barat',
  'Kota Bandung': 'Jawa Barat',
  'Kabupaten Bandung': 'Jawa Barat',
  'Kota Cimahi': 'Jawa Barat',
  'Kabupaten Sumedang': 'Jawa Barat',
  'Kabupaten Subang': 'Jawa Barat',
  Bandung: 'Jawa Barat',
  'Kabupaten Tangerang': 'Banten',
  'Kota Tangerang': 'Banten',
  Tangerang: 'Banten',
  'Tangerang Selatan': 'Banten',
  Surabaya: 'Jawa Timur',
  Semarang: 'Jawa Tengah',
  Yogyakarta: 'DIY Yogyakarta',
  Medan: 'Sumatera Utara',
}

/** Provinces (propinsi) in display order; cities filtered to those with polygon data */
const PROVINCES_RAW = [
  { id: 'dki', label: 'DKI Jakarta', cities: ['Jakarta'] },
  { id: 'banten', label: 'Banten', cities: ['Tangerang', 'Tangerang Selatan', 'Kabupaten Tangerang', 'Kota Tangerang'] },
  {
    id: 'jabar',
    label: 'Jawa Barat',
    cities: [
      'Bekasi',
      'Kabupaten Bekasi',
      'Kota Bekasi',
      'Depok',
      'Bogor',
      'Kabupaten Bogor',
      'Kota Bogor',
      'Kabupaten Purwakarta',
      'Kabupaten Karawang',
      'Kabupaten Bandung Barat',
      'Kota Bandung',
      'Kabupaten Bandung',
      'Kota Cimahi',
      'Kabupaten Sumedang',
      'Kabupaten Subang',
      'Bandung',
    ],
  },
]

export const PROVINCES_GEOFENCE = PROVINCES_RAW.map((p) => ({
  ...p,
  cities: p.cities.filter((c) => CITIES_POLYGONS[c]),
})).filter((p) => p.cities.length > 0)

/** Flat list of all geofence cities (for program geofenceCities, etc.) */
export const CITIES_GEOFENCE = [...new Set(PROVINCES_RAW.flatMap((p) => p.cities).filter((c) => CITIES_POLYGONS[c]))].sort()

/** Cities where program pickup locations are (tangkas/maka=Jakarta, united=Bekasi) */
const PROGRAM_CITY_MAP = { tangkas: 'Jakarta', maka: 'Jakarta', united: 'Bekasi' }

/**
 * Ray-casting point-in-polygon. Point [lat,lng], polygon rings as [[lng,lat],[lng,lat],...].
 */
function pointInPolygonSimple(point, polygon) {
  const [lat, lng] = point
  const rings = Array.isArray(polygon?.[0]?.[0]) ? polygon : [polygon]
  for (const vs of rings) {
    if (!vs || vs.length < 3) continue
    let inside = false
    const n = vs.length
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = vs[i][0]
      const yi = vs[i][1]
      const xj = vs[j][0]
      const yj = vs[j][1]
      if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
    }
    if (inside) return true
  }
  return false
}

/**
 * Check if vehicle is inside any program geofence (cities where we have program pickup locations).
 */
export function isInProgramGeofence(vehicle) {
  const lat = Number(vehicle?.lat)
  const lng = Number(vehicle?.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  const point = [lat, lng]
  const programCities = new Set(Object.values(PROGRAM_CITY_MAP))
  for (const city of programCities) {
    const poly = CITIES_POLYGONS[city]
    if (poly && pointInPolygonSimple(point, poly)) return true
  }
  return false
}

/**
 * Check if vehicle is inside its program's geofence zone. Uses program.geofenceCities.
 */
export function isVehicleInProgramZone(vehicle, program) {
  if (!vehicle || !program) return null
  const lat = Number(vehicle.lat)
  const lng = Number(vehicle.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const cities = program?.geofenceCities
  if (!Array.isArray(cities) || cities.length === 0) return null
  const point = [lat, lng]
  for (const city of cities) {
    const poly = CITIES_POLYGONS[city]
    if (poly && pointInPolygonSimple(point, poly)) return true
  }
  return false
}

/** Haversine distance in km. Points as [lat, lng]. */
function haversineKm(a, b) {
  const R = 6371
  const dLat = ((b[0] - a[0]) * Math.PI) / 180
  const dLng = ((b[1] - a[1]) * Math.PI) / 180
  const lat1 = (a[0] * Math.PI) / 180
  const lat2 = (b[0] * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

/** Distance from point [lat,lng] to line segment a–b (vertices as [lng,lat] in GeoJSON). */
function distancePointToSegment(point, a, b) {
  const [plat, plng] = point
  const [ax, ay] = a
  const [bx, by] = b
  const segLng = bx - ax
  const segLat = by - ay
  const denom = segLng * segLng + segLat * segLat
  if (!Number.isFinite(denom) || denom === 0) return haversineKm([plat, plng], [ay, ax])
  let t = ((plng - ax) * segLng + (plat - ay) * segLat) / denom
  t = Math.max(0, Math.min(1, t))
  const nearestLng = ax + t * segLng
  const nearestLat = ay + t * segLat
  return haversineKm([plat, plng], [nearestLat, nearestLng])
}

/** Min distance (km) from point [lat,lng] to polygon boundary. Polygon: [[lng,lat],...] or rings. */
function distanceToPolygonBoundary(point, polygon) {
  const rings = Array.isArray(polygon?.[0]?.[0]) ? polygon : [polygon]
  let minDist = Infinity
  for (const vs of rings) {
    if (!vs || vs.length < 2) continue
    const n = vs.length
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const d = distancePointToSegment(point, vs[j], vs[i])
      if (d < minDist) minDist = d
    }
  }
  return minDist
}

/** Distance (km) from vehicle to nearest point on program geofence boundary. Infinity if in zone or no geofence. */
export function getDistanceToGeofenceBoundary(vehicle, program) {
  try {
    if (!vehicle || !program) return Infinity
    const lat = Number(vehicle.lat)
    const lng = Number(vehicle.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return Infinity
    const cities = program?.geofenceCities
    if (!Array.isArray(cities) || cities.length === 0) return Infinity
    if (!CITIES_POLYGONS || typeof CITIES_POLYGONS !== 'object') return Infinity
    if (isVehicleInProgramZone(vehicle, program)) return Infinity
    const point = [lat, lng]
    let minDist = Infinity
    for (const city of cities) {
      const poly = CITIES_POLYGONS[city]
      if (poly) {
        const d = distanceToPolygonBoundary(point, poly)
        if (Number.isFinite(d) && d < minDist) minDist = d
      }
    }
    return minDist
  } catch {
    return Infinity
  }
}

/** Default buffer (km): beyond this distance from boundary, apply rule. */
export const DEFAULT_OUT_OF_ZONE_BUFFER_KM = 2

/** Default speed limit (km/h) when action is speedLimit. */
export const DEFAULT_OUT_OF_ZONE_SPEED_LIMIT_KMH = 15

/** Out-of-zone actions: immobilized (0 km/h) or speedLimit (cap at configured km/h). */
export const OUT_OF_ZONE_ACTIONS = { IMMOBILIZED: 'immobilized', SPEED_LIMIT: 'speedLimit' }

/**
 * Effective speed limit for vehicle based on program geofence rules.
 * Returns limit in km/h: 0 = immobilized, else max allowed speed.
 * When in zone or within buffer: returns defaultLimit (no cap).
 */
export function getGeofenceSpeedLimit(vehicle, program, defaultLimit = 80) {
  try {
    if (!vehicle || !program) return defaultLimit
    if (program.applyOutOfZoneSpeedLimit !== true) return defaultLimit
    if (isVehicleInProgramZone(vehicle, program)) return defaultLimit
    const dist = getDistanceToGeofenceBoundary(vehicle, program)
    if (!Number.isFinite(dist)) return defaultLimit
    const bufferKm = Math.max(0, Number(program.outOfZoneBufferKm) || DEFAULT_OUT_OF_ZONE_BUFFER_KM)
    if (dist <= bufferKm) return defaultLimit
    const action = program.outOfZoneAction === OUT_OF_ZONE_ACTIONS.IMMOBILIZED ? OUT_OF_ZONE_ACTIONS.IMMOBILIZED : OUT_OF_ZONE_ACTIONS.SPEED_LIMIT
    if (action === OUT_OF_ZONE_ACTIONS.IMMOBILIZED) return 0
    const limitKmh = Math.max(0, Math.min(80, Number(program.outOfZoneSpeedLimitKmh) || DEFAULT_OUT_OF_ZONE_SPEED_LIMIT_KMH))
    return limitKmh
  } catch {
    return defaultLimit
  }
}

/** Cities to show in "From program" mode (Jakarta, Bekasi - where partners operate) */
export const PROGRAM_GEOFENCE_CITIES = ['Jakarta', 'Bekasi']

/** Default geofence cities per partner (program zone) */
const DEFAULT_GEOFENCE_BY_PARTNER = {
  tangkas: ['Jakarta'],
  maka: ['Jakarta'],
  united: ['Bekasi'],
}

const LISTENERS_EVENT = 'legacy-state-updated'
const PARTNERS = ['tangkas', 'maka', 'united']
const MODELS = ['Zeeho AE8', 'Maka One', 'United MX1200']
const BRANDS = ['Zeeho', 'Maka', 'United']
const STATUSES = ['active', 'grace', 'immobilized', 'paused', 'available']
const GPS_STATUSES = ['Online', 'Offline', 'Low Signal', 'Tampered']
const INDONESIAN_FIRST_NAMES = [
  'Ahmad', 'Budi', 'Dewi', 'Eko', 'Fajar', 'Gita', 'Hendra', 'Indra', 'Joko', 'Kartika',
  'Lukman', 'Maya', 'Nanda', 'Putri', 'Rizky', 'Sari', 'Taufik', 'Vina', 'Wahyu', 'Yuni',
]
const INDONESIAN_LAST_NAMES = [
  'Pratama', 'Santoso', 'Wijaya', 'Saputra', 'Kusuma', 'Hidayat', 'Nugroho', 'Lestari', 'Wibowo', 'Siregar',
  'Ramadhan', 'Firmansyah', 'Setiawan', 'Permana', 'Maulana', 'Syahputra', 'Aulia', 'Kurniawan', 'Hardianto', 'Anjani',
]
const PROGRAM_PICKUP_LOCATIONS = {
  tangkas: 'Tangkas Hub - Kemayoran',
  maka: 'Maka Center - Tebet',
  united: 'United Point - Bekasi Barat',
}
const HANDOVER_CHECKLIST_TEMPLATE = {
  identityVerified: false,
  vehicleConditionChecked: false,
  tireConditionChecked: false,
  keyHandoverChecked: false,
  stnkVerified: false,
  contractAcknowledged: false,
  appStatusUpdated: false,
}
const HANDOVER_PHOTO_TEMPLATE = {
  handover: '',
}

let localState = {
  vehicles: [],
  users: [],
  transactions: [],
  gpsDevices: [],
  programs: [],
  rtoApplications: [],
  filter: { partner: 'all', status: 'all', search: '', program: 'all' },
}

function normalizeDataIntegrity(state) {
  if (!state) return
  state.vehicles = Array.isArray(state.vehicles) ? state.vehicles : []
  state.users = Array.isArray(state.users) ? state.users : []
  state.transactions = Array.isArray(state.transactions) ? state.transactions : []
  state.gpsDevices = Array.isArray(state.gpsDevices) ? state.gpsDevices : []
  state.programs = Array.isArray(state.programs) ? state.programs : []
  state.rtoApplications = Array.isArray(state.rtoApplications) ? state.rtoApplications : []
  state.filter = state.filter || { partner: 'all', status: 'all', search: '', program: 'all' }

  for (const program of state.programs) {
    if (!program.type) program.type = 'RTO'
    if (!program.durationDays) program.durationDays = program.type === 'RTO' ? 180 : 30
    if (!Array.isArray(program.offDays)) program.offDays = [0]
    program.offDays = program.offDays.filter((d) => d >= 0 && d <= 6)
    if (!Array.isArray(program.holidayDates)) program.holidayDates = []
    program.holidayDates = program.holidayDates.filter((d) => d >= 1 && d <= 31)
    if (!program.pickupLocation) {
      program.pickupLocation = PROGRAM_PICKUP_LOCATIONS[program.partnerId] || 'Program Pickup Point'
    }
    if (!Array.isArray(program.geofenceCities) || program.geofenceCities.length === 0) {
      program.geofenceCities = DEFAULT_GEOFENCE_BY_PARTNER[program.partnerId] || PROGRAM_GEOFENCE_CITIES
    }
    if (typeof program.applyOutOfZoneSpeedLimit !== 'boolean') {
      program.applyOutOfZoneSpeedLimit = true
    }
    if (typeof program.outOfZoneBufferKm !== 'number' || program.outOfZoneBufferKm < 0) {
      program.outOfZoneBufferKm = DEFAULT_OUT_OF_ZONE_BUFFER_KM
    }
    if (program.outOfZoneAction !== OUT_OF_ZONE_ACTIONS.IMMOBILIZED && program.outOfZoneAction !== OUT_OF_ZONE_ACTIONS.SPEED_LIMIT) {
      program.outOfZoneAction = OUT_OF_ZONE_ACTIONS.SPEED_LIMIT
    }
    if (typeof program.outOfZoneSpeedLimitKmh !== 'number' || program.outOfZoneSpeedLimitKmh < 0) {
      program.outOfZoneSpeedLimitKmh = DEFAULT_OUT_OF_ZONE_SPEED_LIMIT_KMH
    }
  }

  const usersById = new Map()
  const usersByName = new Map()
  for (const user of state.users) {
    if (!Array.isArray(user.vehicleIds)) user.vehicleIds = []
    user.vehicleIds = [...new Set(user.vehicleIds.filter(Boolean))]
    if (user.userId) usersById.set(user.userId, user)
    if (user.name) usersByName.set(String(user.name).trim().toLowerCase(), user)
  }

  for (const vehicle of state.vehicles) {
    if (!vehicle.brand && vehicle.model) {
      vehicle.brand = String(vehicle.model).split(' ')[0]
    }
    if (typeof vehicle.handoverCompleted !== 'boolean') {
      // Backfill legacy assigned renters as completed so existing lists remain stable.
      vehicle.handoverCompleted = Boolean(vehicle.customer || vehicle.userId)
    }
    const existingVehicleChecklist = vehicle.handoverChecklist && typeof vehicle.handoverChecklist === 'object' ? vehicle.handoverChecklist : {}
    const normalizedVehicleChecklist = { ...HANDOVER_CHECKLIST_TEMPLATE, ...existingVehicleChecklist }
    vehicle.handoverChecklist = {
      ...normalizedVehicleChecklist,
      appStatusUpdated: Boolean(normalizedVehicleChecklist.appStatusUpdated || existingVehicleChecklist.photosCaptured),
    }
    const existingVehiclePhotos = vehicle.handoverPhotos && typeof vehicle.handoverPhotos === 'object' ? vehicle.handoverPhotos : {}
    const legacyVehiclePhoto =
      existingVehiclePhotos.handover ||
      existingVehiclePhotos.front ||
      existingVehiclePhotos.left ||
      existingVehiclePhotos.right ||
      existingVehiclePhotos.odometer ||
      existingVehiclePhotos.renterWithVehicle ||
      ''
    vehicle.handoverPhotos = { handover: legacyVehiclePhoto }
    if (vehicle.handoverCompleted) {
      for (const key of Object.keys(HANDOVER_CHECKLIST_TEMPLATE)) vehicle.handoverChecklist[key] = true
    }
    const linkedUser = vehicle.userId ? usersById.get(vehicle.userId) : null
    if (linkedUser) {
      if (!linkedUser.vehicleIds.includes(vehicle.id)) linkedUser.vehicleIds.push(vehicle.id)
      if (!vehicle.customer) vehicle.customer = linkedUser.name || null
      if (!vehicle.phone) vehicle.phone = linkedUser.phone || vehicle.phone
      continue
    }
    const matchByName = vehicle.customer ? usersByName.get(String(vehicle.customer).trim().toLowerCase()) : null
    if (matchByName) {
      vehicle.userId = matchByName.userId
      if (!matchByName.vehicleIds.includes(vehicle.id)) matchByName.vehicleIds.push(vehicle.id)
      if (!vehicle.phone) vehicle.phone = matchByName.phone || vehicle.phone
    }
  }

  for (const user of state.users) {
    if (user.vehicleIds.length > 0) continue
    user.vehicleIds = state.vehicles.filter((v) => v.userId === user.userId).map((v) => v.id)
  }

  const vehiclesById = new Map(state.vehicles.map((vehicle) => [vehicle.id, vehicle]))

  // Prune user.vehicleIds: only keep vehicles that exist and belong to this user
  for (const user of state.users) {
    user.vehicleIds = user.vehicleIds.filter((vehicleId) => {
      const vehicle = vehiclesById.get(vehicleId)
      return vehicle && vehicle.userId === user.userId
    })
  }

  for (const gps of state.gpsDevices) {
    if (!gps.createdAt) {
      const seed = (gps.id || 'gps').split('').reduce((h, c) => h + c.charCodeAt(0), 0)
      const d = new Date(Date.now() - ((Math.abs(seed) % 30) + 1) * 86400000)
      d.setHours(9, (Math.abs(seed) * 17) % 60, 0, 0)
      gps.createdAt = d.toISOString()
    }
    if (!gps.updatedAt) gps.updatedAt = gps.createdAt
    if (gps.vehicleId) {
      const vehicle = vehiclesById.get(gps.vehicleId)
      if (!vehicle) {
        gps.vehicleId = null
        gps.vehiclePlate = '—'
      } else {
        gps.vehiclePlate = vehicle.plate || gps.vehiclePlate || '—'
      }
    } else {
      gps.vehiclePlate = gps.vehiclePlate || '—'
    }
  }
  state.transactions = state.transactions.filter((tx) => vehiclesById.has(tx.vehicleId))
  for (const tx of state.transactions) {
    const vehicle = vehiclesById.get(tx.vehicleId)
    if (!tx.customer) tx.customer = vehicle?.customer || ''
    if (!tx.programId) tx.programId = vehicle?.programId || ''
  }
  for (const app of state.rtoApplications) {
    app.score = Number(app.score || 0)
    if (!app.createdAt) app.createdAt = app.updatedAt || new Date().toISOString()
    if (app.assignedVehicleId && !vehiclesById.has(app.assignedVehicleId)) {
      app.assignedVehicleId = null
      app.handoverCompleted = false
      app.handoverCompletedAt = null
      app.handoverChecklist = { ...HANDOVER_CHECKLIST_TEMPLATE }
      app.handoverPhotos = { ...HANDOVER_PHOTO_TEMPLATE }
    }
    const user = app.userId ? usersById.get(app.userId) : null
    if (user && !app.userName) app.userName = user.name || ''
    if (!app.userId && app.userName) {
      const byName = usersByName.get(String(app.userName).trim().toLowerCase())
      if (byName) app.userId = byName.userId
    }
    if (!app.programId && app.assignedVehicleId) {
      const vehicle = vehiclesById.get(app.assignedVehicleId)
      if (vehicle?.programId) app.programId = vehicle.programId
    }
    if (app.decision === 'declined') app.decision = 'rejected'
    if (!['pending', 'review', 'pending_docs', 'approved', 'rejected'].includes(app.decision)) {
      app.decision = 'pending'
    }
    if (!Array.isArray(app.reviewLog)) app.reviewLog = []
    if (!Array.isArray(app.documents)) {
      app.documents = [
        { id: 'ktp', name: 'KTP', status: 'submitted' },
        { id: 'simc', name: 'SIM C', status: 'submitted' },
        { id: 'kk', name: 'KK', status: 'submitted' },
        { id: 'bike_photos', name: 'Bike Photos', status: app.assignedVehicleId ? 'submitted' : 'missing' },
      ]
    }
    if (!app.pickupSchedule) {
      const fallbackProgram = state.programs.find((program) => program.id === app.programId)
      const fallbackLocation = fallbackProgram?.pickupLocation || PROGRAM_PICKUP_LOCATIONS[fallbackProgram?.partnerId] || 'Program Pickup Point'
      app.pickupSchedule = {
        date: app.pickupDate ? new Date(app.pickupDate).toISOString().slice(0, 10) : '',
        time: app.pickupDate ? new Date(app.pickupDate).toISOString().slice(11, 16) : '10:00',
        location: fallbackLocation,
        status: app.pickupDate ? 'planned' : 'unscheduled',
      }
    } else if (!app.pickupSchedule.status) {
      app.pickupSchedule.status = app.pickupDate ? 'planned' : 'unscheduled'
    }
    const existingAppChecklist = app.handoverChecklist && typeof app.handoverChecklist === 'object' ? app.handoverChecklist : {}
    const normalizedAppChecklist = { ...HANDOVER_CHECKLIST_TEMPLATE, ...existingAppChecklist }
    app.handoverChecklist = {
      ...normalizedAppChecklist,
      appStatusUpdated: Boolean(normalizedAppChecklist.appStatusUpdated || existingAppChecklist.photosCaptured),
    }
    const existingAppPhotos = app.handoverPhotos && typeof app.handoverPhotos === 'object' ? app.handoverPhotos : {}
    const legacyAppPhoto =
      existingAppPhotos.handover ||
      existingAppPhotos.front ||
      existingAppPhotos.left ||
      existingAppPhotos.right ||
      existingAppPhotos.odometer ||
      existingAppPhotos.renterWithVehicle ||
      ''
    app.handoverPhotos = { handover: legacyAppPhoto }
    if (typeof app.handoverCompleted !== 'boolean') {
      app.handoverCompleted = app.pickupSchedule?.status === 'completed'
    }
    if (app.handoverCompleted && !app.handoverCompletedAt) {
      app.handoverCompletedAt = app.updatedAt || new Date().toISOString()
    }
    if (app.handoverCompleted) {
      for (const key of Object.keys(HANDOVER_CHECKLIST_TEMPLATE)) app.handoverChecklist[key] = true
    }
  }
}

function rand(seed) {
  const x = Math.sin(seed * 99.17) * 10000
  return x - Math.floor(x)
}

function seedLocalState() {
  const programs = Array.from({ length: 6 }, (_, i) => {
    const partner = PARTNERS[i % PARTNERS.length]
    const type = i % 2 === 0 ? 'RTO' : 'Rent'
    return {
      id: `P-${partner.slice(0, 2).toUpperCase()}-${type.slice(0, 3).toUpperCase()}`,
      name: `${partner.toUpperCase()} ${type}`,
      shortName: partner.toUpperCase(),
      partnerId: partner,
      type,
      price: 25000 + i * 2500,
      grace: type === 'RTO' ? 7 : 3,
      commissionType: 'percentage',
      commissionRate: 0.1,
      commissionFixed: 0,
      pickupLocation: PROGRAM_PICKUP_LOCATIONS[partner] || 'Program Pickup Point',
      durationDays: type === 'RTO' ? 180 : 30,
      offDays: [0],
      holidayDates: [],
      eligibleModels: [MODELS[i % MODELS.length]],
      minSalary: 0,
      promotions: [],
    }
  })

  const vehicles = Array.from({ length: 80 }, (_, i) => {
    const partner = PARTNERS[i % PARTNERS.length]
    const program = programs[(i + 1) % programs.length]
    const status = STATUSES[i % STATUSES.length]
    const riderName = `${INDONESIAN_FIRST_NAMES[i % INDONESIAN_FIRST_NAMES.length]} ${INDONESIAN_LAST_NAMES[(i * 3) % INDONESIAN_LAST_NAMES.length]}`
    return {
      id: `CSN-${String(i + 1).padStart(3, '0')}`,
      plate: `B ${1000 + i} XYZ`,
      customer: status === 'available' ? null : riderName,
      phone: `+62812${String(100000 + i).slice(-6)}`,
      status,
      partnerId: partner,
      programId: program.id,
      programType: program.type,
      brand: BRANDS[i % BRANDS.length],
      model: MODELS[i % MODELS.length],
      lat: -6.25 + rand(i + 1) * 0.2 - 0.1,
      lng: 106.85 + rand(i + 2) * 0.3 - 0.15,
      credits: Math.floor(rand(i + 3) * 20),
      riskScore: Math.floor(rand(i + 4) * 100),
      speed: Math.floor(rand(i + 5) * 60),
      isOnline: rand(i + 6) > 0.2,
      handoverCompleted: Boolean(status !== 'available'),
      handoverChecklist: {
        identityVerified: Boolean(status !== 'available'),
        vehicleConditionChecked: Boolean(status !== 'available'),
        tireConditionChecked: Boolean(status !== 'available'),
        keyHandoverChecked: Boolean(status !== 'available'),
        stnkVerified: Boolean(status !== 'available'),
        contractAcknowledged: Boolean(status !== 'available'),
        appStatusUpdated: Boolean(status !== 'available'),
      },
      handoverPhotos: {
        handover: '',
      },
    }
  })

  const users = vehicles
    .filter((vehicle) => vehicle.customer)
    .map((vehicle, idx) => {
      const riskScore = Math.floor(rand(idx + 10) * 100)
      return {
        userId: `USR-${String(idx + 1).padStart(4, '0')}`,
        name: vehicle.customer,
        phone: vehicle.phone,
        nik: `317${String(1000000000000 + idx).slice(-13)}`,
        joinDate: new Date(Date.now() - idx * 86400000 * 5).toISOString(),
        riskScore,
        riskLabel: riskScore >= 75 ? 'Low' : riskScore >= 45 ? 'Medium' : 'High',
        totalPaid: Math.floor(rand(idx + 11) * 10000000),
        missedPayments: Math.floor(rand(idx + 12) * 5),
        vehicleIds: [vehicle.id],
      }
    })

  users.forEach((user, idx) => {
    const vehicleId = user.vehicleIds[0]
    const vehicle = vehicles.find((item) => item.id === vehicleId)
    if (vehicle) vehicle.userId = user.userId
    if (idx % 9 === 0) {
      user.vehicleIds.push(vehicles[(idx + 5) % vehicles.length].id)
    }
  })

  const transactions = Array.from({ length: 280 }, (_, i) => {
    const vehicle = vehicles[i % vehicles.length]
    const amount = 25000 + (i % 7) * 5000
    const transactionType = i % 12 === 0 ? 'pay_penalty' : 'buy_credit'
    // Mock transaction time: fixed base date + varied time of day (not Date.now())
    const mockBaseMs = new Date('2026-01-15T00:00:00Z').getTime()
    const dayMs = 86400000
    const hourMs = 3600000
    const minMs = 60000
    const txTime = mockBaseMs - i * dayMs + ((i * 17) % 24) * hourMs + ((i * 31) % 60) * minMs
    return {
      id: `TX-${10000 + i}`,
      date: new Date(txTime).toISOString(),
      vehicleId: vehicle.id,
      partnerId: vehicle.partnerId,
      amount,
      partnerShare: Math.round(amount * 0.9),
      casanShare: Math.round(amount * 0.1),
      status: i % 20 === 0 ? 'failed' : 'paid',
      method: i % 2 === 0 ? 'BCA' : 'OVO',
      transactionType,
    }
  })

  const gpsDevices = vehicles.map((vehicle, i) => {
    const isUnassigned = i % 11 === 0
    const d = new Date(Date.now() - (i + 1) * 86400000)
    d.setHours(9, (i * 17) % 60, 0, 0)
    const createdAt = d.toISOString()
    return {
      id: `GPS-${String(i + 1).padStart(5, '0')}`,
      imei: `8688${String(1000000000 + i)}`,
      brand: i % 2 === 0 ? 'Weloop' : 'Teltonika',
      model: i % 2 === 0 ? 'WL-210 Pro' : 'FMB920',
      status: isUnassigned ? 'Offline' : GPS_STATUSES[i % GPS_STATUSES.length],
      vehicleId: isUnassigned ? null : vehicle.id,
      vehiclePlate: isUnassigned ? '—' : vehicle.plate,
      sim: {
        number: `0813${String(1000000 + i).slice(-7)}`,
        carrier: i % 2 === 0 ? 'Telkomsel' : 'XL',
        expiry: new Date(Date.now() + (i % 60) * 86400000).toISOString(),
        status: 'Active',
        dataUsedMB: 100 + (i % 300),
        dataLimitMB: 500,
      },
      createdAt,
      updatedAt: createdAt,
      firmwareUpdateRequired: i % 9 === 0,
    }
  })

  const rtoApplications = users.slice(0, 40).map((user, i) => {
    const vehicle = vehicles[i]
    const decision = i % 6 === 0 ? 'approved' : i % 9 === 0 ? 'review' : i % 7 === 0 ? 'rejected' : i % 5 === 0 ? 'pending_docs' : 'pending'
    const program = programs.find((item) => item.id === vehicle.programId)
    const pickupDate = decision === 'approved' && i % 3 === 0 ? new Date(Date.now() + i * 86400000).toISOString() : null
    const createdAt = new Date(Date.now() - (i + 1) * 86400000).toISOString()
    return {
      id: `APP-${String(i + 1).padStart(4, '0')}`,
      userId: user.userId,
      userName: user.name,
      createdAt,
      programId: vehicle.programId,
      score: user.riskScore,
      decision,
      assignedVehicleId: decision === 'approved' ? vehicle.id : null,
      pickupDate,
      pickupSchedule: {
        date: pickupDate ? pickupDate.slice(0, 10) : '',
        time: pickupDate ? pickupDate.slice(11, 16) : '10:00',
        location: PROGRAM_PICKUP_LOCATIONS[program?.partnerId] || 'Program Pickup Point',
        status: pickupDate ? 'planned' : 'unscheduled',
      },
      handoverChecklist: { ...HANDOVER_CHECKLIST_TEMPLATE },
      handoverPhotos: { ...HANDOVER_PHOTO_TEMPLATE },
      handoverCompleted: false,
      handoverCompletedAt: null,
      documents: [
        { id: 'ktp', name: 'KTP', status: 'submitted' },
        { id: 'simc', name: 'SIM C', status: i % 4 === 0 ? 'missing' : 'submitted' },
        { id: 'kk', name: 'KK', status: i % 6 === 0 ? 'missing' : 'submitted' },
        { id: 'bike_photos', name: 'Bike Photos', status: decision === 'approved' ? 'submitted' : 'review' },
      ],
      reviewLog: [],
      notes: '',
    }
  })

  localState = {
    vehicles,
    users,
    transactions,
    gpsDevices,
    programs,
    rtoApplications,
    filter: { partner: 'all', status: 'all', search: '', program: 'all' },
  }
}

export async function ensureLegacyRuntime() {
  if (runtimeState.loaded) return
  if (runtimeState.loadingPromise) return runtimeState.loadingPromise

  runtimeState.loadingPromise = Promise.resolve().then(() => {
    try {
      // Use existing global state when present (legacy page), otherwise seed local portable data.
      if (typeof window === 'undefined' || !window.state || !window.state.vehicles?.length) {
        seedLocalState()
      } else {
        localState = window.state
      }
      normalizeDataIntegrity(localState)
      runtimeState.loaded = true
      notifyStateChanged()
    } catch (err) {
      console.error('[legacyRuntime] ensureLegacyRuntime failed:', err)
      throw err
    }
  })

  return runtimeState.loadingPromise
}

export function getState() {
  try {
    const state = typeof window !== 'undefined' && window.state ? window.state : localState
    if (state) normalizeDataIntegrity(state)
    return state || localState
  } catch (err) {
    console.warn('[legacyRuntime] getState failed:', err)
    return localState
  }
}

export function subscribe(listener) {
  const handler = () => listener(getState())
  window.addEventListener(LISTENERS_EVENT, handler)
  return () => window.removeEventListener(LISTENERS_EVENT, handler)
}

export function notifyStateChanged() {
  normalizeDataIntegrity(getState())
  window.dispatchEvent(new CustomEvent(LISTENERS_EVENT))
}

export function setGlobalFilter(partialFilter) {
  const state = getState()
  state.filter = { ...state.filter, ...partialFilter }
  notifyStateChanged()
}

export function getUsers(filter = {}) {
  const state = getState()
  let list = [...state.users]
  const partnerFilter = state.filter?.partner || 'all'
  if (partnerFilter !== 'all') {
    list = list.filter((u) => {
      const userVehicles = state.vehicles.filter((v) => v.userId === u.userId)
      return userVehicles.some((v) => v.partnerId === partnerFilter)
    })
  }
  if (filter.search) {
    const q = filter.search.toLowerCase()
    list = list.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        (u.nik || '').toLowerCase().includes(q),
    )
  }
  if (filter.risk && filter.risk !== 'all') list = list.filter((u) => u.riskLabel === filter.risk)
  if (filter.program && filter.program !== 'all') {
    const state = getState()
    list = list.filter((u) => {
      const userVehicles = state.vehicles.filter((v) => v.userId === u.userId)
      return userVehicles.some((v) => v.programId === filter.program)
    })
  }
  const sortBy = filter.sortBy || 'joinDate'
  const dir = (filter.sortDir || 'desc') === 'desc' ? -1 : 1
  list.sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name) * dir
    if (sortBy === 'riskScore') return (a.riskScore - b.riskScore) * dir
    if (sortBy === 'totalPaid') return (a.totalPaid - b.totalPaid) * dir
    return (new Date(a.joinDate) - new Date(b.joinDate)) * dir
  })
  return list
}

export function getVehicles(filter = {}) {
  const state = getState()
  let list = [...state.vehicles]
  const partnerFilter = state.filter?.partner || 'all'
  if (partnerFilter !== 'all') {
    list = list.filter((v) => v.partnerId === partnerFilter)
  }
  if (filter.search) {
    const q = filter.search.toLowerCase()
    list = list.filter(
      (v) =>
        v.id.toLowerCase().includes(q) ||
        (v.plate || '').toLowerCase().includes(q) ||
        (v.customer || '').toLowerCase().includes(q),
    )
  }
  if (filter.status && filter.status !== 'all') list = list.filter((v) => v.status === filter.status)
  const dir = (filter.sortDir || 'asc') === 'desc' ? -1 : 1
  const sortBy = filter.sortBy || 'id'
  list.sort((a, b) => {
    if (sortBy === 'status') return a.status.localeCompare(b.status) * dir
    if (sortBy === 'customer') return (a.customer || '').localeCompare(b.customer || '') * dir
    return a.id.localeCompare(b.id) * dir
  })
  return list
}

export function lockVehicle(id) {
  const vehicle = getState().vehicles.find((item) => item.id === id)
  if (!vehicle) return
  vehicle.status = 'immobilized'
  vehicle.credits = 0
  notifyStateChanged()
}

export function releaseVehicle(id) {
  const vehicle = getState().vehicles.find((item) => item.id === id)
  if (!vehicle) return
  vehicle.status = 'active'
  notifyStateChanged()
}

export function extendVehicleCredits(id, days = 1) {
  const vehicle = getState().vehicles.find((item) => item.id === id)
  if (!vehicle) return
  vehicle.credits = (vehicle.credits || 0) + days
  if (vehicle.status === 'immobilized') vehicle.status = 'grace'
  notifyStateChanged()
}

export function createVehicle(fields = {}) {
  const state = getState()
  const programs = state.programs || []
  const preferredProgram = programs.find((program) => program.id === fields.programId) || programs[0] || null
  const explicitId = String(fields.id || '').trim()
  const id = explicitId || nextVehicleId(state.vehicles || [])
  if (!id) return null
  if ((state.vehicles || []).some((vehicle) => vehicle.id === id)) return null
  const model = fields.model || preferredProgram?.eligibleModels?.[0] || MODELS[0]
  const brand = fields.brand || String(model || '').split(' ')[0] || 'Unknown'
  const status = fields.status || 'available'
  const partnerId = fields.partnerId || preferredProgram?.partnerId || PARTNERS[0]
  const programId = fields.programId || preferredProgram?.id || ''
  const programType = fields.programType || preferredProgram?.type || 'RTO'
  const indexSeed = (state.vehicles || []).length + 1
  state.vehicles.push({
    id,
    plate: fields.plate || `B ${4000 + indexSeed} CSN`,
    customer: fields.customer || null,
    phone: fields.phone || '',
    status,
    partnerId,
    programId,
    programType,
    brand,
    model,
    stnkNumber: fields.stnkNumber || `STNK-${String(fields.plate || id).replace(/\s+/g, '').toUpperCase()}`,
    stnkExpiryDate: fields.stnkExpiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    lat: typeof fields.lat === 'number' ? fields.lat : -6.25 + rand(indexSeed) * 0.2 - 0.1,
    lng: typeof fields.lng === 'number' ? fields.lng : 106.85 + rand(indexSeed + 1) * 0.3 - 0.15,
    credits: Number(fields.credits || 0),
    riskScore: Number(fields.riskScore || 0),
    speed: Number(fields.speed || 0),
    isOnline: Boolean(fields.isOnline),
    handoverCompleted: false,
    handoverChecklist: { ...HANDOVER_CHECKLIST_TEMPLATE },
    handoverPhotos: { ...HANDOVER_PHOTO_TEMPLATE },
  })
  notifyStateChanged()
  return id
}

export function deleteVehicle(id) {
  const state = getState()
  const idx = (state.vehicles || []).findIndex((vehicle) => vehicle.id === id)
  if (idx < 0) return false
  state.vehicles.splice(idx, 1)
  state.gpsDevices = (state.gpsDevices || []).map((device) =>
    device.vehicleId === id
      ? {
          ...device,
          vehicleId: null,
          vehiclePlate: '—',
          status: 'Offline',
          updatedAt: new Date().toISOString(),
        }
      : device,
  )
  state.transactions = (state.transactions || []).filter((tx) => tx.vehicleId !== id)
  state.users = (state.users || []).map((user) => ({
    ...user,
    vehicleIds: (user.vehicleIds || []).filter((vehicleId) => vehicleId !== id),
  }))
  state.rtoApplications = (state.rtoApplications || []).map((app) =>
    app.assignedVehicleId === id
      ? {
          ...app,
          assignedVehicleId: null,
          handoverCompleted: false,
          handoverCompletedAt: null,
          handoverChecklist: { ...HANDOVER_CHECKLIST_TEMPLATE },
          handoverPhotos: { ...HANDOVER_PHOTO_TEMPLATE },
        }
      : app,
  )
  notifyStateChanged()
  return true
}

export function getFinanceSnapshot(programFilter = 'all') {
  const state = getState()
  const partnerFilter = state.filter?.partner || 'all'
  const vehiclesById = new Map(state.vehicles.map((v) => [v.id, v]))
  const programsById = new Map(state.programs.map((p) => [p.id, p]))
  const tx = state.transactions
    .filter((t) => {
      const vehicle = vehiclesById.get(t.vehicleId)
      const partnerMatch = partnerFilter === 'all' || vehicle?.partnerId === partnerFilter
      const programMatch = programFilter === 'all' || vehicle?.programId === programFilter
      return partnerMatch && programMatch
    })
    .map((t) => {
      const vehicle = vehiclesById.get(t.vehicleId)
      const program = programsById.get(t.programId || vehicle?.programId)
      const programName = program?.shortName || program?.name || t.program || t.programId || '-'
      const programType = program?.type || vehicle?.programType || '-'
      const txType = t.transactionType === 'pay_penalty' ? 'Pay Penalty' : 'Buy Credit'
      return {
        ...t,
        programLabel: `${programName} • ${programType}`,
        credits: vehicle?.credits ?? null,
        customerPhone: vehicle?.phone || t.customerPhone || '-',
        transactionTypeLabel: txType,
      }
    })
  const paid = tx.filter((t) => t.status === 'paid')
  const scopedVehicles =
    state.vehicles.filter((vehicle) => {
      const partnerMatch = partnerFilter === 'all' || vehicle.partnerId === partnerFilter
      const programMatch = programFilter === 'all' || vehicle.programId === programFilter
      return partnerMatch && programMatch
    })
  const stats = {
    revenue: paid.reduce((sum, t) => sum + (t.amount || 0), 0),
    partner: paid.reduce((sum, t) => sum + (t.partnerShare || 0), 0),
    casan: paid.reduce((sum, t) => sum + (t.casanShare || 0), 0),
    outstanding: scopedVehicles.filter((v) => v.status === 'immobilized').length * 500000,
  }
  const programs = state.programs.map((p) => ({ ...p }))
  return { stats, transactions: tx, programs }
}

export function getPrograms() {
  const state = getState()
  const partnerFilter = state.filter?.partner || 'all'
  const list = [...(state.programs || [])]
  if (partnerFilter === 'all') return list
  return list.filter((p) => p.partnerId === partnerFilter)
}

export function createProgram(program) {
  getState().programs.push(program)
  notifyStateChanged()
}

export function editProgram(id, data) {
  const state = getState()
  const idx = state.programs.findIndex((program) => program.id === id)
  if (idx >= 0) state.programs[idx] = { ...state.programs[idx], ...data }
  notifyStateChanged()
}

export function removeProgram(id) {
  const state = getState()
  state.programs = state.programs.filter((program) => program.id !== id)
  notifyStateChanged()
}

export function getGpsSnapshot(filter = {}) {
  const state = getState()
  const partnerFilter = state.filter?.partner || 'all'
  let devices = [...(state.gpsDevices || [])]
  if (partnerFilter !== 'all') {
    devices = devices.filter((d) => {
      const vehicle = state.vehicles.find((v) => v.id === d.vehicleId)
      return vehicle?.partnerId === partnerFilter
    })
  }
  if (filter.status && filter.status !== 'all') devices = devices.filter((d) => d.status === filter.status)
  if (filter.brand && filter.brand !== 'all') devices = devices.filter((d) => d.brand === filter.brand)
  if (filter.search) {
    const q = filter.search.toLowerCase()
    devices = devices.filter(
      (d) =>
        d.id.toLowerCase().includes(q) ||
        d.imei.toLowerCase().includes(q) ||
        (d.vehiclePlate || '').toLowerCase().includes(q) ||
        d.brand.toLowerCase().includes(q),
    )
  }
  const all = partnerFilter === 'all'
    ? state.gpsDevices || []
    : (state.gpsDevices || []).filter((d) => {
        const vehicle = state.vehicles.find((v) => v.id === d.vehicleId)
        return vehicle?.partnerId === partnerFilter
      })
  const stats = {
    total: all.length,
    online: all.filter((d) => d.status === 'Online').length,
    offline: all.filter((d) => d.status === 'Offline').length,
    firmwareAlert: all.filter((d) => d.firmwareUpdateRequired).length,
  }
  return { devices, stats }
}

export function createGps(fields) {
  const state = getState()
  const now = new Date().toISOString()
  const hasSim = Boolean(fields.sim?.number || fields.sim?.carrier)
  state.gpsDevices.push({
    id: `GPS-${String(state.gpsDevices.length + 1).padStart(5, '0')}`,
    imei: fields.imei || '',
    brand: fields.brand || 'Weloop',
    model: fields.model || 'WL-210 Pro',
    status: fields.vehicleId ? 'Online' : 'Offline',
    vehicleId: fields.vehicleId || null,
    vehiclePlate: fields.vehicleId ? state.vehicles.find((v) => v.id === fields.vehicleId)?.plate || '—' : '—',
    sim: {
      number: fields.sim?.number || '',
      carrier: fields.sim?.carrier || '',
      expiry: fields.sim?.expiry || '',
      status: hasSim ? 'Active' : 'Unassigned',
      dataUsedMB: 0,
      dataLimitMB: 500,
    },
    createdAt: now,
    updatedAt: now,
    firmwareUpdateRequired: false,
  })
  notifyStateChanged()
}

export function updateGps(id, fields) {
  const state = getState()
  const idx = state.gpsDevices.findIndex((device) => device.id === id)
  if (idx < 0) return
  const current = state.gpsDevices[idx]
  const nextVehicleId = fields.vehicleId !== undefined ? fields.vehicleId : current.vehicleId
  const nextSim = {
    ...current.sim,
    ...(fields.sim || {}),
  }
  nextSim.status = nextSim.number || nextSim.carrier ? 'Active' : 'Unassigned'
  state.gpsDevices[idx] = {
    ...current,
    ...fields,
    updatedAt: new Date().toISOString(),
    vehicleId: nextVehicleId,
    vehiclePlate: nextVehicleId ? state.vehicles.find((v) => v.id === nextVehicleId)?.plate || '—' : '—',
    sim: nextSim,
  }
  notifyStateChanged()
}

export function deleteGps(id) {
  const state = getState()
  state.gpsDevices = state.gpsDevices.filter((device) => device.id !== id)
  notifyStateChanged()
}

function nextVehicleId(vehicles) {
  const used = new Set((vehicles || []).map((vehicle) => vehicle.id))
  let seq = (vehicles || []).length + 1
  while (seq < 100000) {
    const candidate = `CSN-${String(seq).padStart(3, '0')}`
    if (!used.has(candidate)) return candidate
    seq += 1
  }
  return null
}

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export function getRtoConfigs() {
  const scoreCfg = safeParse(localStorage.getItem('casan_rto_cfg'), {})
  const waCfg = safeParse(localStorage.getItem('csn_wa_cfg'), {
    approved: 'Hi {nama}, your application {app_id} is approved.',
    rejected: 'Hi {nama}, your application {app_id} cannot be approved yet.',
    pending: 'Hi {nama}, your application {app_id} is under review.',
  })
  if (!waCfg.rejected && waCfg.declined) waCfg.rejected = waCfg.declined
  return { scoreCfg, waCfg }
}

export function saveRtoConfigs(scoreCfg, waCfg) {
  localStorage.setItem('casan_rto_cfg', JSON.stringify(scoreCfg || {}))
  localStorage.setItem('csn_wa_cfg', JSON.stringify(waCfg || {}))
  localStorage.setItem(
    'casan:rto:v2',
    JSON.stringify({ score: scoreCfg || {}, wa: waCfg || {}, schemaVersion: 2, migratedAt: new Date().toISOString() }),
  )
  notifyStateChanged()
}

export function getRtoSnapshot() {
  const state = getState()
  const partnerFilter = state.filter?.partner || 'all'
  let apps = [...(state.rtoApplications || [])]
  if (partnerFilter !== 'all') {
    apps = apps.filter((app) => {
      const vehicle = state.vehicles.find((v) => v.id === app.assignedVehicleId)
      return vehicle?.partnerId === partnerFilter
    })
  }
  const pickup = apps.filter((a) => a.decision === 'approved')
  const { scoreCfg, waCfg } = getRtoConfigs()
  return { apps, pickup, scoreCfg, waCfg }
}

export function decideRtoApplication(id, decision, updates = {}) {
  const app = getState().rtoApplications.find((item) => item.id === id)
  if (!app) return
  const previousAssignedVehicleId = app.assignedVehicleId || null
  const normalizedDecision = decision === 'declined' ? 'rejected' : decision
  if (!['pending', 'review', 'pending_docs', 'approved', 'rejected'].includes(normalizedDecision)) return
  if (normalizedDecision === 'approved' && !updates.assignedVehicleId && !app.assignedVehicleId) return
  if (updates.assignedVehicleId && updates.assignedVehicleId !== previousAssignedVehicleId) {
    const nextVehicle = getState().vehicles.find((vehicle) => vehicle.id === updates.assignedVehicleId)
    if (!nextVehicle || nextVehicle.status !== 'available') return
  }
  if (normalizedDecision === 'pending_docs' && (!updates.requiredDocs || updates.requiredDocs.length === 0)) return
  if (normalizedDecision === 'rejected' && !String(updates.rejectReason || '').trim()) return
  app.decision = normalizedDecision
  if (updates.score !== undefined) app.score = Number(updates.score || 0)
  if (updates.assignedVehicleId !== undefined) app.assignedVehicleId = updates.assignedVehicleId || null
  if (updates.notes !== undefined) app.notes = updates.notes || ''
  if (Array.isArray(updates.documents)) app.documents = updates.documents
  if (updates.reviewEntry) {
    app.reviewLog = [...(app.reviewLog || []), updates.reviewEntry]
  }
  if (normalizedDecision !== 'approved') {
    if (previousAssignedVehicleId) {
      const prevVehicle = getState().vehicles.find((vehicle) => vehicle.id === previousAssignedVehicleId)
      if (prevVehicle) {
        prevVehicle.handoverCompleted = false
        prevVehicle.handoverChecklist = { ...HANDOVER_CHECKLIST_TEMPLATE }
        prevVehicle.handoverPhotos = { ...HANDOVER_PHOTO_TEMPLATE }
      }
    }
    app.handoverChecklist = { ...HANDOVER_CHECKLIST_TEMPLATE }
    app.handoverPhotos = { ...HANDOVER_PHOTO_TEMPLATE }
    app.handoverCompleted = false
    app.handoverCompletedAt = null
    app.pickupDate = null
    app.pickupSchedule = {
      ...(app.pickupSchedule || {}),
      status: 'unscheduled',
    }
  } else if (!app.pickupDate) {
    const schedule = app.pickupSchedule || {}
    const date = schedule.date || new Date().toISOString().slice(0, 10)
    const time = schedule.time || '10:00'
    app.pickupDate = new Date(`${date}T${time}:00`).toISOString()
    app.pickupSchedule = {
      ...schedule,
      date,
      time,
      status: schedule.status && schedule.status !== 'unscheduled' ? schedule.status : 'planned',
    }
  }
  if (normalizedDecision === 'approved' && app.assignedVehicleId) {
    if (previousAssignedVehicleId && previousAssignedVehicleId !== app.assignedVehicleId) {
      const previousVehicle = getState().vehicles.find((vehicle) => vehicle.id === previousAssignedVehicleId)
      if (previousVehicle) {
        previousVehicle.handoverCompleted = false
        previousVehicle.handoverChecklist = { ...HANDOVER_CHECKLIST_TEMPLATE }
        previousVehicle.handoverPhotos = { ...HANDOVER_PHOTO_TEMPLATE }
      }
    }
    const assignedVehicle = getState().vehicles.find((vehicle) => vehicle.id === app.assignedVehicleId)
    if (assignedVehicle) {
      assignedVehicle.userId = app.userId || assignedVehicle.userId
      assignedVehicle.customer = app.userName || assignedVehicle.customer
      assignedVehicle.handoverCompleted = false
      assignedVehicle.handoverChecklist = { ...HANDOVER_CHECKLIST_TEMPLATE }
      assignedVehicle.handoverPhotos = { ...HANDOVER_PHOTO_TEMPLATE }
    }
    app.handoverChecklist = { ...HANDOVER_CHECKLIST_TEMPLATE }
    app.handoverPhotos = { ...HANDOVER_PHOTO_TEMPLATE }
    app.handoverCompleted = false
    app.handoverCompletedAt = null
  }
  notifyStateChanged()
}

export function scheduleRtoPickup(id, pickupDetails) {
  const app = getState().rtoApplications.find((item) => item.id === id)
  if (!app) return
  if (app.decision !== 'approved') return
  const matchedProgram = getState().programs.find((program) => program.id === app.programId)
  const defaultLocation = matchedProgram?.pickupLocation || PROGRAM_PICKUP_LOCATIONS[matchedProgram?.partnerId] || 'Program Pickup Point'
  if (typeof pickupDetails === 'string') {
    app.pickupDate = pickupDetails
    app.pickupSchedule = {
      ...(app.pickupSchedule || {}),
      date: pickupDetails.slice(0, 10),
      time: pickupDetails.slice(11, 16),
      location: app.pickupSchedule?.location || defaultLocation,
      status: app.handoverCompleted ? 'completed' : 'confirmed',
    }
  } else {
    const date = pickupDetails?.date || new Date().toISOString().slice(0, 10)
    const time = pickupDetails?.time || '10:00'
    const location = pickupDetails?.location || app.pickupSchedule?.location || defaultLocation
    app.pickupDate = new Date(`${date}T${time}:00`).toISOString()
    const requestedStatus = pickupDetails?.status || (app.pickupSchedule?.date ? 'rescheduled' : 'confirmed')
    app.pickupSchedule = {
      date,
      time,
      location,
      status: requestedStatus === 'completed' && !app.handoverCompleted ? 'confirmed' : requestedStatus,
    }
  }
  if (app.pickupSchedule?.status !== 'completed') {
    app.handoverCompleted = false
    app.handoverCompletedAt = null
  }
  notifyStateChanged()
}

export function completeRtoHandover(id, checklist = {}, notes = '') {
  const state = getState()
  const app = state.rtoApplications.find((item) => item.id === id)
  if (!app) return false
  if (app.decision !== 'approved' || !app.assignedVehicleId) return false
  const incoming = checklist && typeof checklist === 'object' ? checklist : {}
  const incomingPhotos = incoming.photos && typeof incoming.photos === 'object' ? incoming.photos : {}
  const checklistWithoutPhotos = { ...incoming }
  delete checklistWithoutPhotos.photos
  const normalizedChecklist = { ...HANDOVER_CHECKLIST_TEMPLATE, ...checklistWithoutPhotos }
  const allChecked = Object.values(normalizedChecklist).every(Boolean)
  if (!allChecked) return false
  const normalizedPhotos = { ...HANDOVER_PHOTO_TEMPLATE, ...incomingPhotos }
  app.handoverChecklist = normalizedChecklist
  app.handoverPhotos = normalizedPhotos
  app.handoverCompleted = true
  app.handoverCompletedAt = new Date().toISOString()
  app.pickupSchedule = {
    ...(app.pickupSchedule || {}),
    status: 'completed',
  }
  if (notes) {
    app.notes = [app.notes, `Handover: ${notes}`].filter(Boolean).join(' | ')
  }
  const vehicle = state.vehicles.find((item) => item.id === app.assignedVehicleId)
  if (vehicle) {
    vehicle.userId = app.userId || vehicle.userId
    vehicle.customer = app.userName || vehicle.customer
    vehicle.handoverCompleted = true
    vehicle.handoverChecklist = normalizedChecklist
    vehicle.handoverPhotos = normalizedPhotos
    vehicle.handoverCompletedAt = app.handoverCompletedAt
  }
  notifyStateChanged()
  return true
}

export function createRtoApplication(fields) {
  const state = getState()
  const matchedProgram = state.programs.find((program) => program.id === fields.programId)
  const defaultLocation = matchedProgram?.pickupLocation || PROGRAM_PICKUP_LOCATIONS[matchedProgram?.partnerId] || 'Program Pickup Point'
  const nextIndex = (state.rtoApplications?.length || 0) + 1
  const id = fields.id || `APP-${String(nextIndex).padStart(4, '0')}`
  const decision = fields.decision || 'pending'
  state.rtoApplications.push({
    id,
    userId: fields.userId || '',
    userName: fields.userName || '',
    programId: fields.programId || '',
    score: Number(fields.score || 0),
    decision: ['pending', 'review', 'pending_docs', 'approved', 'rejected'].includes(decision) ? decision : 'pending',
    assignedVehicleId: fields.assignedVehicleId || null,
    pickupDate: decision === 'approved' ? fields.pickupDate || null : null,
    pickupSchedule: {
      date: fields.pickupDate ? String(fields.pickupDate).slice(0, 10) : '',
      time: fields.pickupDate ? String(fields.pickupDate).slice(11, 16) : '10:00',
      location: fields.pickupLocation || defaultLocation,
      status: fields.pickupDate ? 'planned' : 'unscheduled',
    },
    handoverChecklist: { ...HANDOVER_CHECKLIST_TEMPLATE },
    handoverPhotos: { ...HANDOVER_PHOTO_TEMPLATE },
    handoverCompleted: false,
    handoverCompletedAt: null,
    documents: Array.isArray(fields.documents)
      ? fields.documents
      : [
          { id: 'ktp', name: 'KTP', status: 'submitted' },
          { id: 'simc', name: 'SIM C', status: 'review' },
          { id: 'kk', name: 'KK', status: 'review' },
          { id: 'bike_photos', name: 'Bike Photos', status: fields.assignedVehicleId ? 'submitted' : 'missing' },
        ],
    reviewLog: [],
    notes: fields.notes || '',
  })
  notifyStateChanged()
}
