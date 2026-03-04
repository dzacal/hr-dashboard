'use client'
import { useState } from 'react'

export default function ChangePasswordForm() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setSuccess(false)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    setLoading(true)
    const res = await fetch('/api/employee/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Failed to update password.')
      return
    }

    setSuccess(true)
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
  }

  const inputClass = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400'
  const labelClass = 'block text-xs font-semibold text-slate-600 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Current Password</label>
        <input
          type="password"
          value={form.currentPassword}
          onChange={e => set('currentPassword', e.target.value)}
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>New Password</label>
        <input
          type="password"
          value={form.newPassword}
          onChange={e => set('newPassword', e.target.value)}
          required
          minLength={8}
          placeholder="Minimum 8 characters"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Confirm New Password</label>
        <input
          type="password"
          value={form.confirmPassword}
          onChange={e => set('confirmPassword', e.target.value)}
          required
          className={inputClass}
        />
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      {success && <p className="text-green-700 text-sm bg-green-50 px-3 py-2 rounded-lg">Password updated successfully.</p>}

      <div className="pt-1">
        <button type="submit" disabled={loading}
          className="bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-900 disabled:bg-slate-400 transition-colors">
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </form>
  )
}
