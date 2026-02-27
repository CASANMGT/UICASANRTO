import { useMemo, useState } from 'react'
import { getPrograms, getUsers } from '../bridge/legacyRuntime'
import { useLegacyTick } from '../hooks/useLegacyTick'

export function UsersView() {
  const tick = useLegacyTick()
  const [search, setSearch] = useState('')
  const [risk, setRisk] = useState('all')
  const [program, setProgram] = useState('all')
  const [sortBy, setSortBy] = useState('joinDate')
  const [sortDir, setSortDir] = useState('desc')
  const programs = useMemo(() => {
    void tick
    return getPrograms()
  }, [tick])

  const users = useMemo(
    () => {
      void tick
      return getUsers({ search, risk, program, sortBy, sortDir })
    },
    [search, risk, program, sortBy, sortDir, tick],
  )

  return (
    <section className="space-y-4">
      <div className="grid gap-2 md:grid-cols-5">
        <input
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Search name, phone, NIK..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
        >
          <option value="all">All Risk</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <select
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={program}
          onChange={(e) => setProgram(e.target.value)}
        >
          <option value="all">All Programs</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="joinDate">Join Date</option>
          <option value="name">Name</option>
          <option value="riskScore">Risk Score</option>
          <option value="totalPaid">Total Paid</option>
        </select>
        <select
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={sortDir}
          onChange={(e) => setSortDir(e.target.value)}
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>
      <div className="overflow-hidden rounded border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-slate-300">
            <tr>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Risk</th>
              <th className="px-3 py-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {users.slice(0, 100).map((user) => (
              <tr key={user.userId} className="border-t border-slate-800">
                <td className="px-3 py-2">{user.name}</td>
                <td className="px-3 py-2">{user.phone}</td>
                <td className="px-3 py-2">{user.riskLabel}</td>
                <td className="px-3 py-2">{user.riskScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
