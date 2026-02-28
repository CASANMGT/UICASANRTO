import { Fragment, useMemo, useState } from 'react'
import { createProgram, editProgram, getPrograms, getState, removeProgram } from '../bridge/legacyRuntime'
import { useLegacyTick } from '../hooks/useLegacyTick'

function makeId(shortName) {
  const token = (shortName || 'PRG').slice(0, 2).toUpperCase()
  return `P-${token}-${Date.now().toString().slice(-4)}`
}

export function ProgramsView() {
  const tick = useLegacyTick()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [programModal, setProgramModal] = useState({
    open: false,
    mode: 'create',
    id: '',
    name: '',
    shortName: '',
    partnerId: 'tangkas',
    type: 'RTO',
    price: '35000',
    grace: '7',
    commissionType: 'percentage',
    commissionValue: '10',
  })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [rentersModal, setRentersModal] = useState({ open: false, programId: '' })
  const [vehicleModal, setVehicleModal] = useState({ open: false, programId: '' })
  const [expandedRenterVehicleId, setExpandedRenterVehicleId] = useState('')

  const programs = useMemo(() => {
    void tick
    const q = search.trim().toLowerCase()
    const all = getPrograms()
    if (!q) return all
    return all.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.shortName || '').toLowerCase().includes(q) ||
        (p.partnerId || '').toLowerCase().includes(q),
    )
  }, [search, tick])
  const rentersByProgram = useMemo(() => {
    void tick
    const state = getState()
    const counts = {}
    for (const program of state.programs || []) counts[program.id] = 0
    for (const vehicle of state.vehicles || []) {
      if (vehicle.programId && (vehicle.customer || vehicle.userId)) {
        counts[vehicle.programId] = (counts[vehicle.programId] || 0) + 1
      }
    }
    return counts
  }, [tick])
  const vehiclesByProgram = useMemo(() => {
    void tick
    const state = getState()
    const counts = {}
    for (const program of state.programs || []) counts[program.id] = 0
    for (const vehicle of state.vehicles || []) {
      if (vehicle.programId) counts[vehicle.programId] = (counts[vehicle.programId] || 0) + 1
    }
    return counts
  }, [tick])
  const vehicleRows = useMemo(() => {
    if (!vehicleModal.programId) return []
    const state = getState()
    return (state.vehicles || []).filter((vehicle) => vehicle.programId === vehicleModal.programId)
  }, [vehicleModal.programId, tick])
  const programStats = useMemo(() => {
    const totalPrograms = programs.length
    const totalAssignedVehicles = programs.reduce((sum, p) => sum + (vehiclesByProgram[p.id] || 0), 0)
    const totalRenters = programs.reduce((sum, p) => sum + (rentersByProgram[p.id] || 0), 0)
    const avgCommissionPct =
      programs.length > 0
        ? Math.round(
            (programs.reduce((sum, p) => {
              if (p.commissionType === 'fixed') return sum
              return sum + Number(p.commissionRate || 0) * 100
            }, 0) /
              programs.length) *
              10,
          ) / 10
        : 0
    return { totalPrograms, totalAssignedVehicles, totalRenters, avgCommissionPct }
  }, [programs, vehiclesByProgram, rentersByProgram])
  const rentersRows = useMemo(() => {
    if (!rentersModal.programId) return []
    const state = getState()
    const usersById = new Map((state.users || []).map((user) => [user.userId, user]))
    return (state.vehicles || [])
      .filter((vehicle) => vehicle.programId === rentersModal.programId)
      .map((vehicle) => {
        const user =
          (vehicle.userId && usersById.get(vehicle.userId)) ||
          (state.users || []).find((item) => (item.name || '').toLowerCase() === (vehicle.customer || '').toLowerCase()) ||
          null
        const progressPct = Math.max(0, Math.min(100, vehicle.programType === 'RTO' ? 100 - (vehicle.credits || 0) : 0))
        return {
          vehicle,
          user,
          progressPct,
        }
      })
  }, [rentersModal.programId, tick])
  const pageSize = 15
  const totalPages = Math.max(1, Math.ceil(programs.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = programs.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const openCreateModal = () => {
    setProgramModal({
      open: true,
      mode: 'create',
      id: '',
      name: '',
      shortName: '',
      partnerId: 'tangkas',
      type: 'RTO',
      price: '35000',
      grace: '7',
      commissionType: 'percentage',
      commissionValue: '10',
    })
  }

  const openEditModal = (program) => {
    setProgramModal({
      open: true,
      mode: 'edit',
      id: program.id,
      name: program.name || '',
      shortName: program.shortName || '',
      partnerId: program.partnerId || 'tangkas',
      type: program.type || 'RTO',
      price: String(program.price || 0),
      grace: String(program.grace || 7),
      commissionType: program.commissionType || 'percentage',
      commissionValue: String(program.commissionType === 'fixed' ? program.commissionFixed || 0 : Math.round((program.commissionRate || 0) * 100)),
    })
  }

  const submitProgramModal = () => {
    const name = programModal.name.trim()
    if (!name) return
    const payload = {
      name,
      shortName: (programModal.shortName || name).trim().slice(0, 8),
      partnerId: programModal.partnerId,
      type: programModal.type,
      price: Number(programModal.price || 0),
      grace: Number(programModal.grace || 7),
      commissionType: programModal.commissionType,
      commissionRate: programModal.commissionType === 'percentage' ? Number(programModal.commissionValue || 0) / 100 : 0,
      commissionFixed: programModal.commissionType === 'fixed' ? Number(programModal.commissionValue || 0) : 0,
      eligibleModels: [],
      minSalary: 0,
      promotions: [],
    }
    if (programModal.mode === 'create') {
      createProgram({
        id: makeId(payload.shortName || payload.name),
        ...payload,
      })
    } else {
      editProgram(programModal.id, payload)
    }
    setProgramModal((prev) => ({ ...prev, open: false }))
  }


  return (
    <section className="vl-container">
      <div className="vl-header">
        <h2 className="vl-title">Program Management</h2>
        <div className="vl-count">{programs.length} Programs</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 8, marginBottom: 10 }}>
        <div className="card" style={{ padding: 10 }}>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>Programs</div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>{programStats.totalPrograms}</div>
        </div>
        <div className="card" style={{ padding: 10 }}>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>Assigned Vehicles</div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>{programStats.totalAssignedVehicles}</div>
        </div>
        <div className="card" style={{ padding: 10 }}>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>Active Renters</div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>{programStats.totalRenters}</div>
        </div>
        <div className="card" style={{ padding: 10 }}>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>Avg Commission (%)</div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>{programStats.avgCommissionPct}%</div>
        </div>
      </div>

      <div className="vl-controls" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr', gap: 8 }}>
        <input
          className="vl-search"
          placeholder="Search program..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <div style={{ gridColumn: '2 / span 4', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" type="button" onClick={openCreateModal}>
            + New Program
          </button>
        </div>
      </div>

      <table className="vl-table">
        <thead>
          <tr>
            <th>PROGRAM</th>
            <th>PARTNER</th>
            <th>TYPE</th>
            <th>VEHICLES ASSIGNED</th>
            <th>RENTERS</th>
            <th>PRICE / DAY</th>
            <th>COMMISSION</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.length > 0 ? (
            pageRows.map((program) => (
              <tr key={program.id}>
                <td>
                  <div style={{ fontWeight: 700 }}>{program.name}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>{program.id}</div>
                </td>
                <td>{program.partnerId}</td>
                <td>{program.type}</td>
                <td>{vehiclesByProgram[program.id] || 0}</td>
                <td>{rentersByProgram[program.id] || 0}</td>
                <td>Rp {Math.round(program.price || 0).toLocaleString('id-ID')}</td>
                <td>
                  {program.commissionType === 'fixed'
                    ? `Fixed Rp ${Math.round(program.commissionFixed || 0).toLocaleString('id-ID')}`
                    : `${Math.round(Number(program.commissionRate || 0) * 100)}%`}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="vl-pill"
                      type="button"
                      onClick={() => openEditModal(program)}
                    >
                      Edit
                    </button>
                    <button
                      className="vl-pill"
                      type="button"
                      onClick={() => setDeleteTarget(program)}
                    >
                      Delete
                    </button>
                    <button
                      className="vl-pill"
                      type="button"
                      onClick={() => {
                        setExpandedRenterVehicleId('')
                        setRentersModal({ open: true, programId: program.id })
                      }}
                    >
                      Renters List
                    </button>
                    <button
                      className="vl-pill"
                      type="button"
                      onClick={() => setVehicleModal({ open: true, programId: program.id })}
                    >
                      Vehicle List
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: 'var(--t3)' }}>
                No programs found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="vl-pagination">
        <div className="vl-page-info">
          Page {currentPage} / {totalPages} ({programs.length} rows)
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

      <div className={`modal-overlay ${programModal.open ? 'active' : ''}`}>
        <div className="modal">
          <h2>{programModal.mode === 'create' ? 'Launch New Program' : 'Update Program Scheme'}</h2>
          <div className="form-group">
            <label>Display Name</label>
            <input
              className="form-control"
              value={programModal.name}
              onChange={(e) => setProgramModal((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Short Name</label>
            <input
              className="form-control"
              value={programModal.shortName}
              onChange={(e) => setProgramModal((prev) => ({ ...prev, shortName: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Partner</label>
            <select
              className="form-control"
              value={programModal.partnerId}
              onChange={(e) => setProgramModal((prev) => ({ ...prev, partnerId: e.target.value }))}
            >
              <option value="tangkas">Tangkas</option>
              <option value="maka">Maka</option>
              <option value="united">United</option>
            </select>
          </div>
          <div className="form-group">
            <label>Program Intent</label>
            <select
              className="form-control"
              value={programModal.type}
              onChange={(e) => setProgramModal((prev) => ({ ...prev, type: e.target.value }))}
            >
              <option value="RTO">Rent To Own (RTO)</option>
              <option value="Rental">Daily Rental</option>
            </select>
          </div>
          <div className="form-group">
            <label>Daily Price (IDR)</label>
            <input
              className="form-control"
              value={programModal.price}
              onChange={(e) => setProgramModal((prev) => ({ ...prev, price: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Grace Period (Days)</label>
            <input
              className="form-control"
              value={programModal.grace}
              onChange={(e) => setProgramModal((prev) => ({ ...prev, grace: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Commission Type</label>
            <select
              className="form-control"
              value={programModal.commissionType}
              onChange={(e) => setProgramModal((prev) => ({ ...prev, commissionType: e.target.value }))}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (IDR)</option>
            </select>
          </div>
          <div className="form-group">
            <label>{programModal.commissionType === 'fixed' ? 'Commission Fixed (IDR)' : 'Commission Rate (%)'}</label>
            <input
              className="form-control"
              value={programModal.commissionValue}
              onChange={(e) => setProgramModal((prev) => ({ ...prev, commissionValue: e.target.value }))}
            />
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" type="button" onClick={() => setProgramModal((prev) => ({ ...prev, open: false }))}>
              Cancel
            </button>
            <button className="btn btn-primary" type="button" onClick={submitProgramModal}>
              {programModal.mode === 'create' ? 'Initialize Program' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className={`modal-overlay ${vehicleModal.open ? 'active' : ''}`}>
        <div className="modal" style={{ maxWidth: 980, width: '94vw' }}>
          <h2>
            Vehicle List for{' '}
            {programs.find((item) => item.id === vehicleModal.programId)?.shortName ||
              programs.find((item) => item.id === vehicleModal.programId)?.name ||
              'Program'}
          </h2>
          <div style={{ maxHeight: '70vh', overflow: 'auto', border: '1px solid var(--b1)', borderRadius: 10 }}>
            <table className="vl-table">
              <thead>
                <tr>
                  <th>VEHICLE ID</th>
                  <th>PLATE</th>
                  <th>RENTER</th>
                  <th>STATUS</th>
                  <th>CREDITS</th>
                  <th>GPS</th>
                </tr>
              </thead>
              <tbody>
                {vehicleRows.length > 0 ? (
                  vehicleRows.map((vehicle) => (
                    <tr key={`program-vehicle-${vehicle.id}`}>
                      <td>{vehicle.id}</td>
                      <td>{vehicle.plate || '-'}</td>
                      <td>{vehicle.customer || 'Unassigned'}</td>
                      <td>
                        <span className="vl-status" style={{ textTransform: 'uppercase' }}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td>{vehicle.credits !== undefined ? `${vehicle.credits}d` : '-'}</td>
                      <td>{vehicle.isOnline ? 'ON' : 'OFF'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: 20, textAlign: 'center', color: 'var(--t3)' }}>
                      No vehicles assigned to this program yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" type="button" onClick={() => setVehicleModal({ open: false, programId: '' })}>
              Close
            </button>
          </div>
        </div>
      </div>

      <div className={`modal-overlay ${rentersModal.open ? 'active' : ''}`}>
        <div className="modal" style={{ maxWidth: 1100, width: '95vw' }}>
          <h2>
            Renter Details for{' '}
            {programs.find((item) => item.id === rentersModal.programId)?.shortName ||
              programs.find((item) => item.id === rentersModal.programId)?.name ||
              'Program'}
          </h2>
          <div style={{ maxHeight: '70vh', overflow: 'auto', border: '1px solid var(--b1)', borderRadius: 10 }}>
            <table className="vl-table">
              <thead>
                <tr>
                  <th>RENTER INFO</th>
                  <th>RISK AUDIT</th>
                  <th>STATUS</th>
                  <th>PROGRESS</th>
                  <th>ACTIVE ADDRESS</th>
                  <th>GPS</th>
                  <th>NOPOL / ID</th>
                  <th>CREDITS</th>
                </tr>
              </thead>
              <tbody>
                {rentersRows.length > 0 ? (
                  rentersRows.map(({ vehicle, user, progressPct }) => {
                    const expanded = expandedRenterVehicleId === vehicle.id
                    return (
                      <Fragment key={`renters-group-${vehicle.id}`}>
                        <tr
                          style={{ cursor: 'pointer' }}
                          onClick={() => setExpandedRenterVehicleId((prev) => (prev === vehicle.id ? '' : vehicle.id))}
                        >
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ color: 'var(--t3)', fontSize: 13 }}>{expanded ? '▼' : '▶'}</span>
                              <div>
                                <div style={{ fontWeight: 700 }}>{vehicle.customer || 'Unknown'}</div>
                                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                                  {vehicle.userId || ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{user?.riskLabel || '-'}</div>
                            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>Score: {user?.riskScore ?? '-'}</div>
                          </td>
                          <td>
                            <span className="vl-status">{String(vehicle.status || '').toUpperCase()}</span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{progressPct}%</div>
                          </td>
                          <td>
                            <div style={{ color: 'var(--t3)' }}>{vehicle.lastActiveLocation || vehicle.address || 'Location Hidden'}</div>
                          </td>
                          <td>{vehicle.isOnline ? 'ON' : 'OFF'}</td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{vehicle.plate || vehicle.id}</div>
                            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)' }}>{vehicle.model || ''}</div>
                          </td>
                          <td>{vehicle.credits !== undefined ? `${vehicle.credits}d` : '--'}</td>
                        </tr>
                        {expanded ? (
                          <tr style={{ background: 'var(--s2)' }}>
                            <td colSpan={8}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 16, padding: '10px 6px' }}>
                                <div>
                                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)', marginBottom: 4 }}>Rider Info</div>
                                  <div style={{ fontSize: 'var(--text-sm)' }}>NIK: {user?.nik || '--'}</div>
                                  <div style={{ fontSize: 'var(--text-sm)' }}>Phone: {user?.phone || vehicle.phone || '--'}</div>
                                  <div style={{ fontSize: 'var(--text-sm)' }}>
                                    Join: {user?.joinDate ? new Date(user.joinDate).toLocaleDateString('id-ID') : '--'}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)', marginBottom: 4 }}>Performance</div>
                                  <div style={{ fontSize: 'var(--text-sm)' }}>
                                    Total Paid: Rp {Math.round(user?.totalPaid || 0).toLocaleString('id-ID')}
                                  </div>
                                  <div style={{ fontSize: 'var(--text-sm)' }}>Missed: {user?.missedPayments ?? 0}</div>
                                </div>
                                <div>
                                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--t3)', marginBottom: 4 }}>Emergency</div>
                                  <div style={{ fontSize: 'var(--text-sm)' }}>
                                    Name: {user?.emergencyContacts?.[0]?.name || '--'}
                                  </div>
                                  <div style={{ fontSize: 'var(--text-sm)' }}>
                                    Phone: {user?.emergencyContacts?.[0]?.phone || '--'}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={8} style={{ padding: 20, textAlign: 'center', color: 'var(--t3)' }}>
                      No renters in this program yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                setExpandedRenterVehicleId('')
                setRentersModal({ open: false, programId: '' })
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <div className={`modal-overlay ${deleteTarget ? 'active' : ''}`}>
        <div className="modal">
          <h2>Delete Program</h2>
          <div style={{ color: 'var(--t2)', fontSize: 'var(--text-md)' }}>
            Delete <b>{deleteTarget?.name}</b>? This cannot be undone.
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" type="button" onClick={() => setDeleteTarget(null)}>
              Cancel
            </button>
            <button
              className="btn btn-danger"
              type="button"
              onClick={() => {
                if (deleteTarget) removeProgram(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
