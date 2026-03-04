export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import PTOActions from './PTOActions'

const CATEGORY_LABELS: Record<string, string> = {
  vacation: 'Vacation',
  sick: 'Sick Leave',
  maternity_paternity: 'Maternity/Paternity',
  jury_duty: 'Jury Duty',
  bereavement: 'Bereavement',
  personal: 'Personal',
  other: 'Other',
}

const CATEGORY_COLORS: Record<string, string> = {
  vacation: 'bg-sky-100 text-sky-700',
  sick: 'bg-red-100 text-red-700',
  maternity_paternity: 'bg-pink-100 text-pink-700',
  jury_duty: 'bg-amber-100 text-amber-700',
  bereavement: 'bg-slate-100 text-slate-700',
  personal: 'bg-violet-100 text-violet-700',
  other: 'bg-gray-100 text-gray-700',
}

function CategoryBadge({ category }: { category: string | null }) {
  const key = category ?? 'vacation'
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${CATEGORY_COLORS[key] ?? 'bg-gray-100 text-gray-700'}`}>
      {CATEGORY_LABELS[key] ?? key}
    </span>
  )
}

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
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Employee', 'Type', 'From', 'To', 'Hours', 'Reason', 'Submitted', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-slate-600 font-semibold text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {pending.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-400">No pending PTO requests.</td></tr>
            )}
            {pending.map((r: any) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-800 whitespace-nowrap">{r.profiles?.full_name}</td>
                <td className="px-5 py-3"><CategoryBadge category={r.leave_category} /></td>
                <td className="px-5 py-3 text-slate-600 whitespace-nowrap">{r.start_date}</td>
                <td className="px-5 py-3 text-slate-600 whitespace-nowrap">{r.end_date}</td>
                <td className="px-5 py-3 text-slate-600">{(r.hours_requested ?? r.days_requested ?? 0).toFixed(2)}</td>
                <td className="px-5 py-3 text-slate-500 max-w-xs truncate">{r.reason || '—'}</td>
                <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3">
                  <PTOActions id={r.id} employeeEmail={r.profiles?.real_email} employeeName={r.profiles?.full_name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="font-semibold text-slate-600 mb-3">History</h3>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Employee', 'Type', 'From', 'To', 'Hours', 'Status', 'Submitted'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-slate-600 font-semibold text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {resolved.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">No history yet.</td></tr>
            )}
            {resolved.map((r: any) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-800 whitespace-nowrap">{r.profiles?.full_name}</td>
                <td className="px-5 py-3"><CategoryBadge category={r.leave_category} /></td>
                <td className="px-5 py-3 text-slate-600 whitespace-nowrap">{r.start_date}</td>
                <td className="px-5 py-3 text-slate-600 whitespace-nowrap">{r.end_date}</td>
                <td className="px-5 py-3 text-slate-600">{(r.hours_requested ?? r.days_requested ?? 0).toFixed(2)}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
