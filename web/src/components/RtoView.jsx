import { useEffect, useMemo, useState } from 'react'
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
import { Input } from './ui/input'
import { PageHeader, PageMeta, PageShell, PageTitle, StatCard, StatsGrid } from './ui/page'
import { Select } from './ui/select'

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
  if (decision === 'approved') return { tone: 'bg-emerald-100 text-emerald-700', label: 'ACCEPTED' }
  if (decision === 'rejected') return { tone: 'bg-rose-100 text-rose-700', label: 'REJECTED' }
  if (decision === 'review') return { tone: 'bg-amber-100 text-amber-700', label: 'REVIEW' }
  if (decision === 'pending_docs') return { tone: 'bg-orange-100 text-orange-700', label: 'NEEDS DOCS' }
  return { tone: 'bg-slate-100 text-slate-700', label: 'PENDING' }
}

function pickupStatusTone(status) {
  if (status === 'confirmed') return 'bg-emerald-100 text-emerald-700'
  if (status === 'rescheduled') return 'bg-cyan-100 text-cyan-700'
  if (status === 'planned') return 'bg-amber-100 text-amber-700'
  if (status === 'completed') return 'bg-indigo-100 text-indigo-700'
  if (status === 'no_show') return 'bg-rose-100 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}

function vehicleStateTone(status) {
  if (status === 'active') return 'bg-emerald-100 text-emerald-700'
  if (status === 'grace') return 'bg-amber-100 text-amber-700'
  if (status === 'immobilized') return 'bg-rose-100 text-rose-700'
  if (status === 'paused') return 'bg-cyan-100 text-cyan-700'
  if (status === 'available') return 'bg-slate-100 text-slate-700'
  return 'bg-slate-100 text-slate-700'
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
  return 'bg-slate-100 text-slate-700'
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
  const [appPage, setAppPage] = useState(initialUi.appPage || 1)
  const [pickupPage, setPickupPage] = useState(initialUi.pickupPage || 1)
  const pageSize = 10
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
    const result = {}
    for (const date of dateChoices) {
      const isPast = date < todayIso
      const isSunday = dayShort(date) === 'Sun'
      const hasOpenSlot = timeSlots.some((slot) => (slotLoadMap[`${date}|${slot}`] || 0) < 3)
      result[date] = {
        available: !isPast && !isSunday && hasOpenSlot,
        reason: isSunday ? 'Unavailable (Sunday)' : !hasOpenSlot ? 'Fully booked' : '',
      }
    }
    return result
  }, [dateChoices, slotLoadMap, timeSlots, todayIso])
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
    localStorage.setItem(
      UI_KEY,
      JSON.stringify({ tab, appFilter, appSearch, appPage: currentAppPage, pickupPage: currentPickupPage }),
    )
  }, [tab, appFilter, appSearch, currentAppPage, currentPickupPage])

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

  const formControlCls =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-indigo-200 focus:ring-2'
  const ghostBtnCls =
    'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100'
  const primaryBtnCls =
    'rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700'
  const pillCls =
    'inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100'
  const topTabBaseCls =
    'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300'
  const topTabIdleCls = 'border-slate-300 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
  const topTabActiveCls = 'border-indigo-600 bg-indigo-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.22)] hover:bg-indigo-700'

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
          <button
            key={item.key}
            className={`${topTabBaseCls} ${tab === item.key ? topTabActiveCls : topTabIdleCls}`}
            aria-pressed={tab === item.key}
            onClick={() => setTab(normalizeTab(item.key))}
          >
            {item.label}
          </button>
        ))}
      </div>
      {message ? <div className="mb-2 text-sm text-amber-700">{message}</div> : null}

      {tab === 'applications' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-sm font-semibold text-slate-700">Application Filters</div>
            <button className={ghostBtnCls} type="button" onClick={resetApplicationFilters}>
              Reset Filters
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Search</div>
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
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Decision</div>
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
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Score Band</div>
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
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Document Status</div>
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
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">SLA</div>
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
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Reviewer</div>
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
          </div>
          <div className="flex justify-end">
            <button className={primaryBtnCls} type="button" onClick={() => setCreateModal((prev) => ({ ...prev, open: true }))}>
              + Add Renter
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-[1220px] w-full border-collapse text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">APP</th>
                <th className="px-3 py-2 text-left">APPLICANT</th>
                <th className="px-3 py-2 text-left">PROGRAM</th>
                <th className="px-3 py-2 text-left">SCORE</th>
                <th className="px-3 py-2 text-left">DOCUMENT REVIEW</th>
                <th className="px-3 py-2 text-left">REVIEWER</th>
                <th className="px-3 py-2 text-left">LAST REVIEWED</th>
                <th className="px-3 py-2 text-left">ASSIGNED VEHICLE</th>
                <th className="px-3 py-2 text-left">PICKUP STATUS</th>
                <th className="px-3 py-2 text-left">DECISION</th>
                <th className="px-3 py-2 text-left">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {appRows.length > 0 ? (
                appRows.map((app) => (
                  <tr key={app.id} className="cursor-pointer border-t border-slate-100" onClick={() => setSelectedAppId(app.id)}>
                    <td className="px-3 py-2">
                      <div className="font-semibold">{app.id}</div>
                      <div className="text-xs text-slate-500">{formatSubmissionTime(app.createdAt || app.updatedAt)}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div>{app.userName || '-'}</div>
                      <div className="text-xs text-slate-500">{usersById.get(app.userId)?.phone || '-'}</div>
                    </td>
                    <td className="px-3 py-2">{app.programId}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex min-w-14 justify-center rounded-full px-2 py-1 text-xs font-bold ${scoreTone(app.score)}`}
                      >
                        {app.score}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(app.documents || []).slice(0, 3).map((document) => (
                          <img
                            key={`${app.id}-${document.id}`}
                            src={document.img || buildDocPreviewSrc(document.name, document.status)}
                            alt={document.name}
                            title={document.name}
                            className="h-7 w-7 rounded-md border border-slate-200 object-cover"
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
                        <span className={pillCls}>
                          {(app.documents || []).filter((d) => d.status === 'missing').length} missing
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {(app.reviewLog || []).length > 0 ? (app.reviewLog || []).slice().reverse()[0]?.by || 'Unassigned' : 'Unassigned'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {(app.reviewLog || []).length > 0
                        ? new Date((app.reviewLog || []).slice().reverse()[0]?.at).toLocaleString('id-ID')
                        : '-'}
                    </td>
                    <td className="px-3 py-2">
                      {app.assignedVehicleId ? (
                        (() => {
                          const v = vehiclesById.get(app.assignedVehicleId)
                          return (
                            <div className="text-xs">
                              <span className="inline-flex rounded-full bg-cyan-100 px-2 py-0.5 font-bold text-cyan-700">
                                {app.assignedVehicleId}
                              </span>
                              {v && (
                                <div className="mt-1 text-slate-600">
                                  <span>{v.brand || '-'} {v.model || '-'}</span>
                                  <span className="ml-1 font-mono text-slate-500">{v.plate || '-'}</span>
                                </div>
                              )}
                            </div>
                          )
                        })()
                      ) : (
                        <span className="text-xs text-slate-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${pickupStatusTone(app.pickupSchedule?.status || 'unscheduled')}`}>
                        {String(app.pickupSchedule?.status || 'unscheduled').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${decisionTone(app.decision).tone}`}
                      >
                        {decisionTone(app.decision).label}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          className={pillCls}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            openReview(app)
                          }}
                        >
                          Review
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="px-6 py-8 text-center text-sm text-slate-500">
                    No applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          {selectedApp && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500">Selected Application</div>
                  <div className="font-extrabold text-slate-900">{selectedApp.id} - {selectedApp.userName}</div>
                  <div className="text-sm text-slate-600">
                    Program: {selectedApp.programId} | Score:{' '}
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold ${scoreTone(selectedApp.score)}`}
                    >
                      {selectedApp.score}
                    </span>{' '}
                    | Status:{' '}
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold ${decisionTone(selectedApp.decision).tone}`}
                    >
                      {decisionTone(selectedApp.decision).label}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className={primaryBtnCls} type="button" onClick={() => openReview(selectedApp)}>
                    Review Application
                  </button>
                  <button
                    className={ghostBtnCls}
                    type="button"
                    disabled={selectedApp.decision !== 'approved'}
                    onClick={() => onSchedule(selectedApp.id)}
                  >
                    {selectedApp.pickupSchedule?.date ? 'Edit Pickup Slot' : 'Set Pickup Slot'}
                  </button>
                </div>
              </div>
              <div className="mt-2 text-sm text-slate-500">
                {selectedApp.decision === 'approved'
                  ? 'Application approved - pickup scheduling enabled.'
                  : 'Select review outcome first. Pickup scheduling is disabled until application is approved.'}
              </div>
              <div className="mt-2.5">
                <div className="mb-1.5 text-xs text-slate-500">Review Acknowledgement Trail</div>
                {(selectedApp.reviewLog || []).length > 0 ? (
                  (selectedApp.reviewLog || []).slice().reverse().slice(0, 5).map((item, idx) => (
                    <div key={`${selectedApp.id}-review-${idx}`} className="py-1 text-sm text-slate-600">
                      {new Date(item.at).toLocaleString('id-ID')} - {item.by} -{' '}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${decisionTone(item.decision).tone}`}
                      >
                        {decisionTone(item.decision).label}
                      </span>{' '}
                      {item.note ? `- ${item.note}` : ''}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No reviews yet.</div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600">
              Page {currentAppPage} / {appTotalPages} ({filteredApps.length} apps)
            </span>
            <div className="flex gap-2">
              <button
                className={ghostBtnCls}
                disabled={currentAppPage <= 1}
                onClick={() => setAppPage((p) => Math.max(1, Math.min(currentAppPage, p) - 1))}
              >
                Prev
              </button>
              <button
                className={ghostBtnCls}
                disabled={currentAppPage >= appTotalPages}
                onClick={() => setAppPage((p) => Math.min(appTotalPages, Math.min(currentAppPage, p) + 1))}
              >
                Next
              </button>
            </div>
          </div>
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
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-[900px] w-full border-collapse text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">APP</th>
                <th className="px-3 py-2 text-left">APPLICANT</th>
                <th className="px-3 py-2 text-left">VEHICLE</th>
                <th className="px-3 py-2 text-left">VEHICLE STATUS</th>
                <th className="px-3 py-2 text-left">DATE</th>
                <th className="px-3 py-2 text-left">TIME</th>
                <th className="px-3 py-2 text-left">LOCATION</th>
                <th className="px-3 py-2 text-left">STATUS</th>
                <th className="px-3 py-2 text-left">HANDOVER</th>
                <th className="px-3 py-2 text-left">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pickupRows.length > 0 ? (
                pickupRows.map((app) => (
                  <tr key={app.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{app.id}</td>
                    <td className="px-3 py-2">{app.userName}</td>
                    <td className="px-3 py-2">
                      {app.assignedVehicleId ? (
                        (() => {
                          const v = vehiclesById.get(app.assignedVehicleId)
                          return (
                            <div className="text-xs">
                              <div className="font-semibold text-slate-900">{app.assignedVehicleId}</div>
                              {v && (
                                <div className="text-slate-600">
                                  {v.brand || '-'} {v.model || '-'} • <span className="font-mono">{v.plate || '-'}</span>
                                </div>
                              )}
                            </div>
                          )
                        })()
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {(() => {
                        const assignedVehicle = vehicles.find((vehicle) => vehicle.id === app.assignedVehicleId)
                        const movement = Number(assignedVehicle?.speed || 0) > 0 ? 'RUNNING' : 'STOPPED'
                        return assignedVehicle ? (
                          <div className="flex flex-wrap gap-1.5">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${vehicleStateTone(assignedVehicle.status)}`}>
                              {String(assignedVehicle.status || '-').toUpperCase()}
                            </span>
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${assignedVehicle.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                              {assignedVehicle.isOnline ? 'ONLINE' : 'OFFLINE'}
                            </span>
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${movement === 'RUNNING' ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-700'}`}>
                              {movement}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )
                      })()}
                    </td>
                    <td className="px-3 py-2">{app.pickupSchedule?.date || (app.pickupDate ? new Date(app.pickupDate).toLocaleDateString('id-ID') : '-')}</td>
                    <td className="px-3 py-2">{app.pickupSchedule?.time || (app.pickupDate ? new Date(app.pickupDate).toISOString().slice(11, 16) : '-')}</td>
                    <td className="px-3 py-2">{app.pickupSchedule?.location || getProgramLocation(app.programId)}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${pickupStatusTone(app.pickupSchedule?.status || 'planned')}`}>
                        {String(app.pickupSchedule?.status || 'planned').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${
                          app.handoverCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {app.handoverCompleted ? 'CHECKLIST COMPLETE' : 'PENDING CHECKLIST'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1.5">
                        <button className={pillCls} type="button" onClick={() => onSchedule(app.id)}>
                          {app.pickupSchedule?.date ? 'Edit Slot' : 'Set Slot'}
                        </button>
                        <button className={pillCls} type="button" onClick={() => openHandover(app)}>
                          {app.handoverCompleted ? 'View Checklist' : 'Complete Handover'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-sm text-slate-500">
                    No pickups scheduled yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600">
              Page {currentPickupPage} / {pickupTotalPages} ({filteredPickup.length} pickups)
            </span>
            <div className="flex gap-2">
              <button
                className={ghostBtnCls}
                disabled={currentPickupPage <= 1}
                onClick={() => setPickupPage((p) => Math.max(1, Math.min(currentPickupPage, p) - 1))}
              >
                Prev
              </button>
              <button
                className={ghostBtnCls}
                disabled={currentPickupPage >= pickupTotalPages}
                onClick={() => setPickupPage((p) => Math.min(pickupTotalPages, Math.min(currentPickupPage, p) + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {(tab === 'score' || tab === 'wa') && (
        <>
          <p className="text-sm text-slate-600">
            This migration-safe RTO panel preserves legacy keys while writing a versioned payload.
          </p>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div>
              <h3 className="mb-1.5 text-sm text-slate-600">Score Config</h3>
              <textarea
                className={`${formControlCls} h-[280px] font-mono`}
                value={scoreJson}
                onChange={(e) => setScoreJson(e.target.value)}
              />
            </div>
            <div>
              <h3 className="mb-1.5 text-sm text-slate-600">WA Templates</h3>
              <textarea
                className={`${formControlCls} h-[280px] font-mono`}
                value={waJson}
                onChange={(e) => setWaJson(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button className={primaryBtnCls} onClick={save}>
              Save Compatibility Config
            </button>
            <span className="text-sm text-slate-600">{message}</span>
          </div>
        </>
      )}

      <div className={`${createModal.open ? 'flex' : 'hidden'} fixed inset-0 z-50 items-center justify-center bg-black/45 p-4`}>
        <div className="max-h-[92vh] w-full max-w-xl overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <h2>Add New Renter</h2>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-slate-600">Applicant Name</label>
            <input
              className={formControlCls}
              value={createModal.userName}
              onChange={(e) => setCreateModal((prev) => ({ ...prev, userName: e.target.value }))}
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-slate-600">Program / Scheme</label>
            <select
              className={formControlCls}
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
            <label className="mb-1 block text-sm font-semibold text-slate-600">Score</label>
            <input
              className={formControlCls}
              value={createModal.score}
              onChange={(e) => setCreateModal((prev) => ({ ...prev, score: e.target.value }))}
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-slate-600">Decision</label>
            <select
              className={formControlCls}
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
            <label className="mb-1 block text-sm font-semibold text-slate-600">Assigned Vehicle (optional)</label>
            <select
              className={formControlCls}
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
            <button className={ghostBtnCls} type="button" onClick={() => setCreateModal((prev) => ({ ...prev, open: false }))}>
              Cancel
            </button>
            <button className={primaryBtnCls} type="button" onClick={submitCreate}>
              Add Renter
            </button>
          </div>
        </div>
      </div>

      <div className={`${reviewModal.open ? 'flex' : 'hidden'} fixed inset-0 z-50 items-center justify-center bg-black/45 p-4`}>
        <div className="max-h-[92vh] w-[95vw] max-w-5xl overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <h2>Application Review</h2>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="mb-2">
              <label className="mb-1 block text-sm font-semibold text-slate-600">Reviewer</label>
              <input
                className={formControlCls}
                value={reviewModal.reviewer}
                onChange={(e) => setReviewModal((prev) => ({ ...prev, reviewer: e.target.value }))}
              />
            </div>
            <div className="mb-2">
              <label className="mb-1 block text-sm font-semibold text-slate-600">Review Decision</label>
              <select
                className={formControlCls}
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
            <label className="mb-1 block text-sm font-semibold text-slate-600">Assign Vehicle (if accepted)</label>
            <select
              className={formControlCls}
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
              <div className="mt-1 text-xs text-slate-500">Vehicle assignment is enabled only for approved applications.</div>
            ) : null}
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-slate-600">Documents Viewer</label>
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                Missing Docs: {(reviewModal.documents || []).filter((item) => item.status === 'missing').length}
              </span>
              <button className={pillCls} type="button" onClick={markAllMissing}>
                Mark Missing Docs
              </button>
              <button className={pillCls} type="button" onClick={markAllSubmitted}>
                Mark All Submitted
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-[740px] w-full border-collapse text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">DOCUMENT</th>
                  <th className="px-3 py-2 text-left">PREVIEW</th>
                  <th className="px-3 py-2 text-left">STATUS</th>
                  <th className="px-3 py-2 text-left">REVIEW</th>
                </tr>
              </thead>
              <tbody>
                {(reviewModal.documents || []).map((document, idx) => (
                  <tr key={`${reviewModal.appId}-${document.id}`} className="border-t border-slate-100">
                    <td className="px-3 py-2">{document.name}</td>
                    <td className="px-3 py-2">
                      <img
                        src={document.img || buildDocPreviewSrc(document.name, document.status)}
                        alt={document.name}
                        title={`Open ${document.name}`}
                        className="h-11 w-16 cursor-pointer rounded-md border border-slate-200 object-cover"
                        onClick={() =>
                          setDocPreview({
                            open: true,
                            src: document.img || buildDocPreviewSrc(document.name, document.status),
                            title: document.name,
                          })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${docTone(document.status)}`}
                      >
                        {document.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className={formControlCls}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-1.5 text-xs text-slate-500">Score Review (Legacy-style Manual Override)</div>
            <div className="mb-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
              <div className={pillCls}>Base: {selectedReviewApp?.score ?? '-'}</div>
              <div className={pillCls}>Docs: {(reviewModal.documents || []).filter((d) => d.status === 'submitted').length}</div>
              <div className={pillCls}>Missing: {(reviewModal.documents || []).filter((d) => d.status === 'missing').length}</div>
              <div className={pillCls}>
                Final: {clampScore(Number(selectedReviewApp?.score || 0) + Number(reviewModal.scoreAdjust || 0))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-[180px_minmax(0,1fr)]">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-600">Manual Score Adj.</label>
                <input
                  type="number"
                  className={formControlCls}
                  min={-30}
                  max={30}
                  value={reviewModal.scoreAdjust}
                  onChange={(e) => setReviewModal((prev) => ({ ...prev, scoreAdjust: Number(e.target.value || 0) }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-600">Score Override Note</label>
                <input
                  className={formControlCls}
                  value={reviewModal.scoreNote}
                  onChange={(e) => setReviewModal((prev) => ({ ...prev, scoreNote: e.target.value }))}
                  placeholder="Reason for score adjustment."
                />
              </div>
            </div>
          </div>

          {reviewModal.nextDecision === 'rejected' && (
            <div className="mb-3">
              <label className="mb-1 block text-sm font-semibold text-slate-600">Reject Reason</label>
              <textarea
                className={`${formControlCls} min-h-20`}
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
              <label className="mb-1 block text-sm font-semibold text-slate-600">Documents to Re-submit</label>
              <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-2">
                {(reviewModal.documents || []).map((document) => {
                  const checked = (reviewModal.requiredDocs || []).includes(document.name)
                  return (
                    <label key={`required-${document.id}`} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
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
              <label className="mb-1 block text-sm font-semibold text-slate-600">Extra Review Time (days)</label>
              <input
                type="number"
                min={1}
                className={formControlCls}
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
            <label className="mb-1 block text-sm font-semibold text-slate-600">WhatsApp Template Preview</label>
            <textarea
              className={`${formControlCls} min-h-[120px] font-mono`}
              value={reviewModal.waTemplate}
              onChange={(e) => setReviewModal((prev) => ({ ...prev, waTemplate: e.target.value }))}
            />
            {reviewApplicantPhone ? (
              <div className="mt-2">
                <a
                  className={pillCls}
                  href={`https://wa.me/${reviewApplicantPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(reviewModal.waTemplate || '')}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Contact via WhatsApp
                </a>
              </div>
            ) : null}
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-semibold text-slate-600">Review Notes / Acknowledgement</label>
            <textarea
              className={`${formControlCls} min-h-[90px]`}
              value={reviewModal.note}
              onChange={(e) => setReviewModal((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Acknowledge review process, findings, and required next steps."
            />
          </div>

          <div className="flex justify-end gap-2">
            <button className={ghostBtnCls} type="button" onClick={() => setReviewModal((prev) => ({ ...prev, open: false }))}>
              Cancel
            </button>
            <button className={primaryBtnCls} type="button" onClick={submitReview}>
              Save Review
            </button>
          </div>
        </div>
      </div>

      <div className={`${docPreview.open ? 'flex' : 'hidden'} fixed inset-0 z-50 items-center justify-center bg-black/45 p-4`}>
        <div className="w-[95vw] max-w-5xl rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <h2>Document Preview - {docPreview.title}</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-black">
            <img src={docPreview.src} alt={docPreview.title} style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
          </div>
          <div className="mt-3 flex justify-end">
            <button className={ghostBtnCls} type="button" onClick={() => setDocPreview({ open: false, src: '', title: '' })}>
              Close
            </button>
          </div>
        </div>
      </div>

      <div className={`${scheduleModal.open ? 'flex' : 'hidden'} fixed inset-0 z-50 items-center justify-center bg-black/45 p-4`}>
        <div className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <h2>Schedule Pickup Confirmation</h2>

          <div className="mb-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-1.5 text-sm font-extrabold text-slate-700">
              ADMIN SCHEDULING ASSISTANT
            </div>
            <div className="mb-2 text-sm text-slate-600">
              Help driver select pickup date & time.
            </div>
            <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">
              Selected: {dateChipLabel(scheduleModal.date)} at {scheduleModal.time}
            </div>

            <div className="mb-1 text-xs font-extrabold text-slate-500">PICKUP DATE</div>
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                <div className="text-sm font-bold text-slate-700">{monthLabel}</div>
                <button
                  type="button"
                  className="rounded-md border border-blue-300 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
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
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50"
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
            <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
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
                    className={`relative h-10 rounded-md border text-center text-sm font-semibold transition ${
                      active
                        ? 'border-blue-700 bg-blue-700 text-white ring-4 ring-blue-200 ring-offset-1 animate-pulse'
                        : isToday
                          ? 'border-blue-300 bg-blue-50 text-blue-700 hover:border-blue-400'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                    } ${!available ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-70' : ''}`}
                    onClick={() => {
                      if (!available) return
                      setScheduleModal((prev) => ({ ...prev, date }))
                    }}
                  >
                    {date.slice(-2)}
                    {active ? <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/90" /> : null}
                  </button>
                )
              })}
            </div>

            <div className="mb-1 text-xs font-extrabold text-slate-500">AVAILABLE SLOTS</div>
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
                    className={`h-10 rounded-md border text-sm font-semibold transition ${
                      active
                        ? 'border-blue-700 bg-blue-700 text-white ring-2 ring-blue-200 ring-offset-1'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                    } ${isUnavailable ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-70' : ''}`}
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
            <div className="mt-2 text-xs text-slate-500">
              Greyed dates/slots are unavailable. Sundays and fully booked slots are blocked.
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-semibold text-slate-600">Pickup Location (by program)</label>
            <input
              className={formControlCls}
              value={scheduleModal.location}
              onChange={(e) => setScheduleModal((prev) => ({ ...prev, location: e.target.value }))}
            />
          </div>
          <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-1 text-xs font-semibold uppercase text-slate-500">Pickup PIC</div>
              <div className="text-sm font-bold text-slate-900">{schedulePic.name}</div>
              <div className="text-sm text-slate-600">{schedulePic.phone}</div>
              <div className="mt-2 text-xs text-slate-500">
                Program: {scheduleProgram?.name || '-'} ({scheduleProgram?.type || '-'})
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
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
            <label className="mb-1 block text-sm font-semibold text-slate-600">Pickup Status</label>
            <select
              className={formControlCls}
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
            <button className={ghostBtnCls} type="button" onClick={() => setScheduleModal((prev) => ({ ...prev, open: false }))}>
              Cancel
            </button>
            <button
              className={primaryBtnCls}
              type="button"
              disabled={!dateAvailability[scheduleModal.date]?.available || (slotLoadMap[`${scheduleModal.date}|${scheduleModal.time}`] || 0) >= 3}
              onClick={submitSchedule}
            >
              Confirm Schedule: {scheduleModal.date} @ {scheduleModal.time}
            </button>
          </div>
        </div>
      </div>

      <div className={`${handoverModal.open ? 'flex' : 'hidden'} fixed inset-0 z-50 items-center justify-center bg-black/45 p-4`}>
        <div className="max-h-[92vh] w-full max-w-xl overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <h2 className="mb-1 text-lg font-extrabold text-slate-900">Complete Handover Checklist</h2>
          {handoverModal.error ? (
            <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {handoverModal.error}
            </div>
          ) : null}
          <div className="mb-3 text-sm text-slate-600">
            App {selectedHandoverApp?.id || '-'} • {selectedHandoverApp?.userName || '-'} • Vehicle {selectedHandoverApp?.assignedVehicleId || '-'}
          </div>
          <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-1 text-xs font-semibold uppercase text-slate-500">Assigned Vehicle Status</div>
            <div className="mb-2">
              <label className="mb-1 block text-xs font-semibold text-slate-500">Assigned Vehicle (can be changed during process)</label>
              <select
                className={formControlCls}
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
            <div className="text-sm font-bold text-slate-900">{selectedHandoverVehicle?.id || '-'}</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${vehicleStateTone(selectedHandoverVehicle?.status)}`}>
                {String(selectedHandoverVehicle?.status || 'unknown').toUpperCase()}
              </span>
              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${selectedHandoverVehicle?.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                {selectedHandoverVehicle?.isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${Number(selectedHandoverVehicle?.speed || 0) > 0 ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-700'}`}>
                {Number(selectedHandoverVehicle?.speed || 0) > 0 ? 'RUNNING' : 'STOPPED'}
              </span>
            </div>
          </div>
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            {[
              ['identityVerified', 'Identity verified on-site'],
              ['vehicleConditionChecked', 'Vehicle condition and accessories checked'],
              ['tireConditionChecked', 'Tire condition verified (front/back)'],
              ['keyHandoverChecked', 'Key handover confirmed (main/spare)'],
              ['stnkVerified', 'STNK document verified with plate/chassis'],
              ['contractAcknowledged', 'Contract and payment terms acknowledged'],
              ['appStatusUpdated', 'System status and evidence links updated'],
            ].map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center gap-2 rounded-md bg-white px-2 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(handoverModal[key])}
                  onChange={(e) => setHandoverModal((prev) => ({ ...prev, [key]: e.target.checked, error: '' }))}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Handover Photo Upload</div>
            <div className="rounded-md border border-slate-200 bg-white p-2">
              <div className="mb-1 text-xs font-semibold text-slate-600">Photo of handover</div>
              <input type="file" accept="image/*" onChange={(e) => onHandoverPhotoChange('handoverPhotoUrl', e)} />
              <div className="mt-1 text-[11px] text-slate-500">
                {handoverModal.handoverPhotoUrl ? 'Photo attached' : 'No file uploaded'}
              </div>
              {handoverModal.handoverPhotoUrl ? (
                <div className="mt-2">
                  <img src={handoverModal.handoverPhotoUrl} alt="Handover proof" className="h-28 w-full rounded-md border border-slate-200 object-cover" />
                  <div className="mt-2 flex gap-2">
                    <label className={`${ghostBtnCls} cursor-pointer`}>
                      Replace Photo
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => onHandoverPhotoChange('handoverPhotoUrl', e)} />
                    </label>
                    <button
                      className={ghostBtnCls}
                      type="button"
                      onClick={() => setHandoverModal((prev) => ({ ...prev, handoverPhotoUrl: '', error: '' }))}
                    >
                      Remove Photo
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-sm font-semibold text-slate-600">Handover Notes</label>
            <textarea
              className={`${formControlCls} min-h-[90px]`}
              value={handoverModal.notes}
              onChange={(e) => setHandoverModal((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional note: condition summary, remarks, photo refs."
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button className={ghostBtnCls} type="button" onClick={() => setHandoverModal((prev) => ({ ...prev, open: false }))}>
              Cancel
            </button>
            <button className={primaryBtnCls} type="button" onClick={submitHandover}>
              Complete Handover
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
