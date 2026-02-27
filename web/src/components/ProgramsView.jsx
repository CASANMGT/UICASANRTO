import { useMemo, useState } from 'react'
import { createProgram, editProgram, getPrograms, removeProgram } from '../bridge/legacyRuntime'
import { useLegacyTick } from '../hooks/useLegacyTick'

function makeId(shortName) {
  const token = (shortName || 'PRG').slice(0, 2).toUpperCase()
  return `P-${token}-${Date.now().toString().slice(-4)}`
}

export function ProgramsView() {
  const tick = useLegacyTick()
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const [shortName, setShortName] = useState('')
  const [partnerId, setPartnerId] = useState('tangkas')
  const [price, setPrice] = useState('35000')

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

  const add = () => {
    if (!name.trim()) return
    createProgram({
      id: makeId(shortName || name),
      name: name.trim(),
      shortName: (shortName || name).trim().slice(0, 8),
      partnerId,
      type: 'RTO',
      price: Number(price || 0),
      grace: 7,
      commissionType: 'percentage',
      commissionRate: 0.1,
      commissionFixed: 0,
      eligibleModels: [],
      minSalary: 0,
      promotions: [],
    })
    setName('')
    setShortName('')
    setPrice('35000')
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-2 md:grid-cols-5">
        <input
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Search program..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Program name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Short name"
          value={shortName}
          onChange={(e) => setShortName(e.target.value)}
        />
        <select
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={partnerId}
          onChange={(e) => setPartnerId(e.target.value)}
        >
          <option value="tangkas">Tangkas</option>
          <option value="maka">Maka</option>
          <option value="united">United</option>
        </select>
        <div className="flex gap-2">
          <input
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            placeholder="Price/day"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <button className="rounded bg-cyan-500 px-3 py-2 text-sm font-semibold text-black" onClick={add}>
            Add
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-slate-300">
            <tr>
              <th className="px-3 py-2">Program</th>
              <th className="px-3 py-2">Partner</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Price/day</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((program) => (
              <tr key={program.id} className="border-t border-slate-800">
                <td className="px-3 py-2">
                  <div className="font-medium">{program.name}</div>
                  <div className="text-xs text-slate-400">{program.id}</div>
                </td>
                <td className="px-3 py-2">{program.partnerId}</td>
                <td className="px-3 py-2">{program.type}</td>
                <td className="px-3 py-2">Rp {Math.round(program.price || 0).toLocaleString('id-ID')}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      className="rounded bg-slate-700 px-2 py-1 text-xs"
                      onClick={() => {
                        const nextPrice = window.prompt('New daily price', String(program.price || 0))
                        if (nextPrice == null) return
                        editProgram(program.id, { price: Number(nextPrice) || 0 })
                      }}
                    >
                      Edit Price
                    </button>
                    <button
                      className="rounded bg-red-600 px-2 py-1 text-xs"
                      onClick={() => {
                        if (window.confirm(`Delete ${program.name}?`)) removeProgram(program.id)
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
