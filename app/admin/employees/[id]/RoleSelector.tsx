'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const OPTIONS = [
  {
    value: 'employee',
    label: 'Employee Only',
    description: 'Access to employee portal only',
    color: 'border-blue-300 bg-blue-50 text-blue-800',
    activeRing: 'ring-2 ring-blue-400',
  },
  {
    value: 'admin',
    label: 'Admin Only',
    description: 'Access to admin panel only',
    color: 'border-purple-300 bg-purple-50 text-purple-800',
    activeRing: 'ring-2 ring-purple-400',
  },
  {
    value: 'both',
    label: 'Admin + Employee',
    description: 'Can switch between both portals',
    color: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    activeRing: 'ring-2 ring-emerald-400',
  },
]

export default function RoleSelector({ employeeId, currentRole }: { employeeId: string; currentRole: string }) {
  const router = useRouter()
  const [selected, setSelected] = useState(currentRole)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const isDirty = selected !== currentRole

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)
    const res = await fetch('/api/admin/update-employee-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, role: selected }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error || 'Failed to update role.'); return }
    setSaved(true)
    router.refresh()
  }

  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Portal Access</p>
      <div className="flex flex-wrap gap-3 mb-3">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => { setSelected(opt.value); setSaved(false) }}
            className={`flex-1 min-w-36 text-left px-4 py-3 rounded-xl border-2 transition-all ${opt.color} ${selected === opt.value ? opt.activeRing : 'opacity-60 hover:opacity-90'}`}
          >
            <p className="text-sm font-bold">{opt.label}</p>
            <p className="text-xs mt-0.5 opacity-75">{opt.description}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {isDirty && (
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm font-semibold bg-slate-800 text-white rounded-xl hover:bg-slate-900 disabled:bg-slate-400 transition-colors">
            {saving ? 'Saving...' : 'Save Access Level'}
          </button>
        )}
        {saved && !isDirty && (
          <span className="text-sm text-green-600 font-medium">Access level updated.</span>
        )}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  )
}
