// ============================================================
// PTO Calculation Engine
// Bi-weekly pay periods anchored to January 2, 2026
// ============================================================

export type EmployeeType = 'non_executive' | 'executive'

interface AccrualTier {
  minMonths: number
  maxMonths: number | null
  accrualPerPeriod: number // hours
  maxAccruedPerYear: number // hours
  accrualStopBalance: number // hours
  maxCarryover: number // hours
}

const NON_EXECUTIVE_TIERS: AccrualTier[] = [
  { minMonths: 0,  maxMonths: 35, accrualPerPeriod: 4.61, maxAccruedPerYear: 120, accrualStopBalance: 160, maxCarryover: 40 },
  { minMonths: 36, maxMonths: 59, accrualPerPeriod: 5.53, maxAccruedPerYear: 144, accrualStopBalance: 184, maxCarryover: 40 },
  { minMonths: 60, maxMonths: null, accrualPerPeriod: 6.15, maxAccruedPerYear: 160, accrualStopBalance: 200, maxCarryover: 40 },
]

const EXECUTIVE_TIERS: AccrualTier[] = [
  { minMonths: 0,  maxMonths: 35, accrualPerPeriod: 6.15, maxAccruedPerYear: 160, accrualStopBalance: 200, maxCarryover: 40 },
  { minMonths: 36, maxMonths: 59, accrualPerPeriod: 7.07, maxAccruedPerYear: 176, accrualStopBalance: 216, maxCarryover: 40 },
  { minMonths: 60, maxMonths: null, accrualPerPeriod: 7.69, maxAccruedPerYear: 200, accrualStopBalance: 240, maxCarryover: 40 },
]

export function getTier(employeeType: EmployeeType, monthsOfService: number): AccrualTier {
  const tiers = employeeType === 'executive' ? EXECUTIVE_TIERS : NON_EXECUTIVE_TIERS
  return tiers.find(t => monthsOfService >= t.minMonths && (t.maxMonths === null || monthsOfService <= t.maxMonths))!
}

// Bi-weekly pay dates anchored to January 2, 2026 (first pay period of the year).
// Going forwards: Jan 16, Jan 30, Feb 13, Feb 27, Mar 13, ...
const ANCHOR_DATE = new Date('2026-01-02')
const PAY_PERIOD_DAYS = 14

export function getPayPeriodDates(fromDate: Date, toDate: Date): Date[] {
  // Find the first pay date on or after fromDate
  const anchor = new Date(ANCHOR_DATE)
  const from = new Date(fromDate)
  const to = new Date(toDate)

  // Calculate offset from anchor to find the first pay date >= fromDate
  const diffMs = from.getTime() - anchor.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const periodsBack = Math.ceil(-diffDays / PAY_PERIOD_DAYS)

  // Start from a pay date before or at fromDate
  const startDate = new Date(anchor)
  startDate.setDate(startDate.getDate() - periodsBack * PAY_PERIOD_DAYS)

  const dates: Date[] = []
  const current = new Date(startDate)

  // Ensure we start on or after fromDate
  while (current < from) {
    current.setDate(current.getDate() + PAY_PERIOD_DAYS)
  }

  while (current <= to) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + PAY_PERIOD_DAYS)
  }

  return dates
}

function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
}

export interface PTOYearEndProjection {
  accruedToDate: number           // carryover + current year accrued as of today
  projectedYearEnd: number        // carryover + projected full-year accrual by Dec 31
  currentBalance: number          // what the employee has right now (accrued - used)
  yearEndBalance: number          // projected balance at Dec 31 (same usage assumed)
  yearlyMax: number               // policy max hours/year for their tier
  isExecutive: boolean
}

