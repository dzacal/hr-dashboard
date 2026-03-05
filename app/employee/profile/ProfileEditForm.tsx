'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Profile {
  full_name: string
  username: string
  position: string | null
  department: string | null
  company: string | null
  start_date: string | null
  birthday: string | null
  cell_phone: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null
}

export default function ProfileEditForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    position: profile.position ?? '',
    department: profile.department ?? '',
    birthday: profile.birthday ?? '',
    cell_phone: profile.cell_phone ?? '',
    emergency_contact_name: profile.emergency_contact_name ?? '',
    emergency_contact_phone: profile.emergency_contact_phone ?? '',
    emergency_contact_relationship: profile.emergency_contact_relationship ?? '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const res = await fetch('/api/employee/update-profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to save changes.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  const inputClass = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400'
  const labelClass = 'block text-xs font-semibold text-slate-600 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Read-only info */}
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Account Info (read-only)</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500">Full Name</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{profile.full_name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Username</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{profile.username}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Hire Date</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{profile.start_date ?? '—'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-semibold text-slate-500">Company</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{profile.company ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Editable: Job Info */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Job Information</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Title / Position</label>
            <input value={form.position} onChange={e => set('position', e.target.value)}
              placeholder="e.g. Software Engineer"
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Department</label>
            <input value={form.department} onChange={e => set('department', e.target.value)}
              placeholder="e.g. Engineering"
              className={inputClass} />
          </div>
        </div>
      </div>

      {/* Editable: Personal Info */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Personal Information</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Birthday</label>
            <input type="date" value={form.birthday} onChange={e => set('birthday', e.target.value)}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Cell Phone</label>
            <input type="tel" value={form.cell_phone} onChange={e => set('cell_phone', e.target.value)}
              placeholder="e.g. (555) 123-4567"
              className={inputClass} />
          </div>
        </div>
      </div>

      {/* Editable: Emergency Contact */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Emergency Contact</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Contact Name</label>
            <input value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)}
              placeholder="Full name"
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Contact Phone</label>
            <input type="tel" value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)}
              placeholder="e.g. (555) 987-6543"
              className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Relationship</label>
            <input value={form.emergency_contact_relationship} onChange={e => set('emergency_contact_relationship', e.target.value)}
              placeholder="e.g. Spouse, Parent, Sibling"
              className={inputClass} />
          </div>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      {success && <p className="text-green-700 text-sm bg-green-50 px-3 py-2 rounded-lg">Changes saved successfully.</p>}

      <div className="pt-2">
        <button type="submit" disabled={loading}
          className="bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-900 disabled:bg-slate-400 transition-colors">
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
