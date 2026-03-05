'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function MessageReply({
  id, status, existingReply, employeeEmail, employeeName, employeeId
}: {
  id: string; status: string; existingReply?: string; employeeEmail: string; employeeName: string; employeeId: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [reply, setReply] = useState(existingReply ?? '')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    await supabase.from('hr_messages').update({ admin_reply: reply, status: 'resolved' }).eq('id', id)
    await fetch('/api/notify/message-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeEmail, employeeName, reply, employeeId }),
    })

    setSent(true)
    setLoading(false)
    router.refresh()
  }

  async function markRead() {
    if (status === 'unread') {
      await supabase.from('hr_messages').update({ status: 'read' }).eq('id', id)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleReply} className="flex gap-3 items-end">
      <div className="flex-1">
        <textarea
          value={reply}
          onChange={e => setReply(e.target.value)}
          onFocus={markRead}
          placeholder="Write a reply..."
          rows={2}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-900 resize-none"
        />
      </div>
      <button type="submit" disabled={loading || !reply.trim()}
        className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900 disabled:bg-slate-300 transition-colors whitespace-nowrap">
        {sent ? 'Replied ✓' : loading ? 'Sending...' : 'Send Reply'}
      </button>
    </form>
  )
}
