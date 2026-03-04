export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { calculatePTO } from '@/lib/pto'
import type { EmployeeType } from '@/lib/pto'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { data: employees },
    { data: ptoPending },
    { data: remotePending },
    { data: messages },
    { data: allPtoRequests },
  ] = await Promise.all([
    supabase.from('profiles').select('*, pto_requests(hours_requested, status)').eq('role', 'employee'),
    supabase.from('pto_requests').select('*, profiles(full_name)').eq('status', 'pending'),
    supabase.from('remote_requests').select('*, profiles(full_name)').eq('status', 'pending'),
    supabase.from('hr_messages').select('*, profiles(full_name)').eq('status', 'unread').order('created_at', { ascending: false }),
    supabase.from('pto_requests').select('employee_id, hours_requested, status'),
  ])

  // Build a map of used hours per employee
  const usedHoursMap: Record<string, number> = {}
  for (const r of allPtoRequests ?? []) {
    if (r.status === 'approved') {
      usedHoursMap[r.employee_id] = (usedHoursMap[r.employee_id] ?? 0) + (r.hours_requested ?? 0)
    }
  }

  // Calculate total employees with low PTO (< 20 hrs)
  const lowPtoCount = employees?.filter(emp => {
    if (!emp.start_date) return false
    const pto = calculatePTO(
      (emp.employee_type ?? 'non_executive') as EmployeeType,
      new Date(emp.start_date),
      emp.pto_carryover_hours ?? 0,
      usedHoursMap[emp.id] ?? 0
    )
    return pto.currentBalance < 20
  }).length ?? 0

  const stats = [
    { label: 'Total Employees', value: employees?.length ?? 0, color: 'bg-blue-500' },
    { label: 'Pending PTO', value: ptoPending?.length ?? 0, color: 'bg-amber-500' },
    { label: 'Pending Remote', value: remotePending?.length ?? 0, color: 'bg-purple-500' },
    { label: 'Unread Messages', value: messages?.length ?? 0, color: 'bg-rose-500' },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Overview</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className={`w-10 h-10 ${color} rounded-lg mb-3`} />
            <p className="text-3xl font-bold text-slate-800">{value}</p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending PTO */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-700 mb-4">Pending PTO Requests</h3>
          {ptoPending?.length === 0 && <p className="text-slate-400 text-sm">No pending requests.</p>}
          <div className="space-y-3">
            {ptoPending?.slice(0, 5).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800 text-sm">{r.profiles?.full_name}</p>
                  <p className="text-xs text-slate-500">{r.start_date} → {r.end_date} ({(r.hours_requested ?? r.days_requested ?? 0).toFixed(1)} hrs)</p>
                </div>
                <a href="/admin/pto" className="text-xs text-blue-600 hover:underline">Review</a>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Remote */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-700 mb-4">Pending Remote Requests</h3>
          {remotePending?.length === 0 && <p className="text-slate-400 text-sm">No pending requests.</p>}
          <div className="space-y-3">
            {remotePending?.slice(0, 5).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800 text-sm">{r.profiles?.full_name}</p>
                  <p className="text-xs text-slate-500">{r.start_date} → {r.end_date}</p>
                </div>
                <a href="/admin/remote" className="text-xs text-blue-600 hover:underline">Review</a>
              </div>
            ))}
          </div>
        </div>

        {/* Recent HR Messages */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 lg:col-span-2">
          <h3 className="font-semibold text-slate-700 mb-4">Unread HR Messages</h3>
          {messages?.length === 0 && <p className="text-slate-400 text-sm">No unread messages.</p>}
          <div className="space-y-3">
            {messages?.slice(0, 5).map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800 text-sm">{m.profiles?.full_name} — {m.subject}</p>
                  <p className="text-xs text-slate-500 truncate max-w-md">{m.message}</p>
                </div>
                <a href="/admin/messages" className="text-xs text-blue-600 hover:underline">View</a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
