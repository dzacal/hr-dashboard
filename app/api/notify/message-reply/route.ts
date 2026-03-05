import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  try {
    const { employeeEmail, employeeName, reply, employeeId } = await req.json()

    // Write in-app notification for the employee
    if (employeeId) {
      const supabase = createServiceClient()
      await supabase.from('notifications').insert({
        user_id: employeeId,
        type: 'hr_reply',
        title: 'HR replied to your message',
        body: reply?.substring(0, 120) ?? null,
        link: '/employee/messages',
      })
    }

    if (!employeeEmail || !process.env.RESEND_API_KEY) return NextResponse.json({ ok: true })

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: employeeEmail,
      subject: 'HR has replied to your message',
      html: `
        <p>Hi ${employeeName},</p>
        <p>HR has replied to your message:</p>
        <blockquote style="border-left: 4px solid #ccc; padding-left: 16px; color: #555;">${reply}</blockquote>
        <p>Log in to the HR Portal to view the full conversation.</p>
      `,
    })
  } catch (e) {
    console.error('Notify error:', e)
  }

  return NextResponse.json({ ok: true })
}
