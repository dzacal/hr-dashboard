'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EmployeeStatusToggle({ employeeId, isActive }: { employeeId: string; isActive: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function handleToggle() {
    setLoading(true)
    await fetch('/api/admin/update-employee-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, isActive: !isActive }),
    })
    setLoading(false)
    setConfirming(false)
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">{isActive ? 'Mark as inactive?' : 'Restore as active?'}</span>
        <button onClick={handleToggle} disabled={loading}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${isActive ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'} disabled:opacity-50`}>
          {loading ? '...' : 'Confirm'}
        </button>
        <button onClick={() => setConfirming(false)}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)}
      className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-colors ${
        isActive
          ? 'border-red-200 text-red-600 hover:bg-red-50'
          : 'border-green-200 text-green-700 hover:bg-green-50'
      }`}>
      {isActive ? 'Mark Inactive' : 'Restore Active'}
    </button>
  )
}
