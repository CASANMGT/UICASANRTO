import { Fragment, useMemo, useState } from 'react'
import { createProgram, editProgram, getPrograms, getState, removeProgram } from '../bridge/legacyRuntime'
import { useLegacyTick } from '../hooks/useLegacyTick'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { FilterBar, PageHeader, PageMeta, PageShell, PageTitle, StatCard, StatsGrid } from './ui/page'

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
    pickupLocation: '',
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
      pickupLocation: '',
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
      pickupLocation: program.pickupLocation || '',
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
      pickupLocation: programModal.pickupLocation.trim() || 'Program Pickup Point',
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

  const selectedVehicleProgram = programs.find((item) => item.id === vehicleModal.programId)
  const selectedRentersProgram = programs.find((item) => item.id === rentersModal.programId)
  const inputCls =
    'w-full rounded-xl border border-[color:var(--b1)] bg-white px-3 py-2 text-[13px] text-[color:var(--t1)] outline-none ring-[color:var(--ac)] focus:ring-2'
  const actionBtnCls =
    'rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100'

  return (
    <PageShell>
      <PageHeader>
        <PageTitle>Program Management</PageTitle>
        <PageMeta>{programs.length} Programs</PageMeta>
      </PageHeader>

      <StatsGrid className="xl:grid-cols-4">
        <StatCard label="Programs" value={programStats.totalPrograms} />
        <StatCard label="Assigned Vehicles" value={programStats.totalAssignedVehicles} />
        <StatCard label="Active Renters" value={programStats.totalRenters} />
        <StatCard label="Avg Commission (%)" value={`${programStats.avgCommissionPct}%`} />
      </StatsGrid>

      <FilterBar className="lg:grid-cols-5">
        <Input
          variant="legacy"
          className="lg:col-span-2"
          placeholder="Search program..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <div className="flex justify-end lg:col-span-3">
          <Button variant="legacyPrimary" onClick={openCreateModal}>
            + New Program
          </Button>
        </div>
      </FilterBar>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-[1080px] w-full border-collapse text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left">PROGRAM</th>
              <th className="px-3 py-2 text-left">PARTNER</th>
              <th className="px-3 py-2 text-left">TYPE</th>
              <th className="px-3 py-2 text-left">VEHICLES ASSIGNED</th>
              <th className="px-3 py-2 text-left">RENTERS</th>
              <th className="px-3 py-2 text-left">PRICE / DAY</th>
              <th className="px-3 py-2 text-left">COMMISSION</th>
              <th className="px-3 py-2 text-left">PICKUP LOCATION</th>
              <th className="px-3 py-2 text-left">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length > 0 ? (
              pageRows.map((program) => (
                <tr key={program.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <div className="font-bold text-slate-900">{program.name}</div>
                    <div className="font-mono text-xs text-slate-500">{program.id}</div>
                  </td>
                  <td className="px-3 py-2">{program.partnerId}</td>
                  <td className="px-3 py-2">{program.type}</td>
                  <td className="px-3 py-2">{vehiclesByProgram[program.id] || 0}</td>
                  <td className="px-3 py-2">{rentersByProgram[program.id] || 0}</td>
                  <td className="px-3 py-2">Rp {Math.round(program.price || 0).toLocaleString('id-ID')}</td>
                  <td className="px-3 py-2">
                    {program.commissionType === 'fixed'
                      ? `Fixed Rp ${Math.round(program.commissionFixed || 0).toLocaleString('id-ID')}`
                      : `${Math.round(Number(program.commissionRate || 0) * 100)}%`}
                  </td>
                  <td className="px-3 py-2">{program.pickupLocation || 'Program Pickup Point'}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button className={actionBtnCls} type="button" onClick={() => openEditModal(program)}>
                        Edit
                      </button>
                      <button className={actionBtnCls} type="button" onClick={() => setDeleteTarget(program)}>
                        Delete
                      </button>
                      <button
                        className={actionBtnCls}
                        type="button"
                        onClick={() => {
                          setExpandedRenterVehicleId('')
                          setRentersModal({ open: true, programId: program.id })
                        }}
                      >
                        Renters List
                      </button>
                      <button
                        className={actionBtnCls}
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
                <td colSpan={9} className="px-6 py-8 text-center text-sm text-slate-500">
                  No programs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-600">
          Page {currentPage} / {totalPages} ({programs.length} rows)
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-100"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <button
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-100"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>

      <div className={`${programModal.open ? 'flex' : 'hidden'} fixed inset-0 z-50 items-center justify-center bg-black/45 p-4`}>
        <div className="max-h-[92vh] w-full max-w-xl overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <h2 className="mb-3 text-lg font-extrabold text-slate-900">
            {programModal.mode === 'create' ? 'Launch New Program' : 'Update Program Scheme'}
          </h2>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-slate-600">Display Name</label>
            <input className={inputCls} value={programModal.name} onChange={(e) => setProgramModal((prev) => ({ ...prev, name: e.target.value }))} />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-slate-600">Short Name</label>
            <input className={inputCls} value={programModal.shortName} onChange={(e) => setProgramModal((prev) => ({ ...prev, shortName: e.target.value }))} />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-slate-600">Partner</label>
            <select className={inputCls} value={programModal.partnerId} onChange={(e) => setProgramModal((prev) => ({ ...prev, partnerId: e.target.value }))}>
              <option value="tangkas">Tangkas</option>
              <option value="maka">Maka</option>
              <option value="united">United</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-slate-600">Program Intent</label>
            <select className={inputCls} value={programModal.type} onChange={(e) => setProgramModal((prev) => ({ ...prev, type: e.target.value }))}>
              <option value="RTO">Rent To Own (RTO)</option>
              <option value="Rental">Daily Rental</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-slate-600">Daily Price (IDR)</label>
            <input className={inputCls} value={programModal.price} onChange={(e) => setProgramModal((prev) => ({ ...prev, price: e.target.value }))} />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-slate-600">Grace Period (Days)</label>
            <input className={inputCls} value={programModal.grace} onChange={(e) => setProgramModal((prev) => ({ ...prev, grace: e.target.value }))} />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-semibold text-slate-600">Commission Type</label>
            <select className={inputCls} value={programModal.commissionType} onChange={(e) => setProgramModal((prev) => ({ ...prev, commissionType: e.target.value }))}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (IDR)</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-semibold text-slate-600">
              {programModal.commissionType === 'fixed' ? 'Commission Fixed (IDR)' : 'Commission Rate (%)'}
            </label>
            <input className={inputCls} value={programModal.commissionValue} onChange={(e) => setProgramModal((prev) => ({ ...prev, commissionValue: e.target.value }))} />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-semibold text-slate-600">Pickup Location</label>
            <input
              className={inputCls}
              value={programModal.pickupLocation}
              placeholder="Program pickup point"
              onChange={(e) => setProgramModal((prev) => ({ ...prev, pickupLocation: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              type="button"
              onClick={() => setProgramModal((prev) => ({ ...prev, open: false }))}
            >
              Cancel
            </button>
            <button className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700" type="button" onClick={submitProgramModal}>
              {programModal.mode === 'create' ? 'Initialize Program' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className={`${vehicleModal.open ? 'flex' : 'hidden'} fixed inset-0 z-50 items-center justify-center bg-black/45 p-4`}>
        <div className="max-h-[92vh] w-[94vw] max-w-5xl overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <h2 className="mb-3 text-lg font-extrabold text-slate-900">
            Vehicle List for {selectedVehicleProgram?.shortName || selectedVehicleProgram?.name || 'Program'}
          </h2>
          <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">VEHICLE ID</th>
                  <th className="px-3 py-2 text-left">PLATE</th>
                  <th className="px-3 py-2 text-left">RENTER</th>
                  <th className="px-3 py-2 text-left">STATUS</th>
                  <th className="px-3 py-2 text-left">CREDITS</th>
                  <th className="px-3 py-2 text-left">GPS</th>
                </tr>
              </thead>
              <tbody>
                {vehicleRows.length > 0 ? (
                  vehicleRows.map((vehicle) => (
                    <tr key={`program-vehicle-${vehicle.id}`} className="border-t border-slate-100">
                      <td className="px-3 py-2">{vehicle.id}</td>
                      <td className="px-3 py-2">{vehicle.plate || '-'}</td>
                      <td className="px-3 py-2">{vehicle.customer || 'Unassigned'}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">{vehicle.credits !== undefined ? `${vehicle.credits}d` : '-'}</td>
                      <td className="px-3 py-2">{vehicle.isOnline ? 'ON' : 'OFF'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                      No vehicles assigned to this program yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              type="button"
              onClick={() => setVehicleModal({ open: false, programId: '' })}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <div className={`${rentersModal.open ? 'flex' : 'hidden'} fixed inset-0 z-50 items-center justify-center bg-black/45 p-4`}>
        <div className="max-h-[92vh] w-[95vw] max-w-6xl overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <h2 className="mb-3 text-lg font-extrabold text-slate-900">
            Renter Details for {selectedRentersProgram?.shortName || selectedRentersProgram?.name || 'Program'}
          </h2>
          <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">RENTER INFO</th>
                  <th className="px-3 py-2 text-left">RISK AUDIT</th>
                  <th className="px-3 py-2 text-left">STATUS</th>
                  <th className="px-3 py-2 text-left">PROGRESS</th>
                  <th className="px-3 py-2 text-left">ACTIVE ADDRESS</th>
                  <th className="px-3 py-2 text-left">GPS</th>
                  <th className="px-3 py-2 text-left">NOPOL / ID</th>
                  <th className="px-3 py-2 text-left">CREDITS</th>
                </tr>
              </thead>
              <tbody>
                {rentersRows.length > 0 ? (
                  rentersRows.map(({ vehicle, user, progressPct }) => {
                    const expanded = expandedRenterVehicleId === vehicle.id
                    return (
                      <Fragment key={`renters-group-${vehicle.id}`}>
                        <tr
                          className="cursor-pointer border-t border-slate-100"
                          onClick={() => setExpandedRenterVehicleId((prev) => (prev === vehicle.id ? '' : vehicle.id))}
                        >
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">{expanded ? '▼' : '▶'}</span>
                              <div>
                                <div className="font-bold text-slate-900">{vehicle.customer || 'Unknown'}</div>
                                <div className="font-mono text-xs text-slate-500">{vehicle.userId || ''}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-bold text-slate-900">{user?.riskLabel || '-'}</div>
                            <div className="text-xs text-slate-500">Score: {user?.riskScore ?? '-'}</div>
                          </td>
                          <td className="px-3 py-2">
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                              {String(vehicle.status || '').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-bold text-slate-900">{progressPct}%</div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="text-slate-500">{vehicle.lastActiveLocation || vehicle.address || 'Location Hidden'}</div>
                          </td>
                          <td className="px-3 py-2">{vehicle.isOnline ? 'ON' : 'OFF'}</td>
                          <td className="px-3 py-2">
                            <div className="font-bold text-slate-900">{vehicle.plate || vehicle.id}</div>
                            <div className="text-xs text-slate-500">{vehicle.model || ''}</div>
                          </td>
                          <td className="px-3 py-2">{vehicle.credits !== undefined ? `${vehicle.credits}d` : '--'}</td>
                        </tr>
                        {expanded ? (
                          <tr className="bg-slate-50">
                            <td colSpan={8} className="px-3 py-2">
                              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                <div>
                                  <div className="mb-1 text-xs font-semibold text-slate-500">Rider Info</div>
                                  <div className="text-sm">NIK: {user?.nik || '--'}</div>
                                  <div className="text-sm">Phone: {user?.phone || vehicle.phone || '--'}</div>
                                  <div className="text-sm">
                                    Join: {user?.joinDate ? new Date(user.joinDate).toLocaleDateString('id-ID') : '--'}
                                  </div>
                                </div>
                                <div>
                                  <div className="mb-1 text-xs font-semibold text-slate-500">Performance</div>
                                  <div className="text-sm">
                                    Total Paid: Rp {Math.round(user?.totalPaid || 0).toLocaleString('id-ID')}
                                  </div>
                                  <div className="text-sm">Missed: {user?.missedPayments ?? 0}</div>
                                </div>
                                <div>
                                  <div className="mb-1 text-xs font-semibold text-slate-500">Emergency</div>
                                  <div className="text-sm">Name: {user?.emergencyContacts?.[0]?.name || '--'}</div>
                                  <div className="text-sm">Phone: {user?.emergencyContacts?.[0]?.phone || '--'}</div>
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
                    <td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-500">
                      No renters in this program yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
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

      <div className={`${deleteTarget ? 'flex' : 'hidden'} fixed inset-0 z-50 items-center justify-center bg-black/45 p-4`}>
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <h2 className="mb-2 text-lg font-extrabold text-slate-900">Delete Program</h2>
          <div className="text-sm text-slate-600">
            Delete <b>{deleteTarget?.name}</b>? This cannot be undone.
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              type="button"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
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
    </PageShell>
  )
}
