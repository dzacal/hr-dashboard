import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  try {
    const { adminEmail, subject, employeeName } = await req.json()

    // Write in-app notifications for all admins
    const supabase = createServiceClient()
    const { data: admins } = await supabase
      .from('profiles')
      .select('id, real_email')
      .in('role', ['admin', 'both'])
      .eq('is_active', true)

    console.log('[hr-message] admins found:', admins?.length, admins?.map((a: any) => ({ id: a.id, real_email: a.real_email })))

    if (admins && admins.length > 0) {
      await supabase.from('notifications').insert(
        admins.map((a: any) => ({
          user_id: a.id,
          type: 'hr_message',
          title: 'New HR Message',
          body: [employeeName, subject].filter(Boolean).join(': '),
          link: '/admin/messages',
        }))
      )
    }

    let adminEmails = (admins ?? [])
      .map((a: any) => a.real_email)
      .filter(Boolean) as string[]

    // Fallback: resolve emails from auth.users if real_email is missing
    if (adminEmails.length === 0 && admins && admins.length > 0) {
      console.log('[hr-message] real_email missing for admins, falling back to auth.users')
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const adminIds = new Set(admins.map((a: any) => a.id))
      adminEmails = users
        .filter((u) => adminIds.has(u.id) && u.email)
        .map((u) => u.email!)
      console.log('[hr-message] fallback emails:', adminEmails)
    }

    console.log('[hr-message] sending to:', adminEmails, '| RESEND_API_KEY set:', !!process.env.RESEND_API_KEY)

    if (adminEmails.length === 0 || !process.env.RESEND_API_KEY) return NextResponse.json({ ok: true })

    const resend = new Resend(process.env.RESEND_API_KEY)
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: adminEmails,
      subject: `New HR Message: ${subject}`,
      html: `
        <p>An employee has sent a new HR message.</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p>Log in to the HR Portal to read and reply.</p>
      `,
    })
    console.log('[hr-message] Resend result:', JSON.stringify(result))
  } catch (e) {
    console.error('[hr-message] Notify error:', e)
  }

  return NextResponse.json({ ok: true })
}
