'use client'
import { useState } from 'react'

export default function ResetPasswordButton({ employeeId, employeeName }: { employeeId: string, employeeName: string }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const res = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, newPassword: password }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Failed to reset password.')
      return
    }

    setSuccess(true)
    setPassword('')
  }

  function handleClose() {
    setOpen(false)
    setPassword('')
    setError('')
    setSuccess(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
      >
        Reset Password
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-bold text-slate-800 mb-1">Reset Password</h3>
            <p className="text-sm text-slate-500 mb-5">Set a new temporary password for <span className="font-semibold text-slate-700">{employeeName}</span>.</p>

            {success ? (
              <div>
                <p className="text-green-700 text-sm bg-green-50 px-3 py-2 rounded-lg mb-4">Password reset successfully.</p>
                <button onClick={handleClose} className="w-full bg-slate-800 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-900 transition-colors">Done</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">New Password</label>
                  <input
                    type="text"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    required
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                  <p className="text-xs text-slate-400 mt-1">Shown as plain text so you can share it with the employee.</p>
                </div>

                {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={handleClose}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-900 disabled:bg-slate-400 transition-colors">
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
