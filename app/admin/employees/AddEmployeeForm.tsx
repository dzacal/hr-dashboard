'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const COMPANIES = [
  'FOC FUND MANAGER QOZB, LLC',
  'ChoZen Center for Regenerative Living Inc.',
  'FOC PHX JAX QOZB, LLC',
]

export default function AddEmployeeForm() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const emptyForm = {
    full_name: '',
    username: '',
    real_email: '',
    company: '',
    department: '',
    position: '',
    start_date: '',
    employee_type: 'non_executive',
    pto_carryover_hours: '0',
    password: '',
  }

  const [form, setForm] = useState(emptyForm)

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/create-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to create employee.')
      setLoading(false)
      return
    }

    setOpen(false)
    setForm(emptyForm)
    router.refresh()
  }

  const inputClass = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900'
  const selectClass = `${inputClass} bg-white`

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-900 transition-colors"
      >
        + Add Employee
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Add New Employee</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                  <input required value={form.full_name} onChange={e => set('full_name', e.target.value)}
                    className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Username *</label>
                  <input required value={form.username} onChange={e => set('username', e.target.value.toLowerCase())}
                    className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email (for notifications) *</label>
                <input required type="email" value={form.real_email} onChange={e => set('real_email', e.target.value)}
                  className={inputClass} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Company *</label>
                <select required value={form.company} onChange={e => set('company', e.target.value)}
                  className={selectClass}>
                  <option value="">— Select Company —</option>
                  {COMPANIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                  <input value={form.department} onChange={e => set('department', e.target.value)}
                    className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Position</label>
                  <input value={form.position} onChange={e => set('position', e.target.value)}
                    className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Hire *</label>
                <input required type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                  className={inputClass} />
              </div>

              {/* Admin-only: Employee classification */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Admin Only</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Employee Type *</label>
                    <select required value={form.employee_type} onChange={e => set('employee_type', e.target.value)}
                      className={selectClass}>
                      <option value="non_executive">Non-Executive</option>
                      <option value="executive">Executive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Prior Year Carryover (hrs)</label>
                    <input type="number" step="0.01" min="0" max="40" value={form.pto_carryover_hours}
                      onChange={e => set('pto_carryover_hours', e.target.value)}
                      className={inputClass} />
                    <p className="text-xs text-slate-400 mt-1">Max 40 hrs</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Passcode *</label>
                <input required type="password" value={form.password} onChange={e => set('password', e.target.value)} minLength={8}
                  placeholder="Min 8 characters"
                  className={inputClass} />
              </div>

              {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-900 disabled:bg-slate-400 transition-colors">
                  {loading ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
