export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import PTOActions from './PTOActions'

export default async function AdminPTOPage() {
  const supabase = await createClient()
  const { data: requests } = await supabase
    .from('pto_requests')
    .select('*, profiles(full_name, real_email)')
    .order('created_at', { ascending: false })

  const pending = requests?.filter(r => r.status === 'pending') ?? []
  const resolved = requests?.filter(r => r.status !== 'pending') ?? []

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">PTO Requests</h2>

      <h3 className="font-semibold text-slate-600 mb-3">Pending ({pending.length})</h3>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Employee', 'From', 'To', 'Hours', 'Reason', 'Submitted', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-slate-600 font-semibold text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {pending.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">No pending PTO requests.</td></tr>
            )}
            {pending.map((r: any) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-800">{r.profiles?.full_name}</td>
                <td className="px-5 py-3 text-slate-600">{r.start_date}</td>
                <td className="px-5 py-3 text-slate-600">{r.end_date}</td>
                <td className="px-5 py-3 text-slate-600">{(r.hours_requested ?? r.days_requested ?? 0).toFixed(2)}</td>
                <td className="px-5 py-3 text-slate-500 max-w-xs truncate">{r.reason || '—'}</td>
                <td className="px-5 py-3 text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3">
                  <PTOActions id={r.id} employeeEmail={r.profiles?.real_email} employeeName={r.profiles?.full_name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="font-semibold text-slate-600 mb-3">History</h3>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Employee', 'From', 'To', 'Hours', 'Status', 'Submitted'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-slate-600 font-semibold text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {resolved.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">No history yet.</td></tr>
            )}
            {resolved.map((r: any) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-800">{r.profiles?.full_name}</td>
                <td className="px-5 py-3 text-slate-600">{r.start_date}</td>
                <td className="px-5 py-3 text-slate-600">{r.end_date}</td>
                <td className="px-5 py-3 text-slate-600">{(r.hours_requested ?? r.days_requested ?? 0).toFixed(2)}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {r.status}
                  </span>
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
