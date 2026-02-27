import { useMemo, useState } from 'react'
import { createGps, deleteGps, getGpsSnapshot, updateGps } from '../bridge/legacyRuntime'
import { useLegacyTick } from '../hooks/useLegacyTick'

const initialFilter = { status: 'all', brand: 'all', search: '' }

export function GpsView() {
  const tick = useLegacyTick()
  const [filter, setFilter] = useState(initialFilter)
  const [imei, setImei] = useState('')
  const [brand, setBrand] = useState('Weloop')
  const [vehicleId, setVehicleId] = useState('')

  const data = useMemo(() => {
    void tick
    return getGpsSnapshot(filter)
  }, [filter, tick])

  const add = () => {
    if (!imei.trim()) return
    createGps({
      imei: imei.trim(),
      brand,
      model: brand === 'Teltonika' ? 'FMB920' : 'WL-210 Pro',
      vehicleId: vehicleId.trim() || null,
    })
    setImei('')
    setVehicleId('')
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-2 md:grid-cols-6">
        <input
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Search id/imei/plate/brand"
          value={filter.search}
          onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
        />
        <select
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={filter.status}
          onChange={(e) => setFilter((prev) => ({ ...prev, status: e.target.value }))}
        >
          <option value="all">All Status</option>
          <option value="Online">Online</option>
          <option value="Offline">Offline</option>
          <option value="Low Signal">Low Signal</option>
          <option value="Tampered">Tampered</option>
        </select>
        <select
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={filter.brand}
          onChange={(e) => setFilter((prev) => ({ ...prev, brand: e.target.value }))}
        >
          <option value="all">All Brands</option>
          <option value="Weloop">Weloop</option>
          <option value="Teltonika">Teltonika</option>
          <option value="Concox">Concox</option>
        </select>
        <input
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="New IMEI"
          value={imei}
          onChange={(e) => setImei(e.target.value)}
        />
        <select
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
        >
          <option value="Weloop">Weloop</option>
          <option value="Teltonika">Teltonika</option>
          <option value="Concox">Concox</option>
        </select>
        <div className="flex gap-2">
          <input
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            placeholder="Vehicle ID (optional)"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          />
          <button className="rounded bg-cyan-500 px-3 py-2 text-sm font-semibold text-black" onClick={add}>
            Add
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Total" value={data.stats.total || 0} />
        <Stat label="Online" value={data.stats.online || 0} />
        <Stat label="Offline" value={data.stats.offline || 0} />
        <Stat label="Firmware Alert" value={data.stats.firmwareAlert || 0} />
      </div>

      <div className="overflow-hidden rounded border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-slate-300">
            <tr>
              <th className="px-3 py-2">Device</th>
              <th className="px-3 py-2">IMEI</th>
              <th className="px-3 py-2">Vehicle</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.devices.slice(0, 120).map((device) => (
              <tr key={device.id} className="border-t border-slate-800">
                <td className="px-3 py-2">{device.id}</td>
                <td className="px-3 py-2">{device.imei}</td>
                <td className="px-3 py-2">{device.vehicleId || '—'}</td>
                <td className="px-3 py-2">{device.status}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      className="rounded bg-slate-700 px-2 py-1 text-xs"
                      onClick={() => {
                        const next = window.prompt('Set vehicle id (blank to unassign)', device.vehicleId || '')
                        if (next == null) return
                        updateGps(device.id, { vehicleId: next || null })
                      }}
                    >
                      Assign
                    </button>
                    <button
                      className="rounded bg-slate-700 px-2 py-1 text-xs"
                      onClick={() => {
                        const nextImei = window.prompt('Edit IMEI', device.imei || '')
                        if (nextImei == null) return
                        const nextBrand = window.prompt('Edit Brand', device.brand || '')
                        if (nextBrand == null) return
                        const nextCarrier = window.prompt('Edit SIM Carrier', device.sim?.carrier || 'Telkomsel')
                        if (nextCarrier == null) return
                        updateGps(device.id, {
                          imei: nextImei,
                          brand: nextBrand,
                          sim: { carrier: nextCarrier },
                        })
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="rounded bg-red-600 px-2 py-1 text-xs"
                      onClick={() => {
                        if (window.confirm(`Delete ${device.id}?`)) deleteGps(device.id)
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900/60 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-100">{value}</div>
    </div>
  )
}
