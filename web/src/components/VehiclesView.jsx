import { useMemo, useState } from 'react'
import { extendVehicleCredits, getVehicles, lockVehicle, releaseVehicle } from '../bridge/legacyRuntime'
import { useLegacyTick } from '../hooks/useLegacyTick'

export function VehiclesView() {
  const tick = useLegacyTick()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const vehicles = useMemo(
    () => {
      void tick
      return getVehicles({ search, status, sortBy: 'id', sortDir: 'asc' })
    },
    [search, status, tick],
  )
  const totalPages = Math.max(1, Math.ceil(vehicles.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = vehicles.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <section className="space-y-4">
      <div className="grid gap-2 md:grid-cols-2">
        <input
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Search id, plate, customer..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <select
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="grace">Grace</option>
          <option value="immobilized">Immobilized</option>
          <option value="paused">Paused</option>
          <option value="available">Available</option>
        </select>
      </div>
      <div className="overflow-hidden rounded border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-slate-300">
            <tr>
              <th className="px-3 py-2">Vehicle</th>
              <th className="px-3 py-2">Plate</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((v) => (
              <tr key={v.id} className="border-t border-slate-800">
                <td className="px-3 py-2">{v.id}</td>
                <td className="px-3 py-2">{v.plate}</td>
                <td className="px-3 py-2">{v.customer || '-'}</td>
                <td className="px-3 py-2 capitalize">{v.status}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button className="rounded bg-red-600 px-2 py-1 text-xs" onClick={() => lockVehicle(v.id)}>
                      Lock
                    </button>
                    <button className="rounded bg-emerald-600 px-2 py-1 text-xs" onClick={() => releaseVehicle(v.id)}>
                      Release
                    </button>
                    <button
                      className="rounded bg-slate-700 px-2 py-1 text-xs"
                      onClick={() => extendVehicleCredits(v.id, 1)}
                    >
                      +1 Day
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between rounded border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-300">
        <span>
          Page {currentPage} / {totalPages} ({vehicles.length} rows)
        </span>
        <div className="flex gap-2">
          <button
            className="rounded bg-slate-700 px-2 py-1 disabled:opacity-40"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, Math.min(currentPage, p) - 1))}
          >
            Prev
          </button>
          <button
            className="rounded bg-slate-700 px-2 py-1 disabled:opacity-40"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, Math.min(currentPage, p) + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  )
}
