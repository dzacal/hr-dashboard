export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import AddEmployeeForm from './AddEmployeeForm'

export default async function EmployeesPage() {
  const supabase = await createClient()
  const { data: employees } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'employee')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Employees</h2>
        <AddEmployeeForm />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Name', 'Username', 'Email', 'Department', 'Position', 'Start Date', 'PTO Rate'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-slate-600 font-semibold text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {employees?.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">No employees yet. Add your first one above.</td></tr>
            )}
            {employees?.map((emp: any) => (
              <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 font-medium text-slate-800">{emp.full_name}</td>
                <td className="px-5 py-3 text-slate-600">{emp.username}</td>
                <td className="px-5 py-3 text-slate-600">{emp.real_email}</td>
                <td className="px-5 py-3 text-slate-600">{emp.department || '—'}</td>
                <td className="px-5 py-3 text-slate-600">{emp.position || '—'}</td>
                <td className="px-5 py-3 text-slate-600">{emp.start_date || '—'}</td>
                <td className="px-5 py-3 text-slate-600">{emp.pto_accrual_rate}/mo</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