export function getYearEndProjection(
  employeeType: EmployeeType,
  hireDate: Date,
  carryoverHours: number,
  approvedUsedHours: number,
  referenceDate: Date = new Date()
): PTOYearEndProjection {
  const yearEnd = new Date(referenceDate.getFullYear(), 11, 31)
  const todayCalc = calculatePTO(employeeType, hireDate, carryoverHours, approvedUsedHours, referenceDate)
  const yearEndCalc = calculatePTO(employeeType, hireDate, carryoverHours, approvedUsedHours, yearEnd)
  return {
    accruedToDate: Math.round((todayCalc.carryoverHours + todayCalc.currentYearAccrued) * 100) / 100,
    projectedYearEnd: Math.round((yearEndCalc.carryoverHours + yearEndCalc.currentYearAccrued) * 100) / 100,
    currentBalance: todayCalc.currentBalance,
    yearEndBalance: yearEndCalc.currentBalance,
    yearlyMax: todayCalc.currentTier.maxAccruedPerYear,
    isExecutive: employeeType === 'executive',
  }
}

export interface PTOCalculation {
  carryoverHours: number         // prior year carryover (manually set)
  currentYearAccrued: number     // accrued this calendar year
  totalUsedHours: number         // approved PTO used
  currentBalance: number         // carryover + accrued - used
  accrualStopBalance: number     // current tier stop balance
  currentTier: AccrualTier
  monthsOfService: number
  eligibleToUse: boolean         // 90+ days employed
  nextAccrualDate: Date | null
  nextAccrualAmount: number
}

export function calculatePTO(
  employeeType: EmployeeType,
  hireDate: Date,
  carryoverHours: number,
  approvedUsedHours: number,
  referenceDate: Date = new Date()
): PTOCalculation {
  const monthsOfService = Math.max(0, monthsBetween(hireDate, referenceDate))
  const currentTier = getTier(employeeType, monthsOfService)
  const eligibleToUse = (referenceDate.getTime() - hireDate.getTime()) >= (90 * 24 * 60 * 60 * 1000)

  // Current year start (Jan 1 of reference year)
  const yearStart = new Date(referenceDate.getFullYear(), 0, 1)

  // Accrual start = max(hire date, year start) — accrual begins at hire date
  const accrualFrom = hireDate > yearStart ? hireDate : yearStart

  // Pay periods that have passed this year (up to and including referenceDate)
  const passedPayPeriods = getPayPeriodDates(accrualFrom, referenceDate)

  // Calculate accrual per pay period (may cross tier boundaries within the year)
  let currentYearAccrued = 0
  let runningBalance = carryoverHours - approvedUsedHours // start with carryover minus any used

  for (const payDate of passedPayPeriods) {
    const monthsAtPayDate = Math.max(0, monthsBetween(hireDate, payDate))
    const tier = getTier(employeeType, monthsAtPayDate)

    // Stop accrual if balance would exceed stop balance
    if (runningBalance + currentYearAccrued + tier.accrualPerPeriod > tier.accrualStopBalance) {
      const remaining = Math.max(0, tier.accrualStopBalance - (runningBalance + currentYearAccrued))
      currentYearAccrued += remaining
      break
    }

    currentYearAccrued += tier.accrualPerPeriod
  }

  const currentBalance = Math.max(0, carryoverHours + currentYearAccrued - approvedUsedHours)

  // Next accrual date: first pay date after referenceDate
  const futureDates = getPayPeriodDates(
    new Date(referenceDate.getTime() + 24 * 60 * 60 * 1000),
    new Date(referenceDate.getTime() + PAY_PERIOD_DAYS * 24 * 60 * 60 * 1000)
  )
  const nextAccrualDate = futureDates[0] ?? null
  const nextAccrualAmount = currentBalance < currentTier.accrualStopBalance ? currentTier.accrualPerPeriod : 0

  return {
    carryoverHours: Math.round(carryoverHours * 100) / 100,
    currentYearAccrued: Math.round(currentYearAccrued * 100) / 100,
    totalUsedHours: Math.round(approvedUsedHours * 100) / 100,
    currentBalance: Math.round(currentBalance * 100) / 100,
    accrualStopBalance: currentTier.accrualStopBalance,
    currentTier,
    monthsOfService,
    eligibleToUse,
    nextAccrualDate,
    nextAccrualAmount: Math.round(nextAccrualAmount * 100) / 100,
  }
}
