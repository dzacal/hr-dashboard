export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { calculatePTO, getTier } from '@/lib/pto'
import type { EmployeeType } from '@/lib/pto'
import AddEmployeeForm from './AddEmployeeForm'

function formatEmployeeType(type: string) {
  return type === 'executive' ? 'Executive' : 'Non-Executive'
}

export default async function EmployeesPage() {
  const supabase = await createClient()

  const { data: employees } = await supabase
    .from('profiles')
    .select('*, pto_requests(hours_requested, status)')
    .eq('role', 'employee')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Employees</h2>
        <AddEmployeeForm />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Name', 'Username', 'Department', 'Position', 'Hire Date', 'Type', 'Months', 'PTO Balance', 'Accrual Rate', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-slate-600 font-semibold text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {employees?.length === 0 && (
              <tr><td colSpan={10} className="px-5 py-8 text-center text-slate-400">No employees yet. Add your first one above.</td></tr>
            )}
            {employees?.map((emp: any) => {
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

              return (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{emp.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{emp.username}</td>
                  <td className="px-4 py-3 text-slate-600">{emp.department || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{emp.position || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{emp.start_date || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                      emp.employee_type === 'executive'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {formatEmployeeType(emp.employee_type ?? 'non_executive')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{pto?.monthsOfService ?? '—'}</td>
                  <td className="px-4 py-3">
                    {pto ? (
                      <span className={`font-semibold ${pto.currentBalance >= pto.accrualStopBalance ? 'text-amber-600' : 'text-green-600'}`}>
                        {pto.currentBalance.toFixed(2)} hrs
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {tier ? `${tier.accrualPerPeriod} hrs/period` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <a href={`/admin/employees/${emp.id}`} className="text-xs text-blue-600 hover:underline whitespace-nowrap">View →</a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
