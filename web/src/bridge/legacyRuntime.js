const runtimeState = {
  loaded: false,
  loadingPromise: null,
}

const LISTENERS_EVENT = 'legacy-state-updated'
const PARTNERS = ['tangkas', 'maka', 'united']
const MODELS = ['Zeeho AE8', 'Maka One', 'United MX1200']
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

  const usersById = new Map()
  const usersByName = new Map()
  for (const user of state.users) {
    if (!Array.isArray(user.vehicleIds)) user.vehicleIds = []
    user.vehicleIds = [...new Set(user.vehicleIds.filter(Boolean))]
    if (user.userId) usersById.set(user.userId, user)
    if (user.name) usersByName.set(String(user.name).trim().toLowerCase(), user)
  }

  for (const vehicle of state.vehicles) {
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
  for (const gps of state.gpsDevices) {
    if (!gps.createdAt) gps.createdAt = new Date().toISOString()
    if (!gps.updatedAt) gps.updatedAt = gps.createdAt
    if (gps.vehicleId) {
      const vehicle = vehiclesById.get(gps.vehicleId)
      gps.vehiclePlate = vehicle?.plate || gps.vehiclePlate || '—'
    } else {
      gps.vehiclePlate = gps.vehiclePlate || '—'
    }
  }
  for (const tx of state.transactions) {
    const vehicle = vehiclesById.get(tx.vehicleId)
    if (!vehicle) continue
    if (!tx.customer) tx.customer = vehicle.customer || ''
    if (!tx.programId) tx.programId = vehicle.programId || ''
  }
  for (const app of state.rtoApplications) {
    app.score = Number(app.score || 0)
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
    if (!['pending', 'review', 'pending_docs', 'approved', 'declined'].includes(app.decision)) {
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
      const fallbackLocation = PROGRAM_PICKUP_LOCATIONS[fallbackProgram?.partnerId] || 'Program Pickup Point'
      app.pickupSchedule = {
        date: app.pickupDate ? new Date(app.pickupDate).toISOString().slice(0, 10) : '',
        time: app.pickupDate ? new Date(app.pickupDate).toISOString().slice(11, 16) : '10:00',
        location: fallbackLocation,
      }
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
      model: MODELS[i % MODELS.length],
      lat: -6.25 + rand(i + 1) * 0.2 - 0.1,
      lng: 106.85 + rand(i + 2) * 0.3 - 0.15,
      credits: Math.floor(rand(i + 3) * 20),
      riskScore: Math.floor(rand(i + 4) * 100),
      speed: Math.floor(rand(i + 5) * 60),
      isOnline: rand(i + 6) > 0.2,
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
    return {
      id: `TX-${10000 + i}`,
      date: new Date(Date.now() - i * 86400000).toISOString(),
      vehicleId: vehicle.id,
      partnerId: vehicle.partnerId,
      amount,
      partnerShare: Math.round(amount * 0.9),
      casanShare: Math.round(amount * 0.1),
      status: i % 20 === 0 ? 'failed' : 'paid',
      method: i % 2 === 0 ? 'BCA' : 'OVO',
    }
  })

  const gpsDevices = vehicles.map((vehicle, i) => {
    const isUnassigned = i % 11 === 0
    const createdAt = new Date(Date.now() - i * 86400000).toISOString()
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
    const decision = i % 6 === 0 ? 'approved' : i % 9 === 0 ? 'review' : i % 7 === 0 ? 'declined' : i % 5 === 0 ? 'pending_docs' : 'pending'
    const program = programs.find((item) => item.id === vehicle.programId)
    const pickupDate = decision === 'approved' && i % 3 === 0 ? new Date(Date.now() + i * 86400000).toISOString() : null
    return {
      id: `APP-${String(i + 1).padStart(4, '0')}`,
      userId: user.userId,
      userName: user.name,
      programId: vehicle.programId,
      score: user.riskScore,
      decision,
      assignedVehicleId: decision === 'approved' ? vehicle.id : null,
      pickupDate,
      pickupSchedule: {
        date: pickupDate ? pickupDate.slice(0, 10) : '',
        time: pickupDate ? pickupDate.slice(11, 16) : '10:00',
        location: PROGRAM_PICKUP_LOCATIONS[program?.partnerId] || 'Program Pickup Point',
      },
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
    // Use existing global state when present (legacy page), otherwise seed local portable data.
    if (!window.state || !window.state.vehicles?.length) {
      seedLocalState()
    } else {
      localState = window.state
    }
    normalizeDataIntegrity(localState)
    runtimeState.loaded = true
    // Fire one initial update so subscribers (useLegacyTick) re-render with seeded data.
    notifyStateChanged()
  })

  return runtimeState.loadingPromise
}

export function getState() {
  const state = window.state || localState
  normalizeDataIntegrity(state)
  return state
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

export function getFinanceSnapshot(programFilter = 'all') {
  const state = getState()
  const partnerFilter = state.filter?.partner || 'all'
  const tx = state.transactions.filter((t) => {
    const vehicle = state.vehicles.find((v) => v.id === t.vehicleId)
    const partnerMatch = partnerFilter === 'all' || vehicle?.partnerId === partnerFilter
    const programMatch = programFilter === 'all' || vehicle?.programId === programFilter
    return partnerMatch && programMatch
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
    declined: 'Hi {nama}, your application {app_id} cannot be approved yet.',
    pending: 'Hi {nama}, your application {app_id} is under review.',
  })
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
  app.decision = decision
  if (updates.score !== undefined) app.score = Number(updates.score || 0)
  if (updates.assignedVehicleId !== undefined) app.assignedVehicleId = updates.assignedVehicleId || null
  if (updates.notes !== undefined) app.notes = updates.notes || ''
  if (Array.isArray(updates.documents)) app.documents = updates.documents
  if (updates.reviewEntry) {
    app.reviewLog = [...(app.reviewLog || []), updates.reviewEntry]
  }
  if (decision !== 'approved') {
    app.pickupDate = null
  } else if (!app.pickupDate) {
    const schedule = app.pickupSchedule || {}
    const date = schedule.date || new Date().toISOString().slice(0, 10)
    const time = schedule.time || '10:00'
    app.pickupDate = new Date(`${date}T${time}:00`).toISOString()
  }
  notifyStateChanged()
}

export function scheduleRtoPickup(id, pickupDetails) {
  const app = getState().rtoApplications.find((item) => item.id === id)
  if (!app) return
  app.decision = 'approved'
  if (typeof pickupDetails === 'string') {
    app.pickupDate = pickupDetails
    app.pickupSchedule = {
      ...(app.pickupSchedule || {}),
      date: pickupDetails.slice(0, 10),
      time: pickupDetails.slice(11, 16),
      location: app.pickupSchedule?.location || 'Program Pickup Point',
    }
  } else {
    const date = pickupDetails?.date || new Date().toISOString().slice(0, 10)
    const time = pickupDetails?.time || '10:00'
    const location = pickupDetails?.location || app.pickupSchedule?.location || 'Program Pickup Point'
    app.pickupDate = new Date(`${date}T${time}:00`).toISOString()
    app.pickupSchedule = { date, time, location }
  }
  notifyStateChanged()
}

export function createRtoApplication(fields) {
  const state = getState()
  const nextIndex = (state.rtoApplications?.length || 0) + 1
  const id = fields.id || `APP-${String(nextIndex).padStart(4, '0')}`
  const decision = fields.decision || 'pending'
  state.rtoApplications.push({
    id,
    userId: fields.userId || '',
    userName: fields.userName || '',
    programId: fields.programId || '',
    score: Number(fields.score || 0),
    decision: ['pending', 'review', 'pending_docs', 'approved', 'declined'].includes(decision) ? decision : 'pending',
    assignedVehicleId: fields.assignedVehicleId || null,
    pickupDate: decision === 'approved' ? fields.pickupDate || null : null,
    pickupSchedule: {
      date: fields.pickupDate ? String(fields.pickupDate).slice(0, 10) : '',
      time: fields.pickupDate ? String(fields.pickupDate).slice(11, 16) : '10:00',
      location: fields.pickupLocation || 'Program Pickup Point',
    },
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
