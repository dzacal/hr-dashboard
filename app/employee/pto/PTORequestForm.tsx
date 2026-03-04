'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { differenceInBusinessDays, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/client'

const LEAVE_CATEGORIES = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'maternity_paternity', label: 'Maternity / Paternity' },
  { value: 'jury_duty', label: 'Jury Duty' },
  { value: 'bereavement', label: 'Bereavement' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Other' },
]

export default function PTORequestForm({ userId, availableDays, adminEmail }: { userId: string; availableDays: number; adminEmail: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ start_date: '', end_date: '', reason: '', leave_category: 'vacation' })

  const availableHours = availableDays * 8

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function calcBusinessDays() {
    if (!form.start_date || !form.end_date) return 0
    const days = differenceInBusinessDays(parseISO(form.end_date), parseISO(form.start_date)) + 1
    return Math.max(0, days)
  }

  function calcHours() {
    return calcBusinessDays() * 8
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const hours = calcHours()
    if (hours <= 0) { setError('Invalid date range.'); return }
    if (hours > availableHours) { setError(`You only have ${availableHours.toFixed(2)} hours available.`); return }

    setLoading(true)
    const { error: dbErr } = await supabase.from('pto_requests').insert({
      employee_id: userId,
      start_date: form.start_date,
      end_date: form.end_date,
      hours_requested: hours,
      reason: form.reason,
      leave_category: form.leave_category,
      status: 'pending',
    })

    if (dbErr) { setError(dbErr.message); setLoading(false); return }

    await fetch('/api/notify/new-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminEmail, type: 'PTO', hours, start: form.start_date, end: form.end_date }),
    })

    setOpen(false)
    setForm({ start_date: '', end_date: '', reason: '', leave_category: 'vacation' })
    router.refresh()
    setLoading(false)
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-900 transition-colors">
        + Request PTO
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Request PTO</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Leave Type *</label>
                <select required value={form.leave_category} onChange={e => set('leave_category', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 bg-white">
                  {LEAVE_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date *</label>
                  <input required type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">End Date *</label>
                  <input required type="date" value={form.end_date} min={form.start_date} onChange={e => set('end_date', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900" />
                </div>
              </div>

              {form.start_date && form.end_date && (
                <p className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                  <strong>{calcBusinessDays()} business day{calcBusinessDays() !== 1 ? 's' : ''}</strong> = <strong>{calcHours()} hrs</strong>
                  <span className="text-slate-400 ml-2">(Available: {availableHours.toFixed(2)} hrs)</span>
                </p>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reason (optional)</label>
                <textarea value={form.reason} onChange={e => set('reason', e.target.value)} rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 resize-none" />
              </div>

              {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-900 disabled:bg-slate-400 transition-colors">
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
