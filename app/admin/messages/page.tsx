export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import MessageReply from './MessageReply'

export default async function AdminMessagesPage() {
  const supabase = await createClient()
  const { data: messages } = await supabase
    .from('hr_messages')
    .select('*, profiles(full_name, real_email)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">HR Messages</h2>

      {messages?.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center text-slate-400">
          No messages yet.
        </div>
      )}

      <div className="space-y-4">
        {messages?.map((m: any) => (
          <div key={m.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-slate-800">{m.profiles?.full_name}</p>
                <p className="text-sm text-slate-500">{m.profiles?.real_email} · {new Date(m.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                m.status === 'unread' ? 'bg-rose-100 text-rose-700' :
                m.status === 'read' ? 'bg-amber-100 text-amber-700' :
                'bg-green-100 text-green-700'
              }`}>{m.status}</span>
            </div>

            <p className="font-medium text-slate-700 mb-1">{m.subject}</p>
            <p className="text-sm text-slate-600 mb-4">{m.message}</p>

            {m.admin_reply && (
              <div className="bg-slate-50 rounded-lg p-3 mb-4 border-l-4 border-slate-300">
                <p className="text-xs font-semibold text-slate-500 mb-1">Your reply:</p>
                <p className="text-sm text-slate-700">{m.admin_reply}</p>
              </div>
            )}

            <MessageReply
              id={m.id}
              status={m.status}
              existingReply={m.admin_reply}
              employeeEmail={m.profiles?.real_email}
              employeeName={m.profiles?.full_name}
              employeeId={m.employee_id}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
