export const dynamic = 'force-dynamic'

import { getHolidays } from '@/lib/holidays'

export default function EmployeeHolidaysPage() {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const year = today.getFullYear()
  const holidays = getHolidays(year)

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Company Holidays</h2>
      <p className="text-slate-500 mb-8">{year} observed holidays — offices are closed on these days.</p>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 max-w-2xl">
        <div className="space-y-1">
          {holidays.map((h, i) => {
            const isPast = h.dateStr < todayStr
            const isToday = h.dateStr === todayStr
            const displayDate = h.date.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })

            return (
              <div
                key={i}
                className={`flex items-center justify-between px-4 py-3 rounded-lg ${
                  isToday
                    ? 'bg-green-50 border border-green-200'
                    : isPast
                    ? 'opacity-50'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div>
                  <p className={`font-medium text-sm ${isPast && !isToday ? 'text-slate-400' : 'text-slate-800'}`}>
                    {h.name}
                    {isToday && (
                      <span className="ml-2 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </p>
                  <p className={`text-xs mt-0.5 ${isPast && !isToday ? 'text-slate-300' : 'text-slate-500'}`}>
                    {displayDate}
                  </p>
                </div>
                {!isPast && !isToday && (
                  <span className="text-xs text-slate-400 font-medium">
                    {Math.ceil((h.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days away
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
