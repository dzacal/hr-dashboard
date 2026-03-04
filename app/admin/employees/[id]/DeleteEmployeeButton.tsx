'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteEmployeeButton({ employeeId, employeeName }: { employeeId: string; employeeName: string }) {
  const router = useRouter()
  const [step, setStep] = useState<'idle' | 'confirm' | 'loading'>('idle')
  const [error, setError] = useState('')

  async function handleDelete() {
    setStep('loading')
    const res = await fetch('/api/admin/delete-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to delete employee.')
      setStep('confirm')
      return
    }
    router.push('/admin/employees')
    router.refresh()
  }

  if (step === 'idle') {
    return (
      <button onClick={() => setStep('confirm')}
        className="px-4 py-2 text-sm font-semibold rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
        Delete Employee
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 className="text-base font-bold text-slate-800 mb-1">Delete Employee</h3>
        <p className="text-sm text-slate-500 mb-1">
          This will permanently delete <span className="font-semibold text-slate-700">{employeeName}</span> and all of their data.
        </p>
        <p className="text-sm text-red-600 font-semibold mb-5">This cannot be undone.</p>

        {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}

        <div className="flex gap-3">
          <button onClick={() => { setStep('idle'); setError('') }} disabled={step === 'loading'}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={step === 'loading'}
            className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 disabled:bg-red-300 transition-colors">
            {step === 'loading' ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  )
}
