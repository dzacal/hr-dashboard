export interface Holiday {
  name: string
  date: Date
  dateStr: string // YYYY-MM-DD
}

function nthWeekday(year: number, month: number, weekday: number, nth: number): Date {
  // month is 1-based, weekday: 0=Sun,1=Mon,...,4=Thu
  const first = new Date(year, month - 1, 1)
  const firstWeekday = first.getDay()
  let day = 1 + ((weekday - firstWeekday + 7) % 7) + (nth - 1) * 7
  return new Date(year, month - 1, day)
}

function lastWeekday(year: number, month: number, weekday: number): Date {
  const last = new Date(year, month, 0) // last day of month
  const lastWeekday = last.getDay()
  const day = last.getDate() - ((lastWeekday - weekday + 7) % 7)
  return new Date(year, month - 1, day)
}

function fmt(d: Date): string {
  return d.toISOString().split('T')[0]
}

export function getHolidays(year: number): Holiday[] {
  const holidays: { name: string; date: Date }[] = [
    { name: "New Year's Day", date: new Date(year, 0, 1) },
    { name: 'Memorial Day', date: lastWeekday(year, 5, 1) }, // Last Monday of May
    { name: 'Juneteenth', date: new Date(year, 5, 19) },
    { name: 'Independence Day', date: new Date(year, 6, 4) },
    { name: 'Labor Day', date: nthWeekday(year, 9, 1, 1) }, // First Monday of September
    { name: 'National Indigenous Day (Columbus Day)', date: nthWeekday(year, 10, 1, 2) }, // Second Monday of October
    { name: 'Thanksgiving Day', date: nthWeekday(year, 11, 4, 4) }, // Fourth Thursday of November
    { name: 'Day after Thanksgiving', date: new Date(year, 10, nthWeekday(year, 11, 4, 4).getDate() + 1) },
    { name: 'Christmas Eve', date: new Date(year, 11, 24) },
    { name: 'Christmas Day', date: new Date(year, 11, 25) },
    { name: "New Year's Eve", date: new Date(year, 11, 31) },
  ]

  return holidays.map(h => ({ ...h, dateStr: fmt(h.date) }))
}
