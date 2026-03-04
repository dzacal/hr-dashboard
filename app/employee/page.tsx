export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { calculatePTO } from '@/lib/pto'
import type { EmployeeType } from '@/lib/pto'

function fmt(hours: number) {
  const days = hours / 8
  return `${hours.toFixed(1)} hrs (${days % 1 === 0 ? days.toFixed(0) : days.toFixed(1)} days)`
}

export default async function EmployeeDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: ptoRequests } = await supabase
    .from('pto_requests')
    .select('*')
    .eq('employee_id', user!.id)
    .order('created_at', { ascending: false })

  const { data: remoteRequests } = await supabase
    .from('remote_requests')
    .select('*')
    .eq('employee_id', user!.id)
    .order('created_at', { ascending: false })

  const { data: messages } = await supabase
    .from('hr_messages')
    .select('*')
    .eq('employee_id', user!.id)
    .order('created_at', { ascending: false })

  const approvedUsedHours = ptoRequests
    ?.filter(r => r.status === 'approved')
    .reduce((s: number, r: any) => s + (r.hours_requested ?? r.days_requested ?? 0), 0) ?? 0

  const pendingHours = ptoRequests
    ?.filter(r => r.status === 'pending')
    .reduce((s: number, r: any) => s + (r.hours_requested ?? r.days_requested ?? 0), 0) ?? 0

  const pto = profile?.start_date
    ? calculatePTO(
        (profile.employee_type ?? 'non_executive') as EmployeeType,
        new Date(profile.start_date),
        profile.pto_carryover_hours ?? 0,
        approvedUsedHours
      )
    : null

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome, {profile?.full_name?.split(' ')[0]}!</h2>
      <p className="text-slate-500 mb-8">{profile?.position} · {profile?.department}</p>

      {/* PTO Balance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Available PTO', value: pto ? fmt(pto.currentBalance) : '—', color: 'text-green-600' },
          { label: 'Total Accrued', value: pto ? fmt(pto.currentYearAccrued) : '—', color: 'text-blue-600' },
          { label: 'Used', value: pto ? fmt(approvedUsedHours) : '—', color: 'text-slate-600' },
          { label: 'Pending', value: pto ? fmt(pendingHours) : '—', color: 'text-amber-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent PTO */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">Recent PTO Requests</h3>
            <a href="/employee/pto" className="text-xs text-blue-600 hover:underline">View all →</a>
          </div>
          {ptoRequests?.length === 0 && <p className="text-slate-400 text-sm">No PTO requests yet.</p>}
          <div className="space-y-3">
            {ptoRequests?.slice(0, 4).map((r: any) => {
              const hrs = r.hours_requested ?? r.days_requested ?? 0
              return (
                <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{r.start_date} → {r.end_date}</p>
                    <p className="text-xs text-slate-500">{fmt(hrs)}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    r.status === 'approved' ? 'bg-green-100 text-green-700' :
                    r.status === 'declined' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{r.status}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Remote */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">Recent Remote Requests</h3>
            <a href="/employee/remote" className="text-xs text-blue-600 hover:underline">View all →</a>
          </div>
          {remoteRequests?.length === 0 && <p className="text-slate-400 text-sm">No remote requests yet.</p>}
          <div className="space-y-3">
            {remoteRequests?.slice(0, 4).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-700">{r.start_date} → {r.end_date}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  r.status === 'approved' ? 'bg-green-100 text-green-700' :
                  r.status === 'declined' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">HR Messages</h3>
            <a href="/employee/messages" className="text-xs text-blue-600 hover:underline">Send message →</a>
          </div>
          {messages?.length === 0 && <p className="text-slate-400 text-sm">No messages sent yet.</p>}
          <div className="space-y-3">
            {messages?.slice(0, 3).map((m: any) => (
              <div key={m.id} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-slate-700">{m.subject}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    m.status === 'resolved' ? 'bg-green-100 text-green-700' :
                    m.status === 'read' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{m.status}</span>
                </div>
                {m.admin_reply && (
                  <p className="text-xs text-slate-500 mt-1">Reply: {m.admin_reply}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
