import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  // Verify the requester is an admin
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { full_name, username, real_email, company, department, position, start_date, employee_type, pto_carryover_hours, password } = body

  if (!full_name || !username || !real_email || !password || !start_date || !company) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  if (!['non_executive', 'executive'].includes(employee_type)) {
    return NextResponse.json({ error: 'Invalid employee type.' }, { status: 400 })
  }

  const carryover = Math.min(40, Math.max(0, parseFloat(pto_carryover_hours) || 0))

  // Use service role to create auth user
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Check username uniqueness
  const { data: existing } = await adminSupabase
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .single()

  if (existing) return NextResponse.json({ error: 'Username already taken.' }, { status: 400 })

  // Create auth user
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email: real_email,
    password,
    email_confirm: true,
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  // Insert profile
  const { error: profileError } = await adminSupabase.from('profiles').insert({
    id: authData.user.id,
    auth_email: real_email,
    real_email,
    username: username.toLowerCase(),
    full_name,
    role: 'employee',
    company: company || null,
    department: department || null,
    position: position || null,
    start_date,
    employee_type,
    pto_carryover_hours: carryover,
  })

  if (profileError) {
    // Rollback auth user
    await adminSupabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
