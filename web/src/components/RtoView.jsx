import { useEffect, useMemo, useState } from 'react'
import {
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

const UI_KEY = 'casan_rto_ui'
const DEFAULT_PICKUP_BY_PARTNER = {
  tangkas: 'Tangkas Hub - Kemayoran',
  maka: 'Maka Center - Tebet',
  united: 'United Point - Bekasi Barat',
}

function decisionTone(decision) {
  if (decision === 'approved') return { bg: 'var(--dg1)', color: 'var(--dg)', label: 'ACCEPTED' }
  if (decision === 'declined') return { bg: 'var(--dd1)', color: 'var(--dd)', label: 'REJECTED' }
  if (decision === 'review') return { bg: 'var(--dw1)', color: 'var(--dw)', label: 'REVIEW' }
  if (decision === 'pending_docs') return { bg: 'rgba(251,146,60,0.18)', color: '#FB923C', label: 'NEEDS DOCS' }
  return { bg: 'var(--s3)', color: 'var(--t2)', label: 'PENDING' }
}

function scoreTone(score) {
  const value = Number(score || 0)
  if (value >= 80) return { bg: 'var(--dg1)', color: 'var(--dg)' }
  if (value >= 60) return { bg: 'var(--dac1)', color: 'var(--dac)' }
  if (value >= 41) return { bg: 'var(--dw1)', color: 'var(--dw)' }
  if (value >= 21) return { bg: 'rgba(251,146,60,0.18)', color: '#FB923C' }
  return { bg: 'var(--dd1)', color: 'var(--dd)' }
}

function docTone(status) {
  if (status === 'submitted') return { bg: 'var(--dg1)', color: 'var(--dg)' }
  if (status === 'review') return { bg: 'var(--dw1)', color: 'var(--dw)' }
  if (status === 'missing') return { bg: 'rgba(251,146,60,0.18)', color: '#FB923C' }
  if (status === 'rejected') return { bg: 'var(--dd1)', color: 'var(--dd)' }
  return { bg: 'var(--s3)', color: 'var(--t2)' }
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
  if (decision === 'declined') {
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
  const [tab, setTab] = useState(initialUi.tab || 'applications')
  const [scoreJson, setScoreJson] = useState(JSON.stringify(snapshot.scoreCfg || {}, null, 2))
  const [waJson, setWaJson] = useState(JSON.stringify(snapshot.waCfg || {}, null, 2))
  const [appFilter, setAppFilter] = useState(initialUi.appFilter || 'all')
  const [appSearch, setAppSearch] = useState(initialUi.appSearch || '')
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
  })
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
  }, [snapshot.apps, appFilter, appSearch])
  const pickup = snapshot.pickup || []
  const appTotalPages = Math.max(1, Math.ceil(filteredApps.length / pageSize))
  const pickupTotalPages = Math.max(1, Math.ceil(pickup.length / pageSize))
  const currentAppPage = Math.min(appPage, appTotalPages)
  const currentPickupPage = Math.min(pickupPage, pickupTotalPages)
  const appRows = filteredApps.slice((currentAppPage - 1) * pageSize, currentAppPage * pageSize)
  const pickupRows = pickup.slice((currentPickupPage - 1) * pageSize, currentPickupPage * pageSize)
  const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']
  const dateChoices = useMemo(() => {
    const base = scheduleModal.date || new Date().toISOString().slice(0, 10)
    return Array.from({ length: 10 }, (_, idx) => plusDaysISO(base, idx))
  }, [scheduleModal.date])

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

  const getProgramLocation = (programId) => {
    const program = programs.find((item) => item.id === programId)
    return DEFAULT_PICKUP_BY_PARTNER[program?.partnerId] || 'Program Pickup Point'
  }

  const openReview = (app) => {
    const docs = Array.isArray(app.documents) ? app.documents : []
    const requiredDocs = docs.filter((d) => d.status === 'missing' || d.status === 'rejected').map((d) => d.name)
    const nextDecision = app.decision === 'approved' ? 'approved' : app.decision === 'declined' ? 'declined' : 'review'
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
    if (reviewModal.nextDecision === 'approved' && !reviewModal.assignedVehicleId) {
      setMessage('Assign vehicle is required before approving application.')
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
      reviewEntry: {
        at: new Date().toISOString(),
        by: reviewModal.reviewer || 'Ops Reviewer',
        decision: reviewModal.nextDecision,
        note: finalNote,
      },
    })
    setReviewModal((prev) => ({ ...prev, open: false }))
    setSelectedAppId(reviewApp.id)
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
  const setReviewDecision = (nextDecision) => {
    setReviewModal((prev) => ({
      ...prev,
      nextDecision,
      waTemplate: buildWATemplate(selectedReviewApp, nextDecision, {
        requiredDocs: prev.requiredDocs,
        rejectReason: prev.rejectReason,
        reviewEtaDays: prev.reviewEtaDays,
      }),
    }))
  }

  const onSchedule = (id) => {
    const app = (snapshot.apps || []).find((item) => item.id === id)
    if (!app || app.decision !== 'approved') {
      setMessage('Pickup can only be scheduled for approved applications.')
      return
    }
    const schedule = app?.pickupSchedule || {}
    setScheduleModal({
      open: true,
      id,
      date: schedule.date || new Date().toISOString().slice(0, 10),
      time: schedule.time || '10:00',
      location: schedule.location || getProgramLocation(app?.programId),
    })
  }

  const submitCreate = () => {
    if (!createModal.userName.trim()) return
    createRtoApplication({
      userName: createModal.userName.trim(),
      programId: createModal.programId || '',
      score: Number(createModal.score || 0),
      decision: createModal.decision,
      assignedVehicleId: createModal.assignedVehicleId || null,
      pickupDate:
        createModal.decision === 'approved' ? new Date(`${new Date().toISOString().slice(0, 10)}T08:00:00`).toISOString() : null,
    })
    setCreateModal((prev) => ({ ...prev, open: false, userName: '', score: '65', assignedVehicleId: '' }))
  }

  const submitSchedule = () => {
    if (!scheduleModal.id || !scheduleModal.date || !scheduleModal.time) return
    scheduleRtoPickup(scheduleModal.id, {
      date: scheduleModal.date,
      time: scheduleModal.time,
      location: scheduleModal.location || 'Program Pickup Point',
    })
    setScheduleModal((prev) => ({ ...prev, open: false }))
  }

  return (
    <section className="vl-container">
      <div className="vl-header">
        <h2 className="vl-title">Application Operations</h2>
        <div className="vl-count">{snapshot.apps?.length || 0} Applications</div>
      </div>

      <div className="vl-filter-pills" style={{ marginBottom: 8 }}>
        {['applications', 'pickup', 'score', 'wa'].map((key) => (
          <button
            key={key}
            className={`vl-pill ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            {key}
          </button>
        ))}
      </div>
      {message ? <div style={{ marginBottom: 8, fontSize: 'var(--text-sm)', color: 'var(--dw)' }}>{message}</div> : null}

      {tab === 'applications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="vl-controls" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
            <input
              className="vl-search"
              placeholder="Search app, applicant, program..."
              value={appSearch}
              onChange={(e) => {
                setAppSearch(e.target.value)
                setAppPage(1)
              }}
            />
            <select
              className="form-control"
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
              <option value="declined">Declined</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" type="button" onClick={() => setCreateModal((prev) => ({ ...prev, open: true }))}>
              + Add Renter
            </button>
          </div>
          <table className="vl-table">
            <thead>
              <tr>
                <th>APP</th>
                <th>APPLICANT</th>
                <th>PROGRAM</th>
                <th>SCORE</th>
                <th>DOCUMENT REVIEW</th>
                <th>DECISION</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {appRows.length > 0 ? (
                appRows.map((app) => (
                  <tr key={app.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedAppId(app.id)}>
                    <td>{app.id}</td>
                    <td>{app.userName}</td>
                    <td>{app.programId}</td>
                    <td>
                      <span
                        className="vl-status"
                        style={{
                          background: scoreTone(app.score).bg,
                          color: scoreTone(app.score).color,
                          minWidth: 56,
                          display: 'inline-flex',
                          justifyContent: 'center',
                        }}
                      >
                        {app.score}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {(app.documents || []).slice(0, 3).map((document) => (
                          <img
                            key={`${app.id}-${document.id}`}
                            src={document.img || buildDocPreviewSrc(document.name, document.status)}
                            alt={document.name}
                            title={document.name}
                            style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--b1)', objectFit: 'cover' }}
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
                        <span className="vl-pill">
                          {(app.documents || []).filter((d) => d.status === 'missing').length} missing
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className="vl-status"
                        style={{
                          textTransform: 'uppercase',
                          background: decisionTone(app.decision).bg,
                          color: decisionTone(app.decision).color,
                        }}
                      >
                        {decisionTone(app.decision).label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="vl-pill"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            openReview(app)
                          }}
                        >
                          Open Review
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--t3)' }}>
                    No applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {selectedApp && (
            <div className="card" style={{ padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>Selected Application</div>
                  <div style={{ fontWeight: 800 }}>{selectedApp.id} - {selectedApp.userName}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t2)' }}>
                    Program: {selectedApp.programId} | Score:{' '}
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: scoreTone(selectedApp.score).bg,
                        color: scoreTone(selectedApp.score).color,
                        fontWeight: 700,
                      }}
                    >
                      {selectedApp.score}
                    </span>{' '}
                    | Status:{' '}
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: decisionTone(selectedApp.decision).bg,
                        color: decisionTone(selectedApp.decision).color,
                        fontWeight: 700,
                      }}
                    >
                      {decisionTone(selectedApp.decision).label}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary" type="button" onClick={() => openReview(selectedApp)}>
                    Document Review
                  </button>
                  <button
                    className="btn btn-primary"
                    type="button"
                    disabled={selectedApp.decision !== 'approved'}
                    onClick={() => onSchedule(selectedApp.id)}
                  >
                    Schedule Pickup
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={() => openReview(selectedApp)}>
                    Assign Vehicle
                  </button>
                </div>
              </div>
              <div style={{ marginTop: 8, fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>
                {selectedApp.decision === 'approved'
                  ? 'Application approved - pickup scheduling enabled.'
                  : 'Select review outcome first. Pickup scheduling is disabled until application is approved.'}
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)', marginBottom: 6 }}>Review Acknowledgement Trail</div>
                {(selectedApp.reviewLog || []).length > 0 ? (
                  (selectedApp.reviewLog || []).slice().reverse().slice(0, 5).map((item, idx) => (
                    <div key={`${selectedApp.id}-review-${idx}`} style={{ fontSize: 'var(--text-sm)', color: 'var(--t2)', padding: '4px 0' }}>
                      {new Date(item.at).toLocaleString('id-ID')} - {item.by} -{' '}
                      <span
                        style={{
                          padding: '1px 6px',
                          borderRadius: 6,
                          background: decisionTone(item.decision).bg,
                          color: decisionTone(item.decision).color,
                          fontWeight: 700,
                        }}
                      >
                        {decisionTone(item.decision).label}
                      </span>{' '}
                      {item.note ? `- ${item.note}` : ''}
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>No reviews yet.</div>
                )}
              </div>
            </div>
          )}

          <div className="vl-pagination">
            <span className="vl-page-info">
              Page {currentAppPage} / {appTotalPages} ({filteredApps.length} apps)
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="vl-page-btn"
                disabled={currentAppPage <= 1}
                onClick={() => setAppPage((p) => Math.max(1, Math.min(currentAppPage, p) - 1))}
              >
                Prev
              </button>
              <button
                className="vl-page-btn"
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <table className="vl-table">
            <thead>
              <tr>
                <th>APP</th>
                <th>APPLICANT</th>
                <th>VEHICLE</th>
                <th>DATE</th>
                <th>TIME</th>
                <th>LOCATION</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pickupRows.length > 0 ? (
                pickupRows.map((app) => (
                  <tr key={app.id}>
                    <td>{app.id}</td>
                    <td>{app.userName}</td>
                    <td>{app.assignedVehicleId || '-'}</td>
                    <td>{app.pickupSchedule?.date || (app.pickupDate ? new Date(app.pickupDate).toLocaleDateString('id-ID') : '-')}</td>
                    <td>{app.pickupSchedule?.time || (app.pickupDate ? new Date(app.pickupDate).toISOString().slice(11, 16) : '-')}</td>
                    <td>{app.pickupSchedule?.location || getProgramLocation(app.programId)}</td>
                    <td>
                      <button className="vl-pill" type="button" onClick={() => onSchedule(app.id)}>
                        Confirm Slot
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--t3)' }}>
                    No pickups scheduled yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="vl-pagination">
            <span className="vl-page-info">
              Page {currentPickupPage} / {pickupTotalPages} ({pickup.length} pickups)
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="vl-page-btn"
                disabled={currentPickupPage <= 1}
                onClick={() => setPickupPage((p) => Math.max(1, Math.min(currentPickupPage, p) - 1))}
              >
                Prev
              </button>
              <button
                className="vl-page-btn"
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
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--t2)' }}>
            This migration-safe RTO panel preserves legacy keys while writing a versioned payload.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--t2)', marginBottom: 6 }}>Score Config</h3>
              <textarea
                className="form-control"
                style={{ height: 280, fontFamily: 'var(--font-mono)' }}
                value={scoreJson}
                onChange={(e) => setScoreJson(e.target.value)}
              />
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--t2)', marginBottom: 6 }}>WA Templates</h3>
              <textarea
                className="form-control"
                style={{ height: 280, fontFamily: 'var(--font-mono)' }}
                value={waJson}
                onChange={(e) => setWaJson(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="btn btn-primary"
              onClick={save}
            >
              Save Compatibility Config
            </button>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--t2)' }}>{message}</span>
          </div>
        </>
      )}

      <div className={`modal-overlay ${createModal.open ? 'active' : ''}`}>
        <div className="modal">
          <h2>Add New Renter</h2>
          <div className="form-group">
            <label>Applicant Name</label>
            <input
              className="form-control"
              value={createModal.userName}
              onChange={(e) => setCreateModal((prev) => ({ ...prev, userName: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Program / Scheme</label>
            <select
              className="form-control"
              value={createModal.programId}
              onChange={(e) => setCreateModal((prev) => ({ ...prev, programId: e.target.value }))}
            >
              <option value="">Select Program</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name} ({program.id})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Score</label>
            <input
              className="form-control"
              value={createModal.score}
              onChange={(e) => setCreateModal((prev) => ({ ...prev, score: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Decision</label>
            <select
              className="form-control"
              value={createModal.decision}
              onChange={(e) => setCreateModal((prev) => ({ ...prev, decision: e.target.value }))}
            >
              <option value="pending">Pending</option>
              <option value="review">Review</option>
              <option value="pending_docs">Needs Docs</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
            </select>
          </div>
          <div className="form-group">
            <label>Assigned Vehicle (optional)</label>
            <select
              className="form-control"
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
          <div className="modal-actions">
            <button className="btn btn-secondary" type="button" onClick={() => setCreateModal((prev) => ({ ...prev, open: false }))}>
              Cancel
            </button>
            <button className="btn btn-primary" type="button" onClick={submitCreate}>
              Add Renter
            </button>
          </div>
        </div>
      </div>

      <div className={`modal-overlay ${reviewModal.open ? 'active' : ''}`}>
        <div className="modal" style={{ maxWidth: 900, width: '95vw' }}>
          <h2>Application Review</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Reviewer</label>
              <input
                className="form-control"
                value={reviewModal.reviewer}
                onChange={(e) => setReviewModal((prev) => ({ ...prev, reviewer: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Review Decision</label>
              <select
                className="form-control"
                value={reviewModal.nextDecision}
                onChange={(e) => setReviewModal((prev) => ({ ...prev, nextDecision: e.target.value }))}
              >
                <option value="review">In Review</option>
                <option value="pending_docs">Needs More Docs</option>
                <option value="approved">Accept</option>
                <option value="declined">Reject</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Assign Vehicle (if accepted)</label>
            <select
              className="form-control"
              value={reviewModal.assignedVehicleId}
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
          </div>

          <div className="form-group">
            <label>Documents Viewer</label>
            <div style={{ marginBottom: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="vl-pill" style={{ background: 'var(--dw1)', color: 'var(--dw)' }}>
                Missing Docs: {(reviewModal.documents || []).filter((item) => item.status === 'missing').length}
              </span>
              <button className="vl-pill" type="button" onClick={markAllMissing}>
                Mark Missing Docs
              </button>
              <button className="vl-pill" type="button" onClick={markAllSubmitted}>
                Mark All Submitted
              </button>
            </div>
            <table className="vl-table">
              <thead>
                <tr>
                  <th>DOCUMENT</th>
                  <th>PREVIEW</th>
                  <th>STATUS</th>
                  <th>REVIEW</th>
                </tr>
              </thead>
              <tbody>
                {(reviewModal.documents || []).map((document, idx) => (
                  <tr key={`${reviewModal.appId}-${document.id}`}>
                    <td>{document.name}</td>
                    <td>
                      <img
                        src={document.img || buildDocPreviewSrc(document.name, document.status)}
                        alt={document.name}
                        title={`Open ${document.name}`}
                        style={{ width: 66, height: 44, borderRadius: 6, border: '1px solid var(--b1)', objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() =>
                          setDocPreview({
                            open: true,
                            src: document.img || buildDocPreviewSrc(document.name, document.status),
                            title: document.name,
                          })
                        }
                      />
                    </td>
                    <td>
                      <span
                        className="vl-status"
                        style={{
                          textTransform: 'uppercase',
                          background: docTone(document.status).bg,
                          color: docTone(document.status).color,
                        }}
                      >
                        {document.status}
                      </span>
                    </td>
                    <td>
                      <select
                        className="form-control"
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

          <div className="card" style={{ padding: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)', marginBottom: 6 }}>Legacy Review Quick Actions</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="vl-pill" type="button" onClick={() => setReviewDecision('review')}>
                Move to Review
              </button>
              <button className="vl-pill" type="button" onClick={() => setReviewDecision('pending_docs')}>
                Needs More Docs
              </button>
              <button className="vl-pill" type="button" onClick={() => setReviewDecision('declined')}>
                Reject Application
              </button>
              <button className="vl-pill" type="button" onClick={() => setReviewDecision('approved')}>
                Accept Application
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)', marginBottom: 6 }}>Score Review (Legacy-style Manual Override)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 6, marginBottom: 8 }}>
              <div className="vl-pill">Base: {selectedReviewApp?.score ?? '-'}</div>
              <div className="vl-pill">Docs: {(reviewModal.documents || []).filter((d) => d.status === 'submitted').length}</div>
              <div className="vl-pill">Missing: {(reviewModal.documents || []).filter((d) => d.status === 'missing').length}</div>
              <div className="vl-pill">
                Final: {clampScore(Number(selectedReviewApp?.score || 0) + Number(reviewModal.scoreAdjust || 0))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Manual Score Adj.</label>
                <input
                  type="number"
                  className="form-control"
                  min={-30}
                  max={30}
                  value={reviewModal.scoreAdjust}
                  onChange={(e) => setReviewModal((prev) => ({ ...prev, scoreAdjust: Number(e.target.value || 0) }))}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Score Override Note</label>
                <input
                  className="form-control"
                  value={reviewModal.scoreNote}
                  onChange={(e) => setReviewModal((prev) => ({ ...prev, scoreNote: e.target.value }))}
                  placeholder="Reason for score adjustment."
                />
              </div>
            </div>
          </div>

          {reviewModal.nextDecision === 'declined' && (
            <div className="form-group">
              <label>Reject Reason</label>
              <textarea
                className="form-control"
                style={{ minHeight: 80 }}
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
            <div className="form-group">
              <label>Documents to Re-submit</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 6 }}>
                {(reviewModal.documents || []).map((document) => {
                  const checked = (reviewModal.requiredDocs || []).includes(document.name)
                  return (
                    <label key={`required-${document.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)' }}>
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
            <div className="form-group">
              <label>Extra Review Time (days)</label>
              <input
                type="number"
                min={1}
                className="form-control"
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

          <div className="form-group">
            <label>WhatsApp Template Preview</label>
            <textarea
              className="form-control"
              style={{ minHeight: 120, fontFamily: 'var(--font-mono)' }}
              value={reviewModal.waTemplate}
              onChange={(e) => setReviewModal((prev) => ({ ...prev, waTemplate: e.target.value }))}
            />
            {reviewApplicantPhone ? (
              <div style={{ marginTop: 8 }}>
                <a
                  className="vl-pill"
                  href={`https://wa.me/${reviewApplicantPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(reviewModal.waTemplate || '')}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Contact via WhatsApp
                </a>
              </div>
            ) : null}
          </div>

          <div className="form-group">
            <label>Review Notes / Acknowledgement</label>
            <textarea
              className="form-control"
              style={{ minHeight: 90 }}
              value={reviewModal.note}
              onChange={(e) => setReviewModal((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Acknowledge review process, findings, and required next steps."
            />
          </div>

          <div className="modal-actions">
            <button className="btn btn-secondary" type="button" onClick={() => setReviewModal((prev) => ({ ...prev, open: false }))}>
              Cancel
            </button>
            <button className="btn btn-primary" type="button" onClick={submitReview}>
              Save Review
            </button>
          </div>
        </div>
      </div>

      <div className={`modal-overlay ${docPreview.open ? 'active' : ''}`}>
        <div className="modal" style={{ maxWidth: 980, width: '95vw' }}>
          <h2>Document Preview - {docPreview.title}</h2>
          <div style={{ border: '1px solid var(--b1)', borderRadius: 10, overflow: 'hidden', background: '#111' }}>
            <img src={docPreview.src} alt={docPreview.title} style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" type="button" onClick={() => setDocPreview({ open: false, src: '', title: '' })}>
              Close
            </button>
          </div>
        </div>
      </div>

      <div className={`modal-overlay ${scheduleModal.open ? 'active' : ''}`}>
        <div className="modal">
          <h2>Schedule Pickup Confirmation</h2>

          <div
            className="card"
            style={{
              padding: 12,
              border: '2px solid color-mix(in srgb, var(--ac) 30%, transparent)',
              background: 'var(--s2)',
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ac)', fontWeight: 800, marginBottom: 6 }}>
              ADMIN SCHEDULING ASSISTANT
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t2)', marginBottom: 10 }}>
              Help driver select pickup date & time.
            </div>

            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--t3)', marginBottom: 6 }}>PICKUP DATE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 6, marginBottom: 12 }}>
              {dateChoices.map((date) => {
                const active = date === scheduleModal.date
                return (
                  <button
                    key={date}
                    type="button"
                    className="vl-pill"
                    style={{
                      justifyContent: 'center',
                      fontSize: 'var(--text-xs)',
                      border: active ? '1px solid var(--ac)' : undefined,
                      background: active ? 'color-mix(in srgb, var(--ac) 20%, transparent)' : undefined,
                      color: active ? 'var(--ac)' : undefined,
                    }}
                    onClick={() => setScheduleModal((prev) => ({ ...prev, date }))}
                  >
                    {dateChipLabel(date)}
                  </button>
                )
              })}
            </div>

            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--t3)', marginBottom: 6 }}>AVAILABLE SLOTS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 6 }}>
              {timeSlots.map((slot) => {
                const active = slot === scheduleModal.time
                return (
                  <button
                    key={slot}
                    type="button"
                    className="vl-pill"
                    style={{
                      justifyContent: 'center',
                      fontSize: 'var(--text-xs)',
                      border: active ? '1px solid var(--ac)' : undefined,
                      background: active ? 'color-mix(in srgb, var(--ac) 20%, transparent)' : undefined,
                      color: active ? 'var(--ac)' : undefined,
                    }}
                    onClick={() => setScheduleModal((prev) => ({ ...prev, time: slot }))}
                  >
                    {slot}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="form-group">
            <label>Pickup Location (by program)</label>
            <input
              className="form-control"
              value={scheduleModal.location}
              onChange={(e) => setScheduleModal((prev) => ({ ...prev, location: e.target.value }))}
            />
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" type="button" onClick={() => setScheduleModal((prev) => ({ ...prev, open: false }))}>
              Cancel
            </button>
            <button className="btn btn-primary" type="button" onClick={submitSchedule}>
              Confirm Schedule: {scheduleModal.date} @ {scheduleModal.time}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
