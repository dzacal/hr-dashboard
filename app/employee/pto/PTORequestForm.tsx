'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { differenceInBusinessDays, parseISO, isWeekend } from 'date-fns'
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

/**
 * Partial-day deduction rule:
 *   1–4 hrs entered  → deducts 4 hrs (half day)
 *   > 4 hrs entered  → deducts 8 hrs (full day)
 */
function partialDayDeduction(hoursEntered: number): number {
  if (hoursEntered <= 0) return 0
  return hoursEntered <= 4 ? 4 : 8
}

export default function PTORequestForm({
  userId,
  availableDays,
  adminEmail,
}: {
  userId: string
  availableDays: number
  adminEmail: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // true = full day(s) request; false = partial/half-day
  const [isFullDay, setIsFullDay] = useState(true)

  const [form, setForm] = useState({
    start_date: '',
    end_date: '',
    partial_date: '',
    partial_hours: '',
    reason: '',
    leave_category: 'vacation',
  })

  const availableHours = availableDays * 8

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // --- Full-day calculation ---
  function calcBusinessDays() {
    if (!form.start_date || !form.end_date) return 0
    const days = differenceInBusinessDays(parseISO(form.end_date), parseISO(form.start_date)) + 1
    return Math.max(0, days)
  }
  function fullDayHours() {
    return calcBusinessDays() * 8
  }

  // --- Partial-day calculation ---
  function partialHoursEntered() {
    return Math.max(0, parseFloat(form.partial_hours) || 0)
  }
  function partialDeduction() {
    return partialDayDeduction(partialHoursEntered())
  }

  function hoursToDeduct() {
    return isFullDay ? fullDayHours() : partialDeduction()
  }

  function isPartialDateWeekend() {
    if (!form.partial_date) return false
    return isWeekend(parseISO(form.partial_date))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const hours = hoursToDeduct()

    if (hours <= 0) { setError('Invalid date or hours.'); return }
    if (!isFullDay && isPartialDateWeekend()) { setError('Selected date is a weekend.'); return }
    if (hours > availableHours) {
      setError(`You only have ${availableHours.toFixed(2)} hrs available.`)
      return
    }

    setLoading(true)

    const startDate = isFullDay ? form.start_date : form.partial_date
    const endDate = isFullDay ? form.end_date : form.partial_date

    const { error: dbErr } = await supabase.from('pto_requests').insert({
      employee_id: userId,
      start_date: startDate,
      end_date: endDate,
      hours_requested: hours,
      reason: form.reason,
      leave_category: form.leave_category,
      status: 'pending',
    })

    if (dbErr) { setError(dbErr.message); setLoading(false); return }

    await fetch('/api/notify/new-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminEmail,
        type: 'PTO',
        hours,
        start: startDate,
        end: endDate,
      }),
    })

    setOpen(false)
    setForm({ start_date: '', end_date: '', partial_date: '', partial_hours: '', reason: '', leave_category: 'vacation' })
    setIsFullDay(true)
    router.refresh()
    setLoading(false)
  }

  const inputClass = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900'

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
              {/* Leave type */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Leave Type *</label>
                <select required value={form.leave_category} onChange={e => set('leave_category', e.target.value)}
                  className={`${inputClass} bg-white`}>
                  {LEAVE_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Full day checkbox */}
              <label className="flex items-center gap-3 cursor-pointer select-none bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-200">
                <input
                  type="checkbox"
                  checked={isFullDay}
                  onChange={e => {
                    setIsFullDay(e.target.checked)
                    setError('')
                  }}
                  className="w-4 h-4 accent-slate-800"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-700">Full day or more</span>
                  <p className="text-xs text-slate-400 mt-0.5">Uncheck to request a partial / half day</p>
                </div>
              </label>

              {isFullDay ? (
                /* Full-day: date range */
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date *</label>
                      <input required type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">End Date *</label>
                      <input required type="date" value={form.end_date} min={form.start_date}
                        onChange={e => set('end_date', e.target.value)}
                        className={inputClass} />
                    </div>
                  </div>

                  {form.start_date && form.end_date && (
                    <div className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                      <strong>{calcBusinessDays()} business day{calcBusinessDays() !== 1 ? 's' : ''}</strong>
                      {' '}= <strong>{fullDayHours()} hrs</strong>
                      <span className="text-slate-400 ml-2">(Available: {availableHours.toFixed(2)} hrs)</span>
                    </div>
                  )}
                </>
              ) : (
                /* Partial day: single date + hours */
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Date *</label>
                    <input required type="date" value={form.partial_date}
                      onChange={e => set('partial_date', e.target.value)}
                      className={inputClass} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Hours needed *</label>
                    <input
                      required
                      type="number"
                      min="0.5"
                      max="7.5"
                      step="0.5"
                      value={form.partial_hours}
                      onChange={e => set('partial_hours', e.target.value)}
                      placeholder="e.g. 2, 3.5, 4"
                      className={inputClass}
                    />
                    <p className="text-xs text-slate-400 mt-1">Enter hours needed (0.5 – 7.5)</p>
                  </div>

                  {form.partial_hours && partialHoursEntered() > 0 && (
                    <div className="text-sm bg-amber-50 border border-amber-200 px-3 py-2.5 rounded-lg">
                      {partialHoursEntered() <= 4 ? (
                        <p className="text-amber-800">
                          <strong>Half day</strong> — <strong>4 hrs</strong> will be deducted from your balance.
                          <span className="text-amber-600 ml-2">(Available: {availableHours.toFixed(2)} hrs)</span>
                        </p>
                      ) : (
                        <p className="text-amber-800">
                          More than 4 hrs → counts as a <strong>full day</strong> — <strong>8 hrs</strong> will be deducted.
                          <span className="text-amber-600 ml-2">(Available: {availableHours.toFixed(2)} hrs)</span>
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reason (optional)</label>
                <textarea value={form.reason} onChange={e => set('reason', e.target.value)} rows={3}
                  className={`${inputClass} resize-none`} />
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
