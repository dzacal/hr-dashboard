import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  try {
    const { employee_id, start_date, end_date, hours_requested, leave_category, reason, reviewed_by } = await req.json()

    if (!employee_id || !start_date || !end_date || !hours_requested) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { error } = await supabase.from('pto_requests').insert({
      employee_id,
      start_date,
      end_date,
      hours_requested: Number(hours_requested),
      leave_category: leave_category ?? 'vacation',
      reason: reason ?? null,
      status: 'approved',
      reviewed_by: reviewed_by ?? 'Admin (Historical)',
      reviewed_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Backfill PTO error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Backfill PTO error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
