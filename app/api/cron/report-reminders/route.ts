import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Get all active employees who have at least one management report link
  const { data: employees, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('role', ['employee', 'both'])
    .eq('is_active', true)
    .in(
      'id',
      (
        await supabase
          .from('management_report_links')
          .select('employee_id')
      ).data?.map((r: any) => r.employee_id) ?? []
    )

  if (error) {
    console.error('Cron error fetching employees:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!employees || employees.length === 0) {
    return NextResponse.json({ ok: true, notified: 0 })
  }

  // Determine which day it is to set the right message
  const now = new Date()
  const day = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/New_York' })
  const title = 'Reminder: Update Your Management Reports'
  const body = `It's ${day} — please make sure your management reports are up to date.`

  // Insert a notification for each employee
  const { error: insertError } = await supabase.from('notifications').insert(
    employees.map((emp: any) => ({
      user_id: emp.id,
      type: 'report_reminder',
      title,
      body,
      link: '/employee/reports',
    }))
  )

  if (insertError) {
    console.error('Cron error inserting notifications:', insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, notified: employees.length })
}
