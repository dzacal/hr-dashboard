import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  try {
    const { employee_id, start_date, end_date, reason, reviewed_by } = await req.json()

    if (!employee_id || !start_date || !end_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { error } = await supabase.from('remote_requests').insert({
      employee_id,
      start_date,
      end_date,
      reason: reason ?? null,
      status: 'approved',
      reviewed_by: reviewed_by ?? 'Admin (Historical)',
      reviewed_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Backfill Remote error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Backfill Remote error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
