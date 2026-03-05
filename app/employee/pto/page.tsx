export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { calculatePTO } from '@/lib/pto'
import type { EmployeeType } from '@/lib/pto'
import PTORequestForm from './PTORequestForm'

const CATEGORY_LABELS: Record<string, string> = {
  vacation: 'Vacation',
  sick: 'Sick Leave',
  maternity_paternity: 'Maternity/Paternity',
  jury_duty: 'Jury Duty',
  bereavement: 'Bereavement',
  personal: 'Personal',
  other: 'Other',
}

function hrsAndDays(hours: number) {
  const days = hours / 8
  return `${hours.toFixed(2)} hrs (${days % 1 === 0 ? days.toFixed(0) : days.toFixed(1)} days)`
}

export default async function EmployeePTOPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: requests }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('pto_requests').select('*').eq('employee_id', user!.id).order('created_at', { ascending: false }),
  ])

  const approvedUsedHours = requests
    ?.filter((r: any) => r.status === 'approved')
    .reduce((s: number, r: any) => s + (r.hours_requested ?? r.days_requested ?? 0), 0) ?? 0

  const pto = profile?.start_date
    ? calculatePTO(
        (profile.employee_type ?? 'non_executive') as EmployeeType,
        new Date(profile.start_date),
        profile.pto_carryover_hours ?? 0,
        approvedUsedHours
      )
    : null

  const canRequest = pto?.eligibleToUse ?? false

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My PTO</h2>
          {!canRequest && pto && (
            <p className="text-amber-600 text-sm mt-1">PTO usage available after 90 days of employment.</p>
          )}
        </div>
        {canRequest && pto && (
          <PTORequestForm
            userId={user!.id}
            employeeName={profile?.full_name ?? ''}
            availableDays={pto.currentBalance / 8}
            adminEmail={process.env.ADMIN_EMAIL ?? ''}
          />
        )}
      </div>

      {/* PTO Balance Cards */}
      {pto && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Current Balance</p>
            <p className={`text-3xl font-bold ${pto.currentBalance >= pto.accrualStopBalance ? 'text-amber-600' : 'text-green-600'}`}>
              {pto.currentBalance.toFixed(2)}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{(pto.currentBalance / 8).toFixed(1)} days</p>
            <p className="text-xs text-slate-400 mt-0.5">hours available</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Prior Year Carryover</p>
            <p className="text-3xl font-bold text-slate-700">{pto.carryoverHours.toFixed(2)}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{(pto.carryoverHours / 8).toFixed(1)} days</p>
            <p className="text-xs text-slate-400 mt-0.5">hours carried over</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Accrued This Year</p>
            <p className="text-3xl font-bold text-blue-600">{pto.currentYearAccrued.toFixed(2)}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{(pto.currentYearAccrued / 8).toFixed(1)} days</p>
            <p className="text-xs text-slate-400 mt-0.5">hours accrued</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Used This Year</p>
            <p className="text-3xl font-bold text-rose-500">{pto.totalUsedHours.toFixed(2)}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{(pto.totalUsedHours / 8).toFixed(1)} days</p>
            <p className="text-xs text-slate-400 mt-0.5">hours used</p>
          </div>
        </div>
      )}

      {/* Accrual Info */}
      {pto && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 mb-6">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-slate-500">Months of Service: </span>
              <span className="font-semibold text-slate-800">{pto.monthsOfService}</span>
            </div>
            <div>
              <span className="text-slate-500">Accrual Rate: </span>
              <span className="font-semibold text-slate-800">{pto.currentTier.accrualPerPeriod} hrs / pay period</span>
            </div>
            <div>
              <span className="text-slate-500">Stop Balance: </span>
              <span className="font-semibold text-slate-800">{pto.accrualStopBalance} hrs ({pto.accrualStopBalance / 8} days)</span>
            </div>
            {pto.nextAccrualDate && pto.nextAccrualAmount > 0 && (
              <div>
                <span className="text-slate-500">Next Accrual: </span>
                <span className="font-semibold text-slate-800">
                  +{pto.nextAccrualAmount} hrs on {pto.nextAccrualDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}
            {pto.currentBalance >= pto.accrualStopBalance && (
              <div className="text-amber-600 font-semibold">Accrual paused — max balance reached</div>
            )}
          </div>
        </div>
      )}

      {/* Request History */}
      <h3 className="font-semibold text-slate-700 mb-3">Request History</h3>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Type', 'From', 'To', 'Hours / Days', 'Reason', 'Status', 'Submitted'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-slate-600 font-semibold text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {requests?.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">No PTO requests yet.</td></tr>
            )}
            {requests?.map((r: any) => {
              const hrs = r.hours_requested ?? r.days_requested ?? 0
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-700 whitespace-nowrap">
                    {CATEGORY_LABELS[r.leave_category ?? 'vacation'] ?? r.leave_category ?? 'Vacation'}
                  </td>
                  <td className="px-5 py-3 text-slate-700 whitespace-nowrap">{r.start_date}</td>
                  <td className="px-5 py-3 text-slate-700 whitespace-nowrap">{r.end_date}</td>
                  <td className="px-5 py-3 text-slate-700 whitespace-nowrap">{hrsAndDays(hrs)}</td>
                  <td className="px-5 py-3 text-slate-500 max-w-xs truncate">{r.reason || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      r.status === 'approved' ? 'bg-green-100 text-green-700' :
                      r.status === 'declined' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
