'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'maternity_paternity', label: 'Maternity/Paternity' },
  { value: 'jury_duty', label: 'Jury Duty' },
  { value: 'bereavement', label: 'Bereavement' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Other' },
]

interface Employee {
  id: string
  full_name: string
}

export default function BackfillPTOForm({ employees }: { employees: Employee[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    employee_id: '',
    start_date: '',
    end_date: '',
    hours_requested: '',
    leave_category: 'vacation',
    reason: '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/backfill-pto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Failed to save')
      setLoading(false)
      return
    }

    setOpen(false)
    setForm({ employee_id: '', start_date: '', end_date: '', hours_requested: '', leave_category: 'vacation', reason: '' })
    router.refresh()
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors"
      >
        + Add Historical PTO
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800">Add Historical PTO</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>

            <p className="text-xs text-slate-500 mb-5 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              This will be recorded as already-approved and will count against the employee&apos;s PTO balance.
            </p>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Employee</label>
                <select
                  required
                  value={form.employee_id}
                  onChange={(e) => set('employee_id', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <option value="">Select employee…</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Leave Type</label>
                <select
                  value={form.leave_category}
                  onChange={(e) => set('leave_category', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">From</label>
                  <input
                    type="date"
                    required
                    value={form.start_date}
                    onChange={(e) => set('start_date', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">To</label>
                  <input
                    type="date"
                    required
                    value={form.end_date}
                    onChange={(e) => set('end_date', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hours Used</label>
                <input
                  type="number"
                  required
                  min="0.5"
                  step="0.5"
                  value={form.hours_requested}
                  onChange={(e) => set('hours_requested', e.target.value)}
                  placeholder="e.g. 16"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reason <span className="font-normal text-slate-400">(optional)</span></label>
                <input
                  type="text"
                  value={form.reason}
                  onChange={(e) => set('reason', e.target.value)}
                  placeholder="e.g. Family vacation"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving…' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
