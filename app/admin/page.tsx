export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/service'
import { calculatePTO } from '@/lib/pto'
import type { EmployeeType } from '@/lib/pto'
import { getHolidays } from '@/lib/holidays'

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
  bereavement: 'bg-slate-200 text-slate-700',
  personal: 'bg-violet-100 text-violet-700',
  other: 'bg-gray-100 text-gray-700',
}

function getAnniversaries(employees: any[]) {
  const now = new Date()
  const todayMonth = now.getMonth() + 1
  const todayDay = now.getDate()
  const todayYear = now.getFullYear()
  return employees
    .filter(emp => {
      if (!emp.start_date) return false
      const [sy, sm, sd] = (emp.start_date as string).split('-').map(Number)
      return sm === todayMonth && sd === todayDay && sy < todayYear
    })
    .map(emp => ({
      ...emp,
      years: todayYear - Number(emp.start_date.split('-')[0]),
    }))
}

export default async function AdminDashboard() {
  const supabase = createServiceClient()

  const today = new Date().toISOString().split('T')[0]

  const [
    { data: employees },
    { data: ptoPending },
    { data: remotePending },
    { data: messages },
    { data: allPtoRequests },
    { data: todayPTO },
    { data: todayRemote },
  ] = await Promise.all([
    supabase.from('profiles').select('*, pto_requests(hours_requested, status)').eq('role', 'employee').eq('is_active', true),
    supabase.from('pto_requests').select('*, profiles(full_name)').eq('status', 'pending'),
    supabase.from('remote_requests').select('*, profiles(full_name)').eq('status', 'pending'),
    supabase.from('hr_messages').select('*, profiles(full_name)').eq('status', 'unread').order('created_at', { ascending: false }),
    supabase.from('pto_requests').select('employee_id, hours_requested, status'),
    supabase.from('pto_requests').select('*, profiles(full_name)').eq('status', 'approved').lte('start_date', today).gte('end_date', today),
    supabase.from('remote_requests').select('*, profiles(full_name)').eq('status', 'approved').lte('start_date', today).gte('end_date', today),
  ])

  const anniversaryEmployees = getAnniversaries(employees ?? [])

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
    { label: 'Active Employees', value: employees?.length ?? 0, color: 'bg-blue-500' },
    { label: 'Pending PTO', value: ptoPending?.length ?? 0, color: 'bg-amber-500' },
    { label: 'Pending Remote', value: remotePending?.length ?? 0, color: 'bg-purple-500' },
    { label: 'Unread Messages', value: messages?.length ?? 0, color: 'bg-rose-500' },
  ]

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const todayHoliday = getHolidays(new Date().getFullYear()).find(h => h.dateStr === today)

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

      {/* Today at a Glance */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-700">Today at a Glance</h3>
          <span className="text-xs text-slate-400 font-medium">{todayLabel}</span>
        </div>

        {todayHoliday && (
          <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="text-lg">🗓️</span>
            <p className="text-sm font-medium text-amber-800">Today is <span className="font-semibold">{todayHoliday.name}</span> — a company holiday.</p>
          </div>
        )}

        {anniversaryEmployees.length > 0 && (
          <div className="mb-4 px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">🎉 Work Anniversaries Today</p>
            <div className="space-y-1.5">
              {anniversaryEmployees.map(emp => (
                <div key={emp.id} className="flex items-center justify-between">
                  <p className="text-sm font-medium text-amber-900">{emp.full_name}</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                    {emp.years} year{emp.years !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(todayPTO?.length ?? 0) === 0 && (todayRemote?.length ?? 0) === 0 ? (
          <p className="text-slate-400 text-sm">{todayHoliday ? 'No additional leave or remote activity.' : 'All employees are in the office today.'}</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {/* On PTO */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Out on Leave ({todayPTO?.length ?? 0})
              </p>
              {(todayPTO?.length ?? 0) === 0 ? (
                <p className="text-sm text-slate-400">No one on leave today.</p>
              ) : (
                <div className="space-y-2">
                  {todayPTO?.map((r: any) => {
                    const catKey = r.leave_category ?? 'vacation'
                    return (
                      <div key={r.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{r.profiles?.full_name}</p>
                          <p className="text-xs text-slate-400">thru {r.end_date}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${CATEGORY_COLORS[catKey] ?? 'bg-gray-100 text-gray-700'}`}>
                          {CATEGORY_LABELS[catKey] ?? catKey}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Working Remote */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Working Remote ({todayRemote?.length ?? 0})
              </p>
              {(todayRemote?.length ?? 0) === 0 ? (
                <p className="text-sm text-slate-400">No one working remote today.</p>
              ) : (
                <div className="space-y-2">
                  {todayRemote?.map((r: any) => (
                    <div key={r.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{r.profiles?.full_name}</p>
                        <p className="text-xs text-slate-400">thru {r.end_date}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 whitespace-nowrap">
                        Remote
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
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
