import { useEffect, useMemo, useState } from 'react'
import { usePagination } from '../context/PaginationContext'
import {
  completeRtoHandover,
  createRtoApplication,
  decideRtoApplication,
  getState,
  getPrograms,
  getVehicles,
  getRtoSnapshot,
  saveRtoConfigs,
  scheduleRtoPickup,
} from '../bridge/legacyRuntime'
import { useLegacyTick } from '../hooks/useLegacyTick'
import { Badge, ScoreBadge, StatusBadge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'
import {
  CHECKBOX_CLS,
  FORM_CONTROL_CLS,
  PAGE_SIZE,
  PageFooter,
  PageHeader,
  PageMeta,
  PageShell,
  PageTitle,
  StatCard,
  StatsGrid,
  TABLE_MIN_WIDTH,
  PaginationInfo,
  FilterBar,
} from './ui/page'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

const UI_KEY = 'casan_rto_ui'
const DEFAULT_PICKUP_BY_PARTNER = {
  tangkas: 'Tangkas Hub - Kemayoran',
  maka: 'Maka Center - Tebet',
  united: 'United Point - Bekasi Barat',
}
const DEFAULT_PICKUP_CONTACT_BY_PARTNER = {
  tangkas: { name: 'Raka Prasetyo', phone: '+62 812-3100-1001' },
  maka: { name: 'Dina Maheswari', phone: '+62 812-3100-2001' },
  united: { name: 'Bima Adi Nugroho', phone: '+62 812-3100-3001' },
}
const TAB_ITEMS = [
  { key: 'applications', label: 'Applications' },
  { key: 'pickup', label: 'Pickup Board' },
  { key: 'score', label: 'Scoring Rules' },
  { key: 'wa', label: 'WhatsApp Templates' },
]

function normalizeTab(value) {
  if (value === 'app' || value === 'apps' || value === 'application') return 'applications'
  if (value === 'pickups') return 'pickup'
  if (value === 'whatsapp') return 'wa'
  if (TAB_ITEMS.some((item) => item.key === value)) return value
  return 'applications'
}

function decisionTone(decision) {
  if (decision === 'approved') return { tone: 'bg-emerald-100 text-emerald-700', label: 'ACCEPTED', variant: 'success' }
  if (decision === 'rejected') return { tone: 'bg-rose-100 text-rose-700', label: 'REJECTED', variant: 'danger' }
  if (decision === 'review') return { tone: 'bg-amber-100 text-amber-700', label: 'REVIEW', variant: 'warning' }
  if (decision === 'pending_docs') return { tone: 'bg-orange-100 text-orange-700', label: 'NEEDS DOCS', variant: 'warning' }
  return { tone: 'bg-muted text-foreground', label: 'PENDING', variant: 'neutral' }
}

function pickupStatusTone(status) {
  if (status === 'confirmed') return 'bg-emerald-100 text-emerald-700'
  if (status === 'rescheduled') return 'bg-cyan-100 text-cyan-700'
  if (status === 'planned') return 'bg-amber-100 text-amber-700'
  if (status === 'completed') return 'bg-indigo-100 text-indigo-700'
  if (status === 'no_show') return 'bg-rose-100 text-rose-700'
  return 'bg-muted text-foreground'
}

function vehicleStateTone(status) {
  if (status === 'active') return 'bg-emerald-100 text-emerald-700'
  if (status === 'grace') return 'bg-amber-100 text-amber-700'
  if (status === 'immobilized') return 'bg-rose-100 text-rose-700'
  if (status === 'paused') return 'bg-cyan-100 text-cyan-700'
  if (status === 'available') return 'bg-muted text-foreground'
  return 'bg-muted text-foreground'
}

function scoreTone(score) {
  const value = Number(score || 0)
  if (value >= 80) return 'bg-emerald-100 text-emerald-700'
  if (value >= 60) return 'bg-cyan-100 text-cyan-700'
  if (value >= 41) return 'bg-amber-100 text-amber-700'
  if (value >= 21) return 'bg-orange-100 text-orange-700'
  return 'bg-rose-100 text-rose-700'
}

function docTone(status) {
  if (status === 'submitted') return 'bg-emerald-100 text-emerald-700'
  if (status === 'review') return 'bg-amber-100 text-amber-700'
  if (status === 'missing') return 'bg-orange-100 text-orange-700'
  if (status === 'rejected') return 'bg-rose-100 text-rose-700'
  return 'bg-muted text-foreground'
}

function plusDaysISO(baseDate, days) {
  const date = new Date(baseDate)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function dateChipLabel(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`)
  return date.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' })
}

function dayShort(isoDate) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' })
}

function buildDocPreviewSrc(docName, status) {
  const bg = status === 'submitted' ? '#0f2d22' : status === 'missing' ? '#2f1f12' : status === 'rejected' ? '#311418' : '#2a2a2a'
  const fg = status === 'submitted' ? '#34d399' : status === 'missing' ? '#fb923c' : status === 'rejected' ? '#f87171' : '#facc15'
  const text = docName || 'Document'
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='400'><rect width='100%' height='100%' fill='${bg}'/><text x='40' y='160' fill='${fg}' font-size='42' font-family='Arial' font-weight='700'>${text}</text><text x='40' y='220' fill='#cbd5e1' font-size='24' font-family='Arial'>Preview Snapshot</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function buildWATemplate(app, decision, options = {}) {
  const applicant = app?.userName || 'Driver'
  const appId = app?.id || '-'
  const program = app?.programId || '-'
  const score = app?.score ?? '-'
  if (decision === 'approved') {
    return `Hi ${applicant}, pengajuan ${appId} untuk ${program} sudah DISETUJUI (score ${score}).\nSilakan pilih jadwal pickup (tanggal & jam) melalui tim CASAN hari ini agar unit bisa disiapkan.`
  }
  if (decision === 'rejected') {
    return `Hi ${applicant}, mohon maaf pengajuan ${appId} belum dapat disetujui saat ini.\nAlasan: ${options.rejectReason || 'dokumen / kelayakan belum memenuhi'}.\nSilakan perbaiki dan ajukan kembali setelah lengkap.`
  }
  if (decision === 'pending_docs') {
    const docs = (options.requiredDocs || []).length > 0 ? (options.requiredDocs || []).join(', ') : 'dokumen pendukung'
    return `Hi ${applicant}, pengajuan ${appId} masih membutuhkan dokumen tambahan.\nMohon resubmit: ${docs}.\nSetelah dokumen lengkap, kami lanjutkan review.`
  }
  return `Hi ${applicant}, pengajuan ${appId} sedang dalam review lanjutan oleh tim analis.\nEstimasi tambahan waktu review: ${options.reviewEtaDays || 3} hari kerja. Kami update kembali setelah selesai.`
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Number(value || 0)))
}

const MONTHS_3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatSubmissionTime(isoDate) {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return ''
  const thisYear = new Date().getFullYear()
  const y = d.getFullYear()
  const mo = MONTHS_3[d.getMonth()]
  const day = d.getDate()
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  const time = `${hours}:${mins}`
  const dateStr = y === thisYear ? `${day} ${mo}` : `${day}/${mo}/${String(y).slice(-2)}`
  return `${dateStr} ${time}`
}

function appAgeDays(app) {
  const raw = app?.createdAt || app?.updatedAt || null
  if (!raw) return '-'
  const days = Math.floor((Date.now() - Date.parse(raw)) / (24 * 60 * 60 * 1000))
  return Number.isFinite(days) ? Math.max(0, days) : '-'
}

export function RtoView() {
  // #region agent log - error tracking
  try {
    fetch('http://127.0.0.1:7870/ingest/65ed9fd0-f2c1-47a1-ab1c-6ee276a8f045',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a58c06'},body:JSON.stringify({sessionId:'a58c06',location:'RtoView.jsx:173',message:'RtoView component mounting',data:{},timestamp:Date.now(),hypothesisId:'ERROR'})}).catch(()=>{});
  } catch(e) {
    console.error('Debug log failed:', e);
  }
  // #endregion
  
  const tick = useLegacyTick()
  const snapshot = getRtoSnapshot()
  const initialUi = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(UI_KEY) || '{}')
    } catch {
      return {}
    }
  }, [])
  const [tab, setTab] = useState(normalizeTab(initialUi.tab))
  const [scoreJson, setScoreJson] = useState(JSON.stringify(snapshot.scoreCfg || {}, null, 2))
  const [waJson, setWaJson] = useState(JSON.stringify(snapshot.waCfg || {}, null, 2))
  const [appFilter, setAppFilter] = useState(initialUi.appFilter || 'all')
  const [appSearch, setAppSearch] = useState(initialUi.appSearch || '')
  const [appScoreBand, setAppScoreBand] = useState('all')
  const [appDocsFilter, setAppDocsFilter] = useState('all')
  const [appReviewerFilter, setAppReviewerFilter] = useState('all')
  const [appSlaFilter, setAppSlaFilter] = useState('all')
  const [pickupFilter, setPickupFilter] = useState('all')
  const [pickupLocationFilter, setPickupLocationFilter] = useState('all')
  const [pickupSlotFilter, setPickupSlotFilter] = useState('all')
  const [pickupStatusFilter, setPickupStatusFilter] = useState('all')
  const [appPage, setAppPage] = usePagination('rto-applications')
  const [pickupPage, setPickupPage] = usePagination('rto-pickup')
  const pageSize = PAGE_SIZE
  const [message, setMessage] = useState('')
  const [selectedAppId, setSelectedAppId] = useState('')
  const [createModal, setCreateModal] = useState({
    open: false,
    userName: '',
    programId: '',
    score: '65',
    decision: 'pending',
    assignedVehicleId: '',
  })
  const [reviewModal, setReviewModal] = useState({
    open: false,
    appId: '',
    reviewer: 'Ops Reviewer',
    note: '',
    nextDecision: 'review',
    assignedVehicleId: '',
    documents: [],
    rejectReason: '',
    reviewEtaDays: 3,
    requiredDocs: [],
    waTemplate: '',
    scoreAdjust: 0,
    scoreNote: '',
  })
  const [docPreview, setDocPreview] = useState({ open: false, src: '', title: '' })
  const [scheduleModal, setScheduleModal] = useState({
    open: false,
    id: '',
    date: new Date().toISOString().slice(0, 10),
    time: '10:00',
    location: '',
    status: 'planned',
  })
  const [handoverModal, setHandoverModal] = useState({
    open: false,
    id: '',
    assignedVehicleId: '',
    identityVerified: false,
    vehicleConditionChecked: false,
    tireConditionChecked: false,
    keyHandoverChecked: false,
    stnkVerified: false,
    contractAcknowledged: false,
    handoverPhotoUrl: '',
    appStatusUpdated: false,
    notes: '',
    error: '',
  })
  const [calendarCursor, setCalendarCursor] = useState(`${new Date().toISOString().slice(0, 7)}-01`)
  const programs = useMemo(() => {
    void tick
    return getPrograms()
  }, [tick])
  const vehicles = useMemo(() => {
    void tick
    return getVehicles({})
  }, [tick])
  const vehiclesByProgram = useMemo(() => {
    const map = {}
    for (const vehicle of vehicles) {
      if (!map[vehicle.programId]) map[vehicle.programId] = []
      map[vehicle.programId].push(vehicle)
    }
    return map
  }, [vehicles])
  const selectedApp = useMemo(
    () => (selectedAppId ? (snapshot.apps || []).find((app) => app.id === selectedAppId) || null : null),
    [snapshot.apps, selectedAppId],
  )
  const stateSnapshot = useMemo(() => {
    void tick
    return getState()
  }, [tick])
  const selectedReviewApp = useMemo(
    () => (snapshot.apps || []).find((app) => app.id === reviewModal.appId) || null,
    [snapshot.apps, reviewModal.appId],
  )
  const reviewApplicantPhone = useMemo(() => {
    if (!selectedReviewApp) return ''
    const byId = (stateSnapshot.users || []).find((user) => user.userId === selectedReviewApp.userId)
    if (byId?.phone) return byId.phone
    const byName = (stateSnapshot.users || []).find((user) => (user.name || '').toLowerCase() === (selectedReviewApp.userName || '').toLowerCase())
    return byName?.phone || ''
  }, [selectedReviewApp, stateSnapshot.users])
  const filteredApps = useMemo(() => {
    let list = [...(snapshot.apps || [])]
    if (appFilter !== 'all') list = list.filter((app) => app.decision === appFilter)
    if (appScoreBand !== 'all') {
      list = list.filter((app) => {
        const score = Number(app.score || 0)
        if (appScoreBand === 'high') return score >= 80
        if (appScoreBand === 'medium') return score >= 60 && score < 80
        if (appScoreBand === 'low') return score < 60
        return true
      })
    }
    if (appDocsFilter !== 'all') {
      list = list.filter((app) => {
        const missingCount = (app.documents || []).filter((doc) => doc.status === 'missing').length
        return appDocsFilter === 'complete' ? missingCount === 0 : missingCount > 0
      })
    }
    if (appReviewerFilter !== 'all') {
      list = list.filter((app) => {
        const latest = (app.reviewLog || []).slice().reverse()[0]
        return (latest?.by || 'Unassigned') === appReviewerFilter
      })
    }
    if (appSlaFilter !== 'all') {
      list = list.filter((app) => {
        const age = Number(appAgeDays(app))
        if (!Number.isFinite(age)) return false
        if (appSlaFilter === 'overdue') return age > 3
        if (appSlaFilter === 'today') return age <= 1
        return true
      })
    }
    if (appSearch.trim()) {
      const q = appSearch.toLowerCase()
      list = list.filter(
        (app) =>
          app.id.toLowerCase().includes(q) ||
          (app.userName || '').toLowerCase().includes(q) ||
          (app.programId || '').toLowerCase().includes(q),
      )
    }
    return list
  }, [snapshot.apps, appFilter, appSearch, appScoreBand, appDocsFilter, appReviewerFilter, appSlaFilter])
  const pickup = snapshot.pickup || []
  const filteredPickup = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return pickup.filter((app) => {
      const dateValue = app.pickupSchedule?.date || (app.pickupDate ? new Date(app.pickupDate).toISOString().slice(0, 10) : '')
      const locationValue = String(app.pickupSchedule?.location || getProgramLocation(app.programId) || '').trim()
      const slotValue = app.pickupSchedule?.time || (app.pickupDate ? new Date(app.pickupDate).toISOString().slice(11, 16) : '')
      const statusValue = app.pickupSchedule?.status || (dateValue ? 'planned' : 'unscheduled')
      if (pickupFilter === 'today' && dateValue !== today) return false
      if (pickupFilter === 'overdue' && dateValue >= today) return false
      if (pickupFilter === 'upcoming' && dateValue <= today) return false
      if (pickupLocationFilter !== 'all' && locationValue !== pickupLocationFilter) return false
      if (pickupSlotFilter !== 'all' && slotValue !== pickupSlotFilter) return false
      if (pickupStatusFilter !== 'all' && statusValue !== pickupStatusFilter) return false
      return dateValue !== ''
    })
  }, [pickup, pickupFilter, pickupLocationFilter, pickupSlotFilter, pickupStatusFilter, programs])
  const pickupLocations = useMemo(
    () =>
      [...new Map((pickup || [])
        .map((app) => String(app.pickupSchedule?.location || getProgramLocation(app.programId) || '').trim())
        .filter(Boolean)
        .map((value) => [value.toLowerCase(), value])).values()],
    [pickup, programs],
  )
  const pickupSlots = useMemo(
    () => [...new Set((pickup || []).map((app) => app.pickupSchedule?.time || (app.pickupDate ? new Date(app.pickupDate).toISOString().slice(11, 16) : '')).filter(Boolean))].sort(),
    [pickup],
  )
  const selectedScheduleApp = useMemo(
    () => (scheduleModal.id ? (snapshot.apps || []).find((item) => item.id === scheduleModal.id) || null : null),
    [snapshot.apps, scheduleModal.id],
  )
  const selectedHandoverApp = useMemo(
    () => (handoverModal.id ? (snapshot.apps || []).find((item) => item.id === handoverModal.id) || null : null),
    [snapshot.apps, handoverModal.id],
  )
  const selectedHandoverVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === (handoverModal.assignedVehicleId || selectedHandoverApp?.assignedVehicleId)) || null,
    [vehicles, handoverModal.assignedVehicleId, selectedHandoverApp?.assignedVehicleId],
  )
  const handoverVehicleOptions = useMemo(() => {
    if (!selectedHandoverApp?.programId) return []
    return vehicles.filter(
      (vehicle) =>
        vehicle.programId === selectedHandoverApp.programId &&
        (vehicle.id === selectedHandoverApp.assignedVehicleId || vehicle.status === 'available'),
    )
  }, [vehicles, selectedHandoverApp?.programId])
  const scheduleProgram = useMemo(
    () => programs.find((item) => item.id === selectedScheduleApp?.programId) || null,
    [programs, selectedScheduleApp?.programId],
  )
  const schedulePic = useMemo(
    () => DEFAULT_PICKUP_CONTACT_BY_PARTNER[scheduleProgram?.partnerId] || { name: 'Ops Pickup Desk', phone: '+62 811-0000-0000' },
    [scheduleProgram?.partnerId],
  )
  const appTotalPages = Math.max(1, Math.ceil(filteredApps.length / pageSize))
  const pickupTotalPages = Math.max(1, Math.ceil(filteredPickup.length / pageSize))
  const currentAppPage = Math.min(appPage, appTotalPages)
  const currentPickupPage = Math.min(pickupPage, pickupTotalPages)
  const appRows = filteredApps.slice((currentAppPage - 1) * pageSize, currentAppPage * pageSize)
  const pickupRows = filteredPickup.slice((currentPickupPage - 1) * pageSize, currentPickupPage * pageSize)
  const usersById = useMemo(() => new Map((getState()?.users || []).map((u) => [u.userId, u])), [tick])
  const vehiclesById = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles])
  const appStats = useMemo(() => {
    const allApps = snapshot.apps || []
    return {
      total: allApps.length,
      pending: allApps.filter((app) => app.decision === 'pending' || app.decision === 'review' || app.decision === 'pending_docs').length,
      approved: allApps.filter((app) => app.decision === 'approved').length,
      rejected: allApps.filter((app) => app.decision === 'rejected').length,
    }
  }, [snapshot.apps])
  const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']
  const todayIso = new Date().toISOString().slice(0, 10)
  const dateChoices = useMemo(() => {
    return Array.from({ length: 120 }, (_, idx) => plusDaysISO(todayIso, idx))
  }, [todayIso])
  const slotLoadMap = useMemo(() => {
    const map = {}
    const location = (scheduleModal.location || '').trim().toLowerCase()
    for (const app of snapshot.pickup || []) {
      if (scheduleModal.id && app.id === scheduleModal.id) continue
      const date = app.pickupSchedule?.date
      const time = app.pickupSchedule?.time
      if (!date || !time) continue
      const appLocation = String(app.pickupSchedule?.location || getProgramLocation(app.programId) || '').trim().toLowerCase()
      if (location && appLocation && appLocation !== location) continue
      const key = `${date}|${time}`
      map[key] = (map[key] || 0) + 1
    }
    return map
  }, [snapshot.pickup, scheduleModal.id, scheduleModal.location])
  const dateAvailability = useMemo(() => {
    const offDays = Array.isArray(scheduleProgram?.offDays) ? scheduleProgram.offDays : [0]
    const holidayDates = Array.isArray(scheduleProgram?.holidayDates) ? scheduleProgram.holidayDates : []
    const result = {}
    const dayShortToNum = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
    for (const date of dateChoices) {
      const isPast = date < todayIso
      const [, , day] = date.split('-').map(Number)
      const weekdayNum = dayShortToNum[dayShort(date)] ?? 0
      const isWeeklyOff = offDays.length > 0 && offDays.includes(weekdayNum)
      const isMonthlyHoliday = holidayDates.length > 0 && holidayDates.includes(day)
      const isOffDay = isWeeklyOff || isMonthlyHoliday
      const hasOpenSlot = timeSlots.some((slot) => (slotLoadMap[`${date}|${slot}`] || 0) < 3)
      let reason = ''
      if (isWeeklyOff) reason = `Unavailable (${dayShort(date)})`
      else if (isMonthlyHoliday) reason = `Unavailable (${day}th)`
      else if (!hasOpenSlot) reason = 'Fully booked'
      result[date] = {
        available: !isPast && !isOffDay && hasOpenSlot,
        reason,
      }
    }
    return result
  }, [dateChoices, slotLoadMap, timeSlots, todayIso, scheduleProgram?.offDays, scheduleProgram?.holidayDates])
  const monthLabel = useMemo(
    () => new Date(`${calendarCursor}T00:00:00`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    [calendarCursor],
  )
  const calendarCells = useMemo(() => {
    const [y, m] = calendarCursor.split('-').map(Number)
    const firstDay = new Date(y, m - 1, 1)
    const leadingBlanks = firstDay.getDay()
    const totalDays = new Date(y, m, 0).getDate()
    const cells = []
    for (let idx = 0; idx < leadingBlanks; idx += 1) cells.push({ key: `blank-${idx}`, blank: true })
    for (let day = 1; day <= totalDays; day += 1) {
      const date = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      cells.push({ key: date, blank: false, date })
    }
    return cells
  }, [calendarCursor])

  useEffect(() => {
    localStorage.setItem(UI_KEY, JSON.stringify({ tab, appFilter, appSearch }))
  }, [tab, appFilter, appSearch])

  const save = () => {
    let score = null
    let wa = null
    try {
      score = JSON.parse(scoreJson)
      wa = JSON.parse(waJson)
    } catch {
      setMessage('Invalid JSON. Fix format before saving.')
      return
    }
    if (!score || !wa) {
      setMessage('Invalid JSON. Fix format before saving.')
      return
    }
    saveRtoConfigs(score, wa)
    setMessage('Application config saved to compatibility keys.')
  }

  function getProgramLocation(programId) {
    const program = programs.find((item) => item.id === programId)
    return program?.pickupLocation || DEFAULT_PICKUP_BY_PARTNER[program?.partnerId] || 'Program Pickup Point'
  }

  const openReview = (app) => {
    const docs = Array.isArray(app.documents) ? app.documents : []
    const requiredDocs = docs.filter((d) => d.status === 'missing' || d.status === 'rejected').map((d) => d.name)
    const nextDecision = app.decision === 'approved' ? 'approved' : app.decision === 'rejected' ? 'rejected' : 'review'
    setReviewModal({
      open: true,
      appId: app.id,
      reviewer: 'Ops Reviewer',
      note: app.notes || '',
      nextDecision,
      assignedVehicleId: app.assignedVehicleId || '',
      documents: docs,
      rejectReason: '',
      reviewEtaDays: 3,
      requiredDocs,
      waTemplate: buildWATemplate(app, nextDecision, { requiredDocs, reviewEtaDays: 3 }),
      scoreAdjust: 0,
      scoreNote: '',
    })
  }

  const submitReview = () => {
    const reviewApp = (snapshot.apps || []).find((item) => item.id === reviewModal.appId)
    if (!reviewApp) return
    if (!String(reviewModal.reviewer || '').trim()) {
      setMessage('Reviewer name is required.')
      return
    }
    if (reviewModal.nextDecision === 'approved' && !reviewModal.assignedVehicleId) {
      setMessage('Assign vehicle is required before approving application.')
      return
    }
    if (reviewModal.nextDecision === 'pending_docs' && (reviewModal.requiredDocs || []).length === 0) {
      setMessage('Select at least one required document for "Needs More Docs".')
      return
    }
    if (reviewModal.nextDecision === 'rejected' && !String(reviewModal.rejectReason || '').trim()) {
      setMessage('Reject reason is required before rejecting application.')
      return
    }
    const finalScore = clampScore(Number(reviewApp.score || 0) + Number(reviewModal.scoreAdjust || 0))
    const finalNote = [
      reviewModal.note,
      reviewModal.rejectReason ? `Reject reason: ${reviewModal.rejectReason}` : '',
      reviewModal.nextDecision === 'pending_docs' ? `Required docs: ${reviewModal.requiredDocs.join(', ')}` : '',
      reviewModal.nextDecision === 'review' ? `Review ETA: ${reviewModal.reviewEtaDays} days` : '',
      Number(reviewModal.scoreAdjust || 0) !== 0 ? `Manual score adj: ${Number(reviewModal.scoreAdjust || 0) > 0 ? '+' : ''}${Number(reviewModal.scoreAdjust || 0)}` : '',
      reviewModal.scoreNote ? `Score note: ${reviewModal.scoreNote}` : '',
    ]
      .filter(Boolean)
      .join(' | ')
    decideRtoApplication(reviewModal.appId, reviewModal.nextDecision, {
      assignedVehicleId: reviewModal.assignedVehicleId || null,
      notes: finalNote,
      documents: reviewModal.documents,
      score: finalScore,
      requiredDocs: reviewModal.requiredDocs,
      rejectReason: reviewModal.rejectReason,
      reviewEntry: {
        at: new Date().toISOString(),
        by: reviewModal.reviewer || 'Ops Reviewer',
        decision: reviewModal.nextDecision,
        note: finalNote,
      },
    })
    setReviewModal((prev) => ({ ...prev, open: false }))
    setSelectedAppId(reviewApp.id)
    setMessage('Review saved.')
  }
  const markAllMissing = () => {
    setReviewModal((prev) => ({
      ...prev,
      documents: (prev.documents || []).map((item) => ({ ...item, status: 'missing' })),
      nextDecision: 'pending_docs',
      requiredDocs: (prev.documents || []).map((item) => item.name),
      waTemplate: buildWATemplate(selectedReviewApp, 'pending_docs', { requiredDocs: (prev.documents || []).map((item) => item.name) }),
    }))
  }
  const markAllSubmitted = () => {
    setReviewModal((prev) => ({
      ...prev,
      documents: (prev.documents || []).map((item) => ({ ...item, status: 'submitted' })),
      requiredDocs: [],
      waTemplate: buildWATemplate(selectedReviewApp, prev.nextDecision, { requiredDocs: [] }),
    }))
  }
  const onSchedule = (id) => {
    const app = (snapshot.apps || []).find((item) => item.id === id)
    if (!app || app.decision !== 'approved') {
      setMessage('Pickup can only be scheduled for approved applications.')
      return
    }
    const schedule = app?.pickupSchedule || {}
    const preferredDate = schedule.date || todayIso
    const fallbackDate =
      dateChoices.find((date) => dateAvailability[date]?.available) ||
      preferredDate
    const effectiveDate = dateAvailability[preferredDate]?.available ? preferredDate : fallbackDate
    setScheduleModal({
      open: true,
      id,
      date: effectiveDate,
      time: schedule.time || '10:00',
      location: schedule.location || getProgramLocation(app?.programId),
      status: schedule.status || (schedule.date ? 'planned' : 'unscheduled'),
    })
    setCalendarCursor(`${effectiveDate.slice(0, 7)}-01`)
  }

  const submitCreate = () => {
    if (!createModal.userName.trim()) return
    const selectedProgram = programs.find((item) => item.id === createModal.programId)
    createRtoApplication({
      userName: createModal.userName.trim(),
      programId: createModal.programId || '',
      score: Number(createModal.score || 0),
      decision: createModal.decision,
      assignedVehicleId: createModal.assignedVehicleId || null,
      pickupLocation: selectedProgram?.pickupLocation || getProgramLocation(createModal.programId),
      pickupDate:
        createModal.decision === 'approved' ? new Date(`${new Date().toISOString().slice(0, 10)}T08:00:00`).toISOString() : null,
    })
    setCreateModal((prev) => ({ ...prev, open: false, userName: '', score: '65', assignedVehicleId: '' }))
  }

  const submitSchedule = () => {
    if (!scheduleModal.id || !scheduleModal.date || !scheduleModal.time) return
    if (!dateAvailability[scheduleModal.date]?.available) return
    if ((slotLoadMap[`${scheduleModal.date}|${scheduleModal.time}`] || 0) >= 3) return
    scheduleRtoPickup(scheduleModal.id, {
      date: scheduleModal.date,
      time: scheduleModal.time,
      location: scheduleModal.location || 'Program Pickup Point',
      status: scheduleModal.status || 'confirmed',
    })
    setScheduleModal((prev) => ({ ...prev, open: false }))
  }
  const openHandover = (app) => {
    if (!app?.id || app.decision !== 'approved' || !app.assignedVehicleId) {
      setMessage('Handover checklist requires approved application with assigned vehicle.')
      return
    }
    const existing = app.handoverChecklist || {}
    const existingPhotos = app.handoverPhotos || {}
    setHandoverModal({
      open: true,
      id: app.id,
      assignedVehicleId: app.assignedVehicleId || '',
      identityVerified: Boolean(existing.identityVerified),
      vehicleConditionChecked: Boolean(existing.vehicleConditionChecked),
      tireConditionChecked: Boolean(existing.tireConditionChecked),
      keyHandoverChecked: Boolean(existing.keyHandoverChecked),
      stnkVerified: Boolean(existing.stnkVerified),
      contractAcknowledged: Boolean(existing.contractAcknowledged),
      handoverPhotoUrl: existingPhotos.handover || existingPhotos.front || existingPhotos.left || '',
      appStatusUpdated: Boolean(existing.appStatusUpdated),
      notes: '',
      error: '',
    })
  }
  const onHandoverPhotoChange = (key, event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setHandoverModal((prev) => ({ ...prev, [key]: result, error: '' }))
    }
    reader.readAsDataURL(file)
  }
  const submitHandover = () => {
    if (!handoverModal.id) return
    if (!handoverModal.assignedVehicleId) {
      setHandoverModal((prev) => ({ ...prev, error: 'Assigned vehicle is required for handover completion.' }))
      return
    }
    const targetVehicle = vehicles.find((vehicle) => vehicle.id === handoverModal.assignedVehicleId)
    if (!targetVehicle) {
      setHandoverModal((prev) => ({ ...prev, error: 'Selected vehicle was not found.' }))
      return
    }
    if (selectedHandoverApp?.assignedVehicleId !== handoverModal.assignedVehicleId && targetVehicle.status !== 'available') {
      setHandoverModal((prev) => ({ ...prev, error: 'Vehicle can only be changed to one with AVAILABLE status.' }))
      return
    }
    if (selectedHandoverApp?.assignedVehicleId !== handoverModal.assignedVehicleId) {
      decideRtoApplication(handoverModal.id, 'approved', {
        assignedVehicleId: handoverModal.assignedVehicleId,
        notes: 'Vehicle reassigned during handover process.',
      })
    }
    const checklist = {
      identityVerified: Boolean(handoverModal.identityVerified),
      vehicleConditionChecked: Boolean(handoverModal.vehicleConditionChecked),
      tireConditionChecked: Boolean(handoverModal.tireConditionChecked),
      keyHandoverChecked: Boolean(handoverModal.keyHandoverChecked),
      stnkVerified: Boolean(handoverModal.stnkVerified),
      contractAcknowledged: Boolean(handoverModal.contractAcknowledged),
      appStatusUpdated: Boolean(handoverModal.appStatusUpdated),
      photos: {
        handover: handoverModal.handoverPhotoUrl,
      },
    }
    const allChecked = [
      checklist.identityVerified,
      checklist.vehicleConditionChecked,
      checklist.tireConditionChecked,
      checklist.keyHandoverChecked,
      checklist.stnkVerified,
      checklist.contractAcknowledged,
      checklist.appStatusUpdated,
    ].every(Boolean)
    if (!allChecked) {
      setHandoverModal((prev) => ({ ...prev, error: 'Check all required handover checklist items before completion.' }))
      return
    }
    const ok = completeRtoHandover(handoverModal.id, checklist, handoverModal.notes || '')
    if (!ok) {
      setHandoverModal((prev) => ({ ...prev, error: 'Unable to complete handover. Verify vehicle and checklist status.' }))
      return
    }
    setHandoverModal((prev) => ({ ...prev, open: false, notes: '', error: '' }))
    setMessage('Handover completed. Renter is now activated for Renters List.')
  }
  const resetApplicationFilters = () => {
    setAppSearch('')
    setAppFilter('all')
    setAppScoreBand('all')
    setAppDocsFilter('all')
    setAppSlaFilter('all')
    setAppReviewerFilter('all')
    setAppPage(1)
  }

  // Button variants for tab navigation
  const topTabVariant = (isActive) => (isActive ? 'legacyPrimary' : 'legacyPill')

  return (
    <PageShell>
      <PageHeader>
        <PageTitle>Application Operations</PageTitle>
        <PageMeta>{snapshot.apps?.length || 0} Applications</PageMeta>
      </PageHeader>
      <StatsGrid>
        <StatCard label="Total Applications" value={appStats.total} />
        <StatCard label="Pending Review" value={appStats.pending} valueClassName="text-amber-700" />
        <StatCard label="Approved" value={appStats.approved} valueClassName="text-emerald-700" />
        <StatCard label="Rejected" value={appStats.rejected} valueClassName="text-rose-700" />
      </StatsGrid>

      <div className="mb-2 flex flex-wrap gap-2">
        {TAB_ITEMS.map((item) => (
          <Button
            key={item.key}
            variant={topTabVariant(tab === item.key)}
            size="legacy"
            aria-pressed={tab === item.key}
            onClick={() => setTab(normalizeTab(item.key))}
          >
            {item.label}
          </Button>
        ))}
      </div>
      {message ? <div className="mb-2 text-base text-amber-700">{message}</div> : null}

      {tab === 'applications' && (
        <div className="flex flex-col gap-3">
          {/* #region agent log - hypothesis B */}
          {(() => { fetch('http://127.0.0.1:7870/ingest/65ed9fd0-f2c1-47a1-ab1c-6ee276a8f045',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a58c06'},body:JSON.stringify({sessionId:'a58c06',location:'RtoView.jsx:752',message:'FilterBar with lg:grid-cols-6 rendered',data:{gridCols:6,tab:'applications'},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{}); return null; })()}
          {/* #endregion */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2">
            <div className="text-base font-semibold text-foreground">Application Filters</div>
            <Button variant="legacyGhost" size="legacy" onClick={resetApplicationFilters}>
              Reset Filters
            </Button>
          </div>
          <FilterBar className="lg:grid-cols-6">
            <div className="lg:col-span-2">
              <div className="mb-1 text-base font-semibold uppercase tracking-wide text-muted-foreground">Search</div>
              <Input
                variant="legacy"
                placeholder="App ID, applicant, or program"
                value={appSearch}
                onChange={(e) => {
                  setAppSearch(e.target.value)
                  setAppPage(1)
                }}
              />
            </div>
            <div>
              <div className="mb-1 text-base font-semibold uppercase tracking-wide text-muted-foreground">Decision</div>
              <Select
                variant="legacy"
                value={appFilter}
                onChange={(e) => {
                  setAppFilter(e.target.value)
                  setAppPage(1)
                }}
              >
                <option value="all">All Decisions</option>
                <option value="pending">Pending</option>
                <option value="review">Review</option>
                <option value="pending_docs">Needs Docs</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Select>
            </div>
            <div>
              <div className="mb-1 text-base font-semibold uppercase tracking-wide text-muted-foreground">Score Band</div>
              <Select
                variant="legacy"
                value={appScoreBand}
                onChange={(e) => {
                  setAppScoreBand(e.target.value)
                  setAppPage(1)
                }}
              >
                <option value="all">All Scores</option>
                <option value="high">High (80+)</option>
                <option value="medium">Medium (60-79)</option>
                <option value="low">Low (&lt;60)</option>
              </Select>
            </div>
            <div>
              <div className="mb-1 text-base font-semibold uppercase tracking-wide text-muted-foreground">Document Status</div>
              <Select
                variant="legacy"
                value={appDocsFilter}
                onChange={(e) => {
                  setAppDocsFilter(e.target.value)
                  setAppPage(1)
                }}
              >
                <option value="all">All Docs</option>
                <option value="complete">Docs Complete</option>
                <option value="missing">Missing Docs</option>
              </Select>
            </div>
            <div>
              <div className="mb-1 text-base font-semibold uppercase tracking-wide text-muted-foreground">SLA</div>
              <Select
                variant="legacy"
                value={appSlaFilter}
                onChange={(e) => {
                  setAppSlaFilter(e.target.value)
                  setAppPage(1)
                }}
              >
                <option value="all">All SLA</option>
                <option value="today">Fresh (0-1d)</option>
                <option value="overdue">Overdue (&gt;3d)</option>
              </Select>
            </div>
            <div>
              <div className="mb-1 text-base font-semibold uppercase tracking-wide text-muted-foreground">Reviewer</div>
              <Select
                variant="legacy"
                value={appReviewerFilter}
                onChange={(e) => {
                  setAppReviewerFilter(e.target.value)
                  setAppPage(1)
                }}
              >
                <option value="all">All Reviewers</option>
                <option value="Unassigned">Unassigned</option>
                <option value="Ops Reviewer">Ops Reviewer</option>
                <option value="Risk Analyst">Risk Analyst</option>
              </Select>
            </div>
          </FilterBar>
          <div className="flex justify-end">
            <Button variant="legacyPrimary" size="legacy" onClick={() => setCreateModal((prev) => ({ ...prev, open: true }))}>
              + Add Renter
            </Button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table density="legacy" className={TABLE_MIN_WIDTH}>
            <TableHeader tone="legacy">
              <TableRow tone="legacy">
                <TableHead>APP</TableHead>
                <TableHead>APPLICANT</TableHead>
                <TableHead>PROGRAM</TableHead>
                <TableHead>SCORE</TableHead>
                <TableHead>DOCUMENT REVIEW</TableHead>
                <TableHead>REVIEWER</TableHead>
                <TableHead>LAST REVIEWED</TableHead>
                <TableHead>ASSIGNED VEHICLE</TableHead>
                <TableHead>PICKUP STATUS</TableHead>
                <TableHead>DECISION</TableHead>
                <TableHead>ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appRows.length > 0 ? (
                appRows.map((app) => (
                  <TableRow key={app.id} className="cursor-pointer" tone="legacy" onClick={() => setSelectedAppId(app.id)}>
                    <TableCell>
                      <div className="font-semibold">{app.id}</div>
                      <div className="text-base text-muted-foreground">{formatSubmissionTime(app.createdAt || app.updatedAt)}</div>
                    </TableCell>
                    <TableCell>
                      <div>{app.userName || '-'}</div>
                      <div className="text-base text-muted-foreground">{usersById.get(app.userId)?.phone || '-'}</div>
                    </TableCell>
                    <TableCell>{app.programId}</TableCell>
                    <TableCell>
                      {/* #region agent log - ScoreBadge render */}
                      {(() => { fetch('http://127.0.0.1:7870/ingest/65ed9fd0-f2c1-47a1-ab1c-6ee276a8f045',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a58c06'},body:JSON.stringify({sessionId:'a58c06',location:'RtoView.jsx:885',message:'ScoreBadge render attempt',data:{score:app?.score,hasScore:!!app?.score},timestamp:Date.now(),hypothesisId:'ERROR'})}).catch(()=>{}); return null; })()}
                      {/* #endregion */}
                      <ScoreBadge score={app.score} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(app.documents || []).slice(0, 3).map((document) => (
                          <img
                            key={`${app.id}-${document.id}`}
                            src={document.img || buildDocPreviewSrc(document.name, document.status)}
                            alt={document.name}
                            title={document.name}
                            className="h-7 w-7 rounded-md border border-border object-cover"
                            onClick={(event) => {
                              event.stopPropagation()
                              setDocPreview({
                                open: true,
                                src: document.img || buildDocPreviewSrc(document.name, document.status),
                                title: document.name,
                              })
                            }}
                          />
                        ))}
                        <Badge variant="warning" size="sm">
                          {(app.documents || []).filter((d) => d.status === 'missing').length} missing
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(app.reviewLog || []).length > 0 ? (app.reviewLog || []).slice().reverse()[0]?.by || 'Unassigned' : 'Unassigned'}
                    </TableCell>
                    <TableCell className="text-base text-muted-foreground">
                      {(app.reviewLog || []).length > 0
                        ? new Date((app.reviewLog || []).slice().reverse()[0]?.at).toLocaleString('id-ID')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {app.assignedVehicleId ? (
                        (() => {
                          const v = vehiclesById.get(app.assignedVehicleId)
                          return (
                            <div className="text-base">
                              <Badge variant="info" size="sm">{app.assignedVehicleId}</Badge>
                              {v && (
                                <div className="mt-1 text-muted-foreground">
                                  <span>{v.brand || '-'} {v.model || '-'}</span>
                                  <span className="ml-1 font-mono text-muted-foreground">{v.plate || '-'}</span>
                                </div>
                              )}
                            </div>
                          )
                        })()
                      ) : (
                        <span className="text-base text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={app.pickupSchedule?.status || 'unscheduled'} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={decisionTone(app.decision).variant || 'default'}>
                        {decisionTone(app.decision).label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="legacyPill"
                          size="legacy"
                          onClick={(event) => {
                            event.stopPropagation()
                            openReview(app)
                          }}
                        >
                          Review
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow tone="legacy">
                  <TableCell colSpan={11} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No applications found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>

          {selectedApp && (
            <div className="rounded-lg border border-border bg-muted p-3">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <div className="text-base text-muted-foreground">Selected Application</div>
                  <div className="font-extrabold text-foreground">{selectedApp.id} - {selectedApp.userName}</div>
                  <div className="text-base text-muted-foreground">
                    Program: {selectedApp.programId} | Score:{' '}
                    <ScoreBadge score={selectedApp.score} />{' '}
                    | Status:{' '}
                    <Badge variant={decisionTone(selectedApp.decision).variant || 'default'}>
                      {decisionTone(selectedApp.decision).label}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="legacyPrimary" size="legacy" onClick={() => openReview(selectedApp)}>
                    Review Application
                  </Button>
                  <Button
                    variant="legacyGhost"
                    size="legacy"
                    disabled={selectedApp.decision !== 'approved'}
                    onClick={() => onSchedule(selectedApp.id)}
                  >
                    {selectedApp.pickupSchedule?.date ? 'Edit Pickup Slot' : 'Set Pickup Slot'}
                  </Button>
                </div>
              </div>
              <div className="mt-2 text-base text-muted-foreground">
                {selectedApp.decision === 'approved'
                  ? 'Application approved - pickup scheduling enabled.'
                  : 'Select review outcome first. Pickup scheduling is disabled until application is approved.'}
              </div>
              <div className="mt-2.5">
                <div className="mb-1.5 text-base text-muted-foreground">Review Acknowledgement Trail</div>
                {(selectedApp.reviewLog || []).length > 0 ? (
                  (selectedApp.reviewLog || []).slice().reverse().slice(0, 5).map((item, idx) => (
                    <div key={`${selectedApp.id}-review-${idx}`} className="py-1 text-base text-muted-foreground">
                      {new Date(item.at).toLocaleString('id-ID')} - {item.by} -{' '}
                      <span
                        className={`rounded-full px-2 py-0.5 text-base font-bold ${decisionTone(item.decision).tone}`}
                      >
                        {decisionTone(item.decision).label}
                      </span>{' '}
                      {item.note ? `- ${item.note}` : ''}
                    </div>
                  ))
                ) : (
                  <div className="text-base text-muted-foreground">No reviews yet.</div>
                )}
              </div>
            </div>
          )}

          <PageFooter>
            <Button
              variant="legacyGhost"
              size="legacy"
              disabled={currentAppPage <= 1}
              onClick={() => setAppPage((p) => Math.max(1, Math.min(currentAppPage, p) - 1))}
            >
              Prev
            </Button>
            <PaginationInfo currentPage={currentAppPage} totalPages={appTotalPages} totalItems={filteredApps.length} itemName="applications" />
            <Button
              variant="legacyGhost"
              size="legacy"
              disabled={currentAppPage >= appTotalPages}
              onClick={() => setAppPage((p) => Math.min(appTotalPages, Math.min(currentAppPage, p) + 1))}
            >
              Next
            </Button>
          </PageFooter>
        </div>
      )}

      {tab === 'pickup' && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-4">
            <Select
              variant="legacy"
              value={pickupFilter}
              onChange={(e) => {
                setPickupFilter(e.target.value)
                setPickupPage(1)
              }}
            >
              <option value="all">All Pickup Dates</option>
              <option value="today">Today</option>
              <option value="overdue">Overdue</option>
              <option value="upcoming">Upcoming</option>
            </Select>
            <Select
              variant="legacy"
              value={pickupLocationFilter}
              onChange={(e) => {
                setPickupLocationFilter(e.target.value)
                setPickupPage(1)
              }}
            >
              <option value="all">All Locations</option>
              {pickupLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </Select>
            <Select
              variant="legacy"
              value={pickupSlotFilter}
              onChange={(e) => {
                setPickupSlotFilter(e.target.value)
                setPickupPage(1)
              }}
            >
              <option value="all">All Time Slots</option>
              {pickupSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </Select>
            <Select
              variant="legacy"
              value={pickupStatusFilter}
              onChange={(e) => {
                setPickupStatusFilter(e.target.value)
                setPickupPage(1)
              }}
            >
              <option value="all">All Pickup Status</option>
              <option value="planned">Planned</option>
              <option value="confirmed">Confirmed</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="completed">Completed</option>
              <option value="no_show">No Show</option>
            </Select>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table density="legacy" className={TABLE_MIN_WIDTH}>
            <TableHeader tone="legacy">
              <TableRow tone="legacy">
                <TableHead>APP</TableHead>
                <TableHead>APPLICANT</TableHead>
                <TableHead>VEHICLE</TableHead>
                <TableHead>VEHICLE STATUS</TableHead>
                <TableHead>DATE</TableHead>
                <TableHead>TIME</TableHead>
                <TableHead>LOCATION</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>HANDOVER</TableHead>
                <TableHead>ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pickupRows.length > 0 ? (
                pickupRows.map((app) => (
                  <TableRow key={app.id} tone="legacy">
                    <TableCell>{app.id}</TableCell>
                    <TableCell>{app.userName}</TableCell>
                    <TableCell>
                      {app.assignedVehicleId ? (
                        (() => {
                          const v = vehiclesById.get(app.assignedVehicleId)
                          return (
                            <div className="text-base">
                              <div className="font-semibold text-foreground">{app.assignedVehicleId}</div>
                              {v && (
                                <div className="text-muted-foreground">
                                  {v.brand || '-'} {v.model || '-'} • <span className="font-mono">{v.plate || '-'}</span>
                                </div>
                              )}
                            </div>
                          )
                        })()
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const assignedVehicle = vehicles.find((vehicle) => vehicle.id === app.assignedVehicleId)
                        const movement = Number(assignedVehicle?.speed || 0) > 0 ? 'RUNNING' : 'STOPPED'
                        return assignedVehicle ? (
                          <div className="flex flex-wrap gap-1.5">
                            <StatusBadge status={assignedVehicle.status} />
                            <Badge variant={assignedVehicle.isOnline ? 'success' : 'neutral'}>
                              {assignedVehicle.isOnline ? 'ONLINE' : 'OFFLINE'}
                            </Badge>
                            <Badge variant={movement === 'RUNNING' ? 'info' : 'neutral'}>
                              {movement}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )
                      })()}
                    </TableCell>
                    <TableCell>{app.pickupSchedule?.date || (app.pickupDate ? new Date(app.pickupDate).toLocaleDateString('id-ID') : '-')}</TableCell>
                    <TableCell>{app.pickupSchedule?.time || (app.pickupDate ? new Date(app.pickupDate).toISOString().slice(11, 16) : '-')}</TableCell>
                    <TableCell>{app.pickupSchedule?.location || getProgramLocation(app.programId)}</TableCell>
                    <TableCell>
                      <StatusBadge status={app.pickupSchedule?.status || 'planned'} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={app.handoverCompleted ? 'success' : 'warning'}>
                        {app.handoverCompleted ? 'CHECKLIST COMPLETE' : 'PENDING CHECKLIST'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        <Button variant="legacyPill" size="legacy" onClick={() => onSchedule(app.id)}>
                          {app.pickupSchedule?.date ? 'Edit Slot' : 'Set Slot'}
                        </Button>
                        <Button variant="legacyPill" size="legacy" onClick={() => openHandover(app)}>
                          {app.handoverCompleted ? 'View Checklist' : 'Complete Handover'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow tone="legacy">
                  <TableCell colSpan={10} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No pickups scheduled yet.
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
              disabled={currentPickupPage <= 1}
              onClick={() => setPickupPage((p) => Math.max(1, Math.min(currentPickupPage, p) - 1))}
            >
              Prev
            </Button>
            <PaginationInfo currentPage={currentPickupPage} totalPages={pickupTotalPages} totalItems={filteredPickup.length} itemName="pickups" />
            <Button
              variant="legacyGhost"
              size="legacy"
              disabled={currentPickupPage >= pickupTotalPages}
              onClick={() => setPickupPage((p) => Math.min(pickupTotalPages, Math.min(currentPickupPage, p) + 1))}
            >
              Next
            </Button>
          </PageFooter>
        </div>
      )}

      {(tab === 'score' || tab === 'wa') && (
        <>
          <p className="text-base text-muted-foreground">
            This migration-safe RTO panel preserves legacy keys while writing a versioned payload.
          </p>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div>
              <h3 className="mb-1.5 text-base text-muted-foreground">Score Config</h3>
              <textarea
                className={`${FORM_CONTROL_CLS} h-[280px] font-mono`}
                value={scoreJson}
                onChange={(e) => setScoreJson(e.target.value)}
              />
            </div>
            <div>
              <h3 className="mb-1.5 text-base text-muted-foreground">WA Templates</h3>
              <textarea
                className={`${FORM_CONTROL_CLS} h-[280px] font-mono`}
                value={waJson}
                onChange={(e) => setWaJson(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="legacyPrimary" size="legacy" onClick={save}>
              Save Compatibility Config
            </Button>
            <span className="text-base text-muted-foreground">{message}</span>
          </div>
        </>
      )}

      {/* #region agent log - hypothesis E */}
      {createModal.open && fetch('http://127.0.0.1:7870/ingest/65ed9fd0-f2c1-47a1-ab1c-6ee276a8f045',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a58c06'},body:JSON.stringify({sessionId:'a58c06',location:'RtoView.jsx:1282',message:'Custom createModal opened',data:{modal:'createModal',zIndex:50,hasFormControlCls:true},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{})}
      {/* #endregion */}
      <div className={`${createModal.open ? 'flex' : 'hidden'} fixed inset-0 z-50 items-center justify-center bg-black/45 p-4`}>
        <div className="max-h-[92vh] w-full max-w-xl overflow-auto rounded-xl border border-border bg-background p-4 shadow-xl">
          <h2>Add New Renter</h2>
          <div className="mb-3">
            <label className="mb-1 block text-base font-semibold text-muted-foreground">Applicant Name</label>
            <input
              className={FORM_CONTROL_CLS}
              value={createModal.userName}
              onChange={(e) => setCreateModal((prev) => ({ ...prev, userName: e.target.value }))}
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-base font-semibold text-muted-foreground">Program / Scheme</label>
            <select
              className={FORM_CONTROL_CLS}
              value={createModal.programId}
              onChange={(e) => setCreateModal((prev) => ({ ...prev, programId: e.target.value }))}
            >
              <option value="">Select Program</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {`${program.name || program.shortName || program.id} • ${program.type || '-'} (${program.id})`}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-base font-semibold text-muted-foreground">Score</label>
            <input
              className={FORM_CONTROL_CLS}
              value={createModal.score}
              onChange={(e) => setCreateModal((prev) => ({ ...prev, score: e.target.value }))}
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-base font-semibold text-muted-foreground">Decision</label>
            <select
              className={FORM_CONTROL_CLS}
              value={createModal.decision}
              onChange={(e) => setCreateModal((prev) => ({ ...prev, decision: e.target.value }))}
            >
              <option value="pending">Pending</option>
              <option value="review">Review</option>
              <option value="pending_docs">Needs Docs</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-base font-semibold text-muted-foreground">Assigned Vehicle (optional)</label>
            <select
              className={FORM_CONTROL_CLS}
              value={createModal.assignedVehicleId}
              onChange={(e) => setCreateModal((prev) => ({ ...prev, assignedVehicleId: e.target.value }))}
            >
              <option value="">Unassigned</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.id} • {vehicle.plate}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="legacyGhost" size="legacy" onClick={() => setCreateModal((prev) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button variant="legacyPrimary" size="legacy" onClick={submitCreate}>
              Add Renter
            </Button>
          </div>
        </div>
      </div>

      <div className={`${reviewModal.open ? 'flex' : 'hidden'} fixed inset-0 z-50 items-center justify-center bg-black/45 p-4`}>
        <div className="max-h-[92vh] w-[95vw] max-w-5xl overflow-auto rounded-xl border border-border bg-background p-4 shadow-xl">
          <h2>Application Review</h2>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="mb-2">
              <label className="mb-1 block text-base font-semibold text-muted-foreground">Reviewer</label>
              <input
                className={FORM_CONTROL_CLS}
                value={reviewModal.reviewer}
                onChange={(e) => setReviewModal((prev) => ({ ...prev, reviewer: e.target.value }))}
              />
            </div>
            <div className="mb-2">
              <label className="mb-1 block text-base font-semibold text-muted-foreground">Review Decision</label>
              <select
                className={FORM_CONTROL_CLS}
                value={reviewModal.nextDecision}
                onChange={(e) => setReviewModal((prev) => ({ ...prev, nextDecision: e.target.value }))}
              >
                <option value="review">In Review</option>
                <option value="pending_docs">Needs More Docs</option>
                <option value="approved">Accept</option>
                <option value="rejected">Reject</option>
              </select>
            </div>
          </div>

          <div className={`mb-3 ${reviewModal.nextDecision === 'approved' ? '' : 'opacity-60'}`}>
            <label className="mb-1 block text-base font-semibold text-muted-foreground">Assign Vehicle (if accepted)</label>
            <select
              className={FORM_CONTROL_CLS}
              value={reviewModal.assignedVehicleId}
              disabled={reviewModal.nextDecision !== 'approved'}
              onChange={(e) => setReviewModal((prev) => ({ ...prev, assignedVehicleId: e.target.value }))}
            >
              <option value="">Select Vehicle</option>
              {(vehiclesByProgram[(snapshot.apps || []).find((item) => item.id === reviewModal.appId)?.programId] || [])
                .filter((vehicle) => vehicle.status === 'available' || vehicle.id === reviewModal.assignedVehicleId)
                .map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.id} • {vehicle.plate} ({vehicle.status})
                  </option>
                ))}
            </select>
            {reviewModal.nextDecision !== 'approved' ? (
              <div className="mt-1 text-base text-muted-foreground">Vehicle assignment is enabled only for approved applications.</div>
            ) : null}
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-base font-semibold text-muted-foreground">Documents Viewer</label>
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge variant="warning">
                Missing Docs: {(reviewModal.documents || []).filter((item) => item.status === 'missing').length}
              </Badge>
              <Button variant="legacyPill" size="legacy" onClick={markAllMissing}>
                Mark Missing Docs
              </Button>
              <Button variant="legacyPill" size="legacy" onClick={markAllSubmitted}>
                Mark All Submitted
              </Button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table density="legacy">
              <TableHeader tone="legacy">
                <TableRow tone="legacy">
                  <TableHead>DOCUMENT</TableHead>
                  <TableHead>PREVIEW</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>REVIEW</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reviewModal.documents || []).map((document, idx) => (
                  <TableRow key={`${reviewModal.appId}-${document.id}`} tone="legacy">
                    <TableCell>{document.name}</TableCell>
                    <TableCell>
                      <img
                        src={document.img || buildDocPreviewSrc(document.name, document.status)}
                        alt={document.name}
                        title={`Open ${document.name}`}
                        className="h-11 w-16 cursor-pointer rounded-md border border-border object-cover"
                        onClick={() =>
                          setDocPreview({
                            open: true,
                            src: document.img || buildDocPreviewSrc(document.name, document.status),
                            title: document.name,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={document.status} />
                    </TableCell>
                    <TableCell>
                      <select
                        className={FORM_CONTROL_CLS}
                        value={document.status}
                        onChange={(e) =>
                          setReviewModal((prev) => ({
                            ...prev,
                            documents: (prev.documents || []).map((item, itemIdx) =>
                              itemIdx === idx ? { ...item, status: e.target.value } : item,
                            ),
                            requiredDocs:
                              e.target.value === 'missing' || e.target.value === 'rejected'
                                ? [...new Set([...(prev.requiredDocs || []), document.name])]
                                : (prev.requiredDocs || []).filter((name) => name !== document.name),
                          }))
                        }
                      >
                        <option value="submitted">Submitted</option>
                        <option value="review">Review</option>
                        <option value="missing">Missing</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>

          <div className="mb-3 rounded-lg border border-border bg-muted p-3">
            <div className="mb-1.5 text-base text-muted-foreground">Score Review (Legacy-style Manual Override)</div>
            <div className="mb-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
              <Badge variant="neutral" size="lg">Base: {selectedReviewApp?.score ?? '-'}</Badge>
              <Badge variant="success" size="lg">Docs: {(reviewModal.documents || []).filter((d) => d.status === 'submitted').length}</Badge>
              <Badge variant="warning" size="lg">Missing: {(reviewModal.documents || []).filter((d) => d.status === 'missing').length}</Badge>
              <Badge variant="primary" size="lg">
                Final: {clampScore(Number(selectedReviewApp?.score || 0) + Number(reviewModal.scoreAdjust || 0))}
              </Badge>
            </div>
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-[180px_minmax(0,1fr)]">
              <div>
                <label className="mb-1 block text-base font-semibold text-muted-foreground">Manual Score Adj.</label>
                <input
                  type="number"
                  className={FORM_CONTROL_CLS}
                  min={-30}
                  max={30}
                  value={reviewModal.scoreAdjust}
                  onChange={(e) => setReviewModal((prev) => ({ ...prev, scoreAdjust: Number(e.target.value || 0) }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-base font-semibold text-muted-foreground">Score Override Note</label>
                <input
                  className={FORM_CONTROL_CLS}
                  value={reviewModal.scoreNote}
                  onChange={(e) => setReviewModal((prev) => ({ ...prev, scoreNote: e.target.value }))}
                  placeholder="Reason for score adjustment."
                />
              </div>
            </div>
          </div>

          {reviewModal.nextDecision === 'rejected' && (
            <div className="mb-3">
              <label className="mb-1 block text-base font-semibold text-muted-foreground">Reject Reason</label>
              <textarea
                className={`${FORM_CONTROL_CLS} min-h-20`}
                value={reviewModal.rejectReason}
                onChange={(e) =>
                  setReviewModal((prev) => ({
                    ...prev,
                    rejectReason: e.target.value,
                    waTemplate: buildWATemplate(selectedReviewApp, prev.nextDecision, {
                      requiredDocs: prev.requiredDocs,
                      rejectReason: e.target.value,
                      reviewEtaDays: prev.reviewEtaDays,
                    }),
                  }))
                }
                placeholder="Reason why rejected and suggestion to re-apply."
              />
            </div>
          )}

          {reviewModal.nextDecision === 'pending_docs' && (
            <div className="mb-3">
              <label className="mb-1 block text-base font-semibold text-muted-foreground">Documents to Re-submit</label>
              <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-2">
                {(reviewModal.documents || []).map((document) => {
                  const checked = (reviewModal.requiredDocs || []).includes(document.name)
                  return (
                    <label key={`required-${document.id}`} className="flex items-center gap-2 text-base text-foreground">
                      <input
                        type="checkbox"
                        className={CHECKBOX_CLS}
                        checked={checked}
                        onChange={(e) =>
                          setReviewModal((prev) => {
                            const nextRequired = e.target.checked
                              ? [...new Set([...(prev.requiredDocs || []), document.name])]
                              : (prev.requiredDocs || []).filter((name) => name !== document.name)
                            return {
                              ...prev,
                              requiredDocs: nextRequired,
                              waTemplate: buildWATemplate(selectedReviewApp, prev.nextDecision, {
                                requiredDocs: nextRequired,
                                rejectReason: prev.rejectReason,
                                reviewEtaDays: prev.reviewEtaDays,
                              }),
                            }
                          })
                        }
                      />
                      {document.name}
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {reviewModal.nextDecision === 'review' && (
            <div className="mb-3">
              <label className="mb-1 block text-base font-semibold text-muted-foreground">Extra Review Time (days)</label>
              <input
                type="number"
                min={1}
                className={FORM_CONTROL_CLS}
                value={reviewModal.reviewEtaDays}
                onChange={(e) =>
                  setReviewModal((prev) => ({
                    ...prev,
                    reviewEtaDays: Number(e.target.value || 1),
                    waTemplate: buildWATemplate(selectedReviewApp, prev.nextDecision, {
                      requiredDocs: prev.requiredDocs,
                      rejectReason: prev.rejectReason,
                      reviewEtaDays: Number(e.target.value || 1),
                    }),
                  }))
                }
              />
            </div>
          )}

          <div className="mb-3">
            <label className="mb-1 block text-base font-semibold text-muted-foreground">WhatsApp Template Preview</label>
            <textarea
              className={`${FORM_CONTROL_CLS} min-h-[120px] font-mono`}
              value={reviewModal.waTemplate}
              onChange={(e) => setReviewModal((prev) => ({ ...prev, waTemplate: e.target.value }))}
            />
            {reviewApplicantPhone ? (
              <div className="mt-2">
                <Button
                  variant="legacyPill"
                  size="legacy"
                  asChild
                >
                  <a
                    href={`https://wa.me/${reviewApplicantPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(reviewModal.waTemplate || '')}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Contact via WhatsApp
                  </a>
                </Button>
              </div>
            ) : null}
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-base font-semibold text-muted-foreground">Review Notes / Acknowledgement</label>
            <textarea
              className={`${FORM_CONTROL_CLS} min-h-[90px]`}
              value={reviewModal.note}
              onChange={(e) => setReviewModal((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Acknowledge review process, findings, and required next steps."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="legacyGhost" size="legacy" onClick={() => setReviewModal((prev) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button variant="legacyPrimary" size="legacy" onClick={submitReview}>
              Save Review
            </Button>
          </div>
        </div>
      </div>

      <div className={`${docPreview.open ? 'flex' : 'hidden'} fixed inset-0 z-50 items-center justify-center bg-black/45 p-4`}>
        <div className="w-[95vw] max-w-5xl rounded-xl border border-border bg-background p-4 shadow-xl">
          <h2>Document Preview - {docPreview.title}</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-black">
            <img src={docPreview.src} alt={docPreview.title} style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
          </div>
          <div className="mt-3 flex justify-end">
            <Button variant="legacyGhost" size="legacy" onClick={() => setDocPreview({ open: false, src: '', title: '' })}>
              Close
            </Button>
          </div>
        </div>
      </div>

      <div className={`${scheduleModal.open ? 'flex' : 'hidden'} fixed inset-0 z-50 items-center justify-center bg-black/45 p-4`}>
        <div className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-xl border border-border bg-background p-4 shadow-xl">
          <h2>Schedule Pickup Confirmation</h2>

          <div className="mb-3 rounded-xl border border-border bg-background p-4 shadow-sm">
            <div className="mb-1.5 text-base font-extrabold text-foreground">
              ADMIN SCHEDULING ASSISTANT
            </div>
            <div className="mb-2 text-base text-muted-foreground">
              Help driver select pickup date & time.
            </div>
            <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-base font-semibold text-blue-800">
              Selected: {dateChipLabel(scheduleModal.date)} at {scheduleModal.time}
            </div>

            <div className="mb-1 text-base font-extrabold text-muted-foreground">PICKUP DATE</div>
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                className="rounded-md border border-input bg-background px-2 py-1 text-base font-semibold text-foreground hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={calendarCursor <= `${todayIso.slice(0, 7)}-01`}
                onClick={() => {
                  const date = new Date(`${calendarCursor}T00:00:00`)
                  date.setMonth(date.getMonth() - 1)
                  setCalendarCursor(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`)
                }}
              >
                ← Prev
              </button>
              <div className="flex items-center gap-1.5">
                <div className="text-base font-bold text-foreground">{monthLabel}</div>
                <button
                  type="button"
                  className="rounded-md border border-blue-300 bg-blue-50 px-2 py-1 text-base font-semibold text-blue-700 hover:bg-blue-100"
                  onClick={() => {
                    const todayAvailable = dateAvailability[todayIso]?.available
                    const fallbackTodayMonthDate =
                      dateChoices.find((date) => date.startsWith(todayIso.slice(0, 7)) && dateAvailability[date]?.available) ||
                      scheduleModal.date
                    setCalendarCursor(`${todayIso.slice(0, 7)}-01`)
                    setScheduleModal((prev) => ({ ...prev, date: todayAvailable ? todayIso : fallbackTodayMonthDate }))
                  }}
                >
                  Today
                </button>
                <button
                  type="button"
                  className="rounded-md border border-input bg-background px-2 py-1 text-base font-semibold text-foreground hover:border-blue-300 hover:bg-blue-50"
                  onClick={() => {
                    const date = new Date(`${calendarCursor}T00:00:00`)
                    date.setMonth(date.getMonth() + 1)
                    setCalendarCursor(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`)
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
            <div className="mb-1 grid grid-cols-7 gap-1 text-center text-base font-semibold uppercase tracking-wide text-muted-foreground">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={`day-${day}`}>{day}</div>
              ))}
            </div>
            <div className="mb-3 grid grid-cols-7 gap-1.5">
              {calendarCells.map((cell) => {
                if (cell.blank) return <div key={cell.key} />
                const date = cell.date
                const active = date === scheduleModal.date
                const isToday = date === todayIso
                const available = dateAvailability[date]?.available
                return (
                  <button
                    key={date}
                    type="button"
                    disabled={!available}
                    title={available ? dateChipLabel(date) : dateAvailability[date]?.reason || 'Unavailable'}
                    className={`relative h-10 rounded-md border text-center text-base font-semibold transition ${
                      active
                        ? 'border-blue-700 bg-blue-700 text-white ring-4 ring-blue-200 ring-offset-1 animate-pulse'
                        : isToday
                          ? 'border-blue-300 bg-blue-50 text-blue-700 hover:border-blue-400'
                          : 'border-input bg-background text-foreground hover:border-blue-300 hover:bg-blue-50'
                    } ${!available ? 'cursor-not-allowed border-border bg-muted text-slate-400 opacity-70' : ''}`}
                    onClick={() => {
                      if (!available) return
                      setScheduleModal((prev) => ({ ...prev, date }))
                    }}
                  >
                    {date.slice(-2)}
                    {active ? <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-background/90" /> : null}
                  </button>
                )
              })}
            </div>

            <div className="mb-1 text-base font-extrabold text-muted-foreground">AVAILABLE SLOTS</div>
            <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
              {timeSlots.map((slot) => {
                const active = slot === scheduleModal.time
                const isUnavailable = (slotLoadMap[`${scheduleModal.date}|${slot}`] || 0) >= 3
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isUnavailable}
                    title={isUnavailable ? 'Slot unavailable' : slot}
                    className={`h-10 rounded-md border text-base font-semibold transition ${
                      active
                        ? 'border-blue-700 bg-blue-700 text-white ring-2 ring-blue-200 ring-offset-1'
                        : 'border-input bg-background text-foreground hover:border-blue-300 hover:bg-blue-50'
                    } ${isUnavailable ? 'cursor-not-allowed border-border bg-muted text-slate-400 opacity-70' : ''}`}
                    onClick={() => {
                      if (isUnavailable) return
                      setScheduleModal((prev) => ({ ...prev, time: slot }))
                    }}
                  >
                    {slot}{isUnavailable ? ' (full)' : ''}
                  </button>
                )
              })}
            </div>
            <div className="mt-2 text-base text-muted-foreground">
              Greyed dates/slots are unavailable.{' '}
              {Array.isArray(scheduleProgram?.offDays) && scheduleProgram.offDays.length > 0 && (
                <>Weekly: {scheduleProgram.offDays.map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d] ?? '').join(', ')}. </>
              )}
              {Array.isArray(scheduleProgram?.holidayDates) && scheduleProgram.holidayDates.length > 0 && (
                <>Monthly: {scheduleProgram.holidayDates.sort((a, b) => a - b).join(', ')}. </>
              )}
              Fully booked slots are blocked.
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-base font-semibold text-muted-foreground">Pickup Location (by program)</label>
            <input
              className={FORM_CONTROL_CLS}
              value={scheduleModal.location}
              onChange={(e) => setScheduleModal((prev) => ({ ...prev, location: e.target.value }))}
            />
          </div>
          <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted p-3">
              <div className="mb-1 text-base font-semibold uppercase text-muted-foreground">Pickup PIC</div>
              <div className="text-base font-bold text-foreground">{schedulePic.name}</div>
              <div className="text-base text-muted-foreground">{schedulePic.phone}</div>
              <div className="mt-2 text-base text-muted-foreground">
                Program: {scheduleProgram?.name || '-'} ({scheduleProgram?.type || '-'})
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-border bg-muted">
              <iframe
                title="Pickup location map"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(scheduleModal.location || getProgramLocation(selectedScheduleApp?.programId || ''))}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                style={{ border: 0, width: '100%', height: 160 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-base font-semibold text-muted-foreground">Pickup Status</label>
            <select
              className={FORM_CONTROL_CLS}
              value={scheduleModal.status}
              onChange={(e) => setScheduleModal((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="planned">Planned</option>
              <option value="confirmed">Confirmed</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="legacyGhost" size="legacy" onClick={() => setScheduleModal((prev) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button
              variant="legacyPrimary"
              size="legacy"
              disabled={!dateAvailability[scheduleModal.date]?.available || (slotLoadMap[`${scheduleModal.date}|${scheduleModal.time}`] || 0) >= 3}
              onClick={submitSchedule}
            >
              Confirm Schedule: {scheduleModal.date} @ {scheduleModal.time}
            </Button>
          </div>
        </div>
      </div>

      <div className={`${handoverModal.open ? 'flex' : 'hidden'} fixed inset-0 z-50 items-center justify-center bg-black/45 p-4`}>
        <div className="max-h-[92vh] w-full max-w-xl overflow-auto rounded-xl border border-border bg-background p-4 shadow-xl">
          <h2 className="mb-1 text-base font-extrabold text-foreground">Complete Handover Checklist</h2>
          {handoverModal.error ? (
            <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-base font-semibold text-rose-700">
              {handoverModal.error}
            </div>
          ) : null}
          <div className="mb-3 text-base text-muted-foreground">
            App {selectedHandoverApp?.id || '-'} • {selectedHandoverApp?.userName || '-'} • Vehicle {selectedHandoverApp?.assignedVehicleId || '-'}
          </div>
          <div className="mb-3 rounded-lg border border-border bg-muted p-3">
            <div className="mb-1 text-base font-semibold uppercase text-muted-foreground">Assigned Vehicle Status</div>
            <div className="mb-2">
              <label className="mb-1 block text-base font-semibold text-muted-foreground">Assigned Vehicle (can be changed during process)</label>
              <select
                className={FORM_CONTROL_CLS}
                value={handoverModal.assignedVehicleId}
                onChange={(e) => setHandoverModal((prev) => ({ ...prev, assignedVehicleId: e.target.value, error: '' }))}
              >
                <option value="">Select assigned vehicle</option>
                {handoverVehicleOptions.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.id} • {vehicle.plate || '-'} • {String(vehicle.status || '-').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-base font-bold text-foreground">{selectedHandoverVehicle?.id || '-'}</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <StatusBadge status={selectedHandoverVehicle?.status || 'unknown'} />
              <Badge variant={selectedHandoverVehicle?.isOnline ? 'success' : 'neutral'}>
                {selectedHandoverVehicle?.isOnline ? 'ONLINE' : 'OFFLINE'}
              </Badge>
              <Badge variant={Number(selectedHandoverVehicle?.speed || 0) > 0 ? 'info' : 'neutral'}>
                {Number(selectedHandoverVehicle?.speed || 0) > 0 ? 'RUNNING' : 'STOPPED'}
              </Badge>
            </div>
          </div>
          <div className="space-y-2 rounded-lg border border-border bg-muted p-3">
            {[
              ['identityVerified', 'Identity verified on-site'],
              ['vehicleConditionChecked', 'Vehicle condition and accessories checked'],
              ['tireConditionChecked', 'Tire condition verified (front/back)'],
              ['keyHandoverChecked', 'Key handover confirmed (main/spare)'],
              ['stnkVerified', 'STNK document verified with plate/chassis'],
              ['contractAcknowledged', 'Contract and payment terms acknowledged'],
              ['appStatusUpdated', 'System status and evidence links updated'],
            ].map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center gap-2 rounded-md bg-background px-2 py-2 text-base text-foreground">
                <input
                  type="checkbox"
                  className={CHECKBOX_CLS}
                  checked={Boolean(handoverModal[key])}
                  onChange={(e) => setHandoverModal((prev) => ({ ...prev, [key]: e.target.checked, error: '' }))}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <div className="mt-3 rounded-lg border border-border bg-muted p-3">
            <div className="mb-2 text-base font-semibold uppercase text-muted-foreground">Handover Photo Upload</div>
            <div className="rounded-md border border-border bg-background p-2">
              <div className="mb-1 text-base font-semibold text-muted-foreground">Photo of handover</div>
              <input type="file" accept="image/*" onChange={(e) => onHandoverPhotoChange('handoverPhotoUrl', e)} />
              <div className="mt-1 text-base text-muted-foreground">
                {handoverModal.handoverPhotoUrl ? 'Photo attached' : 'No file uploaded'}
              </div>
              {handoverModal.handoverPhotoUrl ? (
                <div className="mt-2">
                  <img src={handoverModal.handoverPhotoUrl} alt="Handover proof" className="h-28 w-full rounded-md border border-border object-cover" />
                  <div className="mt-2 flex gap-2">
                    <label className="cursor-pointer">
                      <Button variant="legacyGhost" size="legacy" asChild>
                        <span>Replace Photo</span>
                      </Button>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => onHandoverPhotoChange('handoverPhotoUrl', e)} />
                    </label>
                    <Button
                      variant="legacyGhost"
                      size="legacy"
                      onClick={() => setHandoverModal((prev) => ({ ...prev, handoverPhotoUrl: '', error: '' }))}
                    >
                      Remove Photo
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-base font-semibold text-muted-foreground">Handover Notes</label>
            <textarea
              className={`${FORM_CONTROL_CLS} min-h-[90px]`}
              value={handoverModal.notes}
              onChange={(e) => setHandoverModal((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional note: condition summary, remarks, photo refs."
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="legacyGhost" size="legacy" onClick={() => setHandoverModal((prev) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button variant="legacyPrimary" size="legacy" onClick={submitHandover}>
              Complete Handover
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
