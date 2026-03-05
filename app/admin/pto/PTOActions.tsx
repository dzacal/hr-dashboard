'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PTOActions({ id, employeeEmail, employeeName, employeeId }: { id: string; employeeEmail: string; employeeName: string; employeeId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function update(status: 'approved' | 'declined') {
    setLoading(true)

    // Get the current admin's name for the audit log
    const { data: { user } } = await supabase.auth.getUser()
    let reviewedBy = 'Admin'
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      if (profile?.full_name) reviewedBy = profile.full_name
    }

    await supabase.from('pto_requests').update({
      status,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id)

    await fetch('/api/notify/pto-decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeEmail, employeeName, status, type: 'PTO', employeeId }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex gap-2">
      <button disabled={loading} onClick={() => update('approved')}
        className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition-colors disabled:opacity-50">
        Approve
      </button>
      <button disabled={loading} onClick={() => update('declined')}
        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors disabled:opacity-50">
        Decline
      </button>
    </div>
  )
}
