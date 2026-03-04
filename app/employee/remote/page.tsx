import { createClient } from '@/lib/supabase/server'
import RemoteRequestForm from './RemoteRequestForm'

export const dynamic = 'force-dynamic'

export default async function EmployeeRemotePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: requests } = await supabase
    .from('remote_requests')
    .select('*')
    .eq('employee_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Remote Work Requests</h2>
        <RemoteRequestForm userId={user!.id} adminEmail={process.env.ADMIN_EMAIL ?? ''} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['From', 'To', 'Reason', 'Status', 'Submitted'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-slate-600 font-semibold text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {requests?.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">No remote requests yet.</td></tr>
            )}
            {requests?.map((r: any) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 text-slate-700">{r.start_date}</td>
                <td className="px-5 py-3 text-slate-700">{r.end_date}</td>
                <td className="px-5 py-3 text-slate-500 max-w-xs truncate">{r.reason || '—'}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    r.status === 'approved' ? 'bg-green-100 text-green-700' :
                    r.status === 'declined' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{r.status}</span>
                </td>
                <td className="px-5 py-3 text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
