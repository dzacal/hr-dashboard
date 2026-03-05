import { createClient } from '@/lib/supabase/server'
import SendMessageForm from './SendMessageForm'

export const dynamic = 'force-dynamic'

export default async function EmployeeMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user!.id).single()

  const { data: messages } = await supabase
    .from('hr_messages')
    .select('*')
    .eq('employee_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">HR Messages</h2>
        <SendMessageForm userId={user!.id} adminEmail={process.env.ADMIN_EMAIL ?? ''} employeeName={profile?.full_name} />
      </div>

      {messages?.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center text-slate-400">
          No messages yet. Use the button above to contact HR.
        </div>
      )}

      <div className="space-y-4">
        {messages?.map((m: any) => (
          <div key={m.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-start justify-between mb-2">
              <p className="font-semibold text-slate-800">{m.subject}</p>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                m.status === 'resolved' ? 'bg-green-100 text-green-700' :
                m.status === 'read' ? 'bg-blue-100 text-blue-700' :
                'bg-amber-100 text-amber-700'
              }`}>{m.status}</span>
            </div>
            <p className="text-sm text-slate-600 mb-1">{m.message}</p>
            <p className="text-xs text-slate-400">{new Date(m.created_at).toLocaleDateString()}</p>

            {m.admin_reply && (
              <div className="mt-4 bg-slate-50 rounded-lg p-4 border-l-4 border-slate-300">
                <p className="text-xs font-semibold text-slate-500 mb-1">HR Response:</p>
                <p className="text-sm text-slate-700">{m.admin_reply}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
