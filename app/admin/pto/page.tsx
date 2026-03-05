export const dynamic = 'force-dynamic'

import React from 'react'
import { createServiceClient } from '@/lib/supabase/service'
import { getYearEndProjection } from '@/lib/pto'
import type { EmployeeType, PTOYearEndProjection } from '@/lib/pto'
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

function PTOSnapshotRow({ proj, requestHours }: { proj: PTOYearEndProjection; requestHours: number }) {
  const balanceAfterApproval = proj.currentBalance - requestHours
  const yearEndAfterApproval = proj.yearEndBalance - requestHours
  const overCurrentBalance = balanceAfterApproval < 0
  const overYearEnd = yearEndAfterApproval < 0

  return (
    <tr className="bg-slate-50 border-b border-slate-100">
      <td colSpan={8} className="px-5 py-2">
        <div className="flex flex-wrap gap-x-5 gap-y-1 items-center text-xs text-slate-600">
          <span className={`px-2 py-0.5 rounded-full font-semibold ${proj.isExecutive ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
            {proj.isExecutive ? 'Executive' : 'Non-Executive'}
          </span>
          <span>
            Accrued to date:&nbsp;
            <strong className="text-slate-800">{proj.accruedToDate.toFixed(2)} hrs</strong>
          </span>
          <span>
            Projected Dec 31:&nbsp;
            <strong className="text-slate-800">{proj.projectedYearEnd.toFixed(2)} hrs</strong>
          </span>
          <span>
            Yearly max:&nbsp;
            <strong className="text-slate-800">{proj.yearlyMax} hrs</strong>
          </span>
          <span>
            Current balance:&nbsp;
            <strong className={proj.currentBalance < 0 ? 'text-red-600' : 'text-slate-800'}>
              {proj.currentBalance.toFixed(2)} hrs
            </strong>
          </span>
          {overCurrentBalance && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold">
              ⚠ {Math.abs(balanceAfterApproval).toFixed(2)} hrs over current balance if approved — payroll flag
            </span>
          )}
          {!overCurrentBalance && overYearEnd && (
            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-semibold">
              ⚠ {Math.abs(yearEndAfterApproval).toFixed(2)} hrs over year-end projection if approved — payroll flag
            </span>
          )}
        </div>
      </td>
    </tr>
  )
}

export default async function AdminPTOPage() {
  const supabase = createServiceClient()
  const { data: requests } = await supabase
    .from('pto_requests')
    .select('*, profiles(full_name, real_email, employee_type, start_date, pto_carryover_hours)')
    .order('created_at', { ascending: false })

  const pending = requests?.filter(r => r.status === 'pending') ?? []
  const resolved = requests?.filter(r => r.status !== 'pending') ?? []

  // Sum approved hours per employee (used to compute accurate PTO balance)
  const approvedHoursByEmployee: Record<string, number> = {}
  for (const r of requests ?? []) {
    if (r.status === 'approved') {
      approvedHoursByEmployee[r.employee_id] =
        (approvedHoursByEmployee[r.employee_id] ?? 0) + (r.hours_requested ?? r.days_requested ?? 0)
    }
  }

  // Compute year-end projections for each unique employee with pending requests
  const today = new Date()
  const projections: Record<string, PTOYearEndProjection> = {}
  for (const r of pending) {
    if (projections[r.employee_id]) continue
    const p = r.profiles
    if (!p?.start_date) continue
    projections[r.employee_id] = getYearEndProjection(
      (p.employee_type ?? 'non_executive') as EmployeeType,
      new Date(p.start_date),
      p.pto_carryover_hours ?? 0,
      approvedHoursByEmployee[r.employee_id] ?? 0,
      today
    )
  }

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
          <tbody className="divide-y divide-slate-100">
            {pending.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-400">No pending PTO requests.</td></tr>
            )}
            {pending.map((r: any) => {
              const requestHours = r.hours_requested ?? r.days_requested ?? 0
              const proj = projections[r.employee_id]
              return (
                <React.Fragment key={r.id}>
                  <tr className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800 whitespace-nowrap">{r.profiles?.full_name}</td>
                    <td className="px-5 py-3"><CategoryBadge category={r.leave_category} /></td>
                    <td className="px-5 py-3 text-slate-600 whitespace-nowrap">{r.start_date}</td>
                    <td className="px-5 py-3 text-slate-600 whitespace-nowrap">{r.end_date}</td>
                    <td className="px-5 py-3 text-slate-600">{requestHours.toFixed(2)}</td>
                    <td className="px-5 py-3 text-slate-500 max-w-xs truncate">{r.reason || '—'}</td>
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <PTOActions id={r.id} employeeEmail={r.profiles?.real_email} employeeName={r.profiles?.full_name} employeeId={r.employee_id} />
                    </td>
                  </tr>
                  {proj && <PTOSnapshotRow proj={proj} requestHours={requestHours} />}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <h3 className="font-semibold text-slate-600 mb-3">History</h3>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Employee', 'Type', 'From', 'To', 'Hours', 'Status', 'Reviewed By', 'Submitted'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-slate-600 font-semibold text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {resolved.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-400">No history yet.</td></tr>
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
                <td className="px-5 py-3 whitespace-nowrap">
                  {r.reviewed_by ? (
                    <span className="text-slate-700 text-xs">
                      {r.reviewed_by}
                      {r.reviewed_at && <span className="text-slate-400 ml-1">· {new Date(r.reviewed_at).toLocaleDateString()}</span>}
                    </span>
                  ) : <span className="text-slate-400">—</span>}
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
