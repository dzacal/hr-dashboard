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

    const adminEmails = (admins ?? [])
      .map((a: any) => a.real_email)
      .filter(Boolean) as string[]

    if (adminEmails.length === 0 || !process.env.RESEND_API_KEY) return NextResponse.json({ ok: true })

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: adminEmails,
      subject: `New HR Message: ${subject}`,
      html: `
        <p>An employee has sent a new HR message.</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p>Log in to the HR Portal to read and reply.</p>
      `,
    })
  } catch (e) {
    console.error('Notify error:', e)
  }

  return NextResponse.json({ ok: true })
}
