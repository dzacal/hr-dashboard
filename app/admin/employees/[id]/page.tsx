export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/service'
import { calculatePTO, getTier } from '@/lib/pto'
import type { EmployeeType } from '@/lib/pto'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ResetPasswordButton from './ResetPasswordButton'
import EmployeeStatusToggle from './EmployeeStatusToggle'
import DeleteEmployeeButton from './DeleteEmployeeButton'
import RoleSelector from './RoleSelector'
import ManagementReportsAdmin from './ManagementReportsAdmin'

function row(label: string, value: string | null | undefined) {
  return (
    <div className="py-3 border-b border-slate-50 last:border-0 flex gap-4">
      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-48 shrink-0">{label}</dt>
      <dd className="text-sm text-slate-800">{value || <span className="text-slate-400">—</span>}</dd>
    </div>
  )
}

function fmtHrs(hours: number) {
  const days = hours / 8
  return { hrs: hours.toFixed(2), days: days % 1 === 0 ? days.toFixed(0) : days.toFixed(1) }
}

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()

  const [{ data: emp }, { data: reportLinks }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*, pto_requests(hours_requested, status)')
      .eq('id', id)
      .in('role', ['employee', 'admin', 'both'])
      .single(),
    supabase
      .from('management_report_links')
      .select('id, title, url')
      .eq('employee_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (!emp) notFound()

  const usedHours = emp.pto_requests
    ?.filter((r: any) => r.status === 'approved')
    .reduce((s: number, r: any) => s + (r.hours_requested ?? 0), 0) ?? 0

  const pto = emp.start_date
    ? calculatePTO(
        (emp.employee_type ?? 'non_executive') as EmployeeType,
        new Date(emp.start_date),
        emp.pto_carryover_hours ?? 0,
        usedHours
      )
    : null

  const tier = pto ? getTier((emp.employee_type ?? 'non_executive') as EmployeeType, pto.monthsOfService) : null
  const balance = pto ? fmtHrs(pto.currentBalance) : null

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/employees" className="text-slate-400 hover:text-slate-600 text-sm">← Employees</Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{emp.full_name}</h2>
          <p className="text-slate-500 mt-1">{emp.position || '—'} · {emp.department || '—'}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {emp.is_active === false && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Inactive</span>
          )}
          <EmployeeStatusToggle employeeId={emp.id} isActive={emp.is_active !== false} />
          <ResetPasswordButton employeeId={emp.id} employeeName={emp.full_name} />
          <DeleteEmployeeButton employeeId={emp.id} employeeName={emp.full_name} />
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            emp.employee_type === 'executive' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {emp.employee_type === 'executive' ? 'Executive' : 'Non-Executive'}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">PTO Balance</p>
          <p className={`text-2xl font-bold ${pto && pto.currentBalance >= pto.accrualStopBalance ? 'text-amber-600' : 'text-green-600'}`}>
            {balance ? `${balance.hrs} hrs` : '—'}
          </p>
          {balance && <p className="text-xs text-slate-400 mt-0.5">{balance.days} days</p>}
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Accrual Rate</p>
          <p className="text-2xl font-bold text-slate-800">{tier ? `${tier.accrualPerPeriod} hrs` : '—'}</p>
          <p className="text-xs text-slate-400">per pay period</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Tenure</p>
          <p className="text-2xl font-bold text-slate-800">{pto ? `${pto.monthsOfService} mo` : '—'}</p>
          <p className="text-xs text-slate-400">months of service</p>
        </div>
      </div>

      {/* Portal Access */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
        <RoleSelector employeeId={emp.id} currentRole={emp.role} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Employment Details */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-700 mb-4">Employment Details</h3>
          <dl>
            {row('Username', emp.username)}
            {row('Hire Date', emp.start_date)}
            {row('Department', emp.department)}
            {row('Position', emp.position)}
            {row('PTO Carryover', emp.pto_carryover_hours != null ? `${emp.pto_carryover_hours} hrs` : null)}
          </dl>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-700 mb-4">Personal Information</h3>
          <dl>
            {row('Birthday', emp.birthday)}
            {row('Cell Phone', emp.cell_phone)}
          </dl>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 lg:col-span-2">
          <h3 className="font-semibold text-slate-700 mb-4">Emergency Contact</h3>
          <dl className="grid grid-cols-3 gap-x-6">
            {row('Name', emp.emergency_contact_name)}
            {row('Phone', emp.emergency_contact_phone)}
            {row('Relationship', emp.emergency_contact_relationship)}
          </dl>
        </div>

        {/* Management Reports */}
        <ManagementReportsAdmin
          employeeId={emp.id}
          initialLinks={reportLinks ?? []}
        />
      </div>
    </div>
  )
}
