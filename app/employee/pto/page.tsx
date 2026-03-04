export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { differenceInMonths } from 'date-fns'
import PTORequestForm from './PTORequestForm'

export default async function EmployeePTOPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: requests }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('pto_requests').select('*').eq('employee_id', user!.id).order('created_at', { ascending: false }),
  ])

  const monthsWorked = Math.max(0, differenceInMonths(new Date(), new Date(profile?.start_date ?? new Date())))
  const accrualRate = profile?.pto_accrual_rate ?? 1.25
  const totalAccrued = monthsWorked * accrualRate
  const usedDays = requests?.filter(r => r.status === 'approved').reduce((s: number, r: any) => s + r.days_requested, 0) ?? 0
  const availableDays = Math.max(0, totalAccrued - usedDays)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">PTO Requests</h2>
          <p className="text-slate-500 mt-1">Available balance: <span className="font-semibold text-green-600">{availableDays.toFixed(1)} days</span></p>
        </div>
        <PTORequestForm userId={user!.id} availableDays={availableDays} adminEmail={process.env.ADMIN_EMAIL ?? ''} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['From', 'To', 'Days', 'Reason', 'Status', 'Submitted'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-slate-600 font-semibold text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {requests?.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">No PTO requests yet.</td></tr>
            )}
            {requests?.map((r: any) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 text-slate-700">{r.start_date}</td>
                <td className="px-5 py-3 text-slate-700">{r.end_date}</td>
                <td className="px-5 py-3 text-slate-700">{r.days_requested}</td>
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
