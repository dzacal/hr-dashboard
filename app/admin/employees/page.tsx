export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { calculatePTO, getTier } from '@/lib/pto'
import type { EmployeeType } from '@/lib/pto'
import AddEmployeeForm from './AddEmployeeForm'

function formatEmployeeType(type: string) {
  return type === 'executive' ? 'Executive' : 'Non-Executive'
}

function EmployeeTable({ employees, showPTO }: { employees: any[]; showPTO: boolean }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            {['Name', 'Username', 'Department', 'Position', 'Hire Date', 'Type', ...(showPTO ? ['Months', 'PTO Balance', 'Accrual Rate'] : []), ''].map(h => (
              <th key={h} className="text-left px-4 py-3 text-slate-600 font-semibold text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {employees.length === 0 && (
            <tr><td colSpan={showPTO ? 10 : 7} className="px-5 py-8 text-center text-slate-400">No employees.</td></tr>
          )}
          {employees.map((emp: any) => {
            const usedHours = emp.pto_requests
              ?.filter((r: any) => r.status === 'approved')
              .reduce((s: number, r: any) => s + (r.hours_requested ?? 0), 0) ?? 0

            const pto = showPTO && emp.start_date
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
                {showPTO && (
                  <>
                    <td className="px-4 py-3 text-slate-600">{pto?.monthsOfService ?? '—'}</td>
                    <td className="px-4 py-3">
                      {pto ? (
                        <span className={`font-semibold ${pto.currentBalance >= pto.accrualStopBalance ? 'text-amber-600' : 'text-green-600'}`}>
                          {pto.currentBalance.toFixed(2)} hrs
                          <span className="font-normal text-slate-400 ml-1">({(pto.currentBalance / 8).toFixed(1)} days)</span>
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {tier ? `${tier.accrualPerPeriod} hrs/period` : '—'}
                    </td>
                  </>
                )}
                <td className="px-4 py-3">
                  <a href={`/admin/employees/${emp.id}`} className="text-xs text-blue-600 hover:underline whitespace-nowrap">View →</a>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default async function EmployeesPage() {
  const supabase = await createClient()

  const { data: allEmployees } = await supabase
    .from('profiles')
    .select('*, pto_requests(hours_requested, status)')
    .in('role', ['employee', 'both'])
    .order('created_at', { ascending: false })

  const active = allEmployees?.filter(e => e.is_active !== false) ?? []
  const inactive = allEmployees?.filter(e => e.is_active === false) ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Employees</h2>
        <AddEmployeeForm />
      </div>

      <EmployeeTable employees={active} showPTO={true} />

      {inactive.length > 0 && (
        <div className="mt-10">
          <h3 className="text-base font-semibold text-slate-500 mb-3">
            Inactive / No Longer With Company ({inactive.length})
          </h3>
          <EmployeeTable employees={inactive} showPTO={false} />
        </div>
      )}
    </div>
  )
}
