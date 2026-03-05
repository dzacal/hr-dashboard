import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  try {
    const { employeeEmail, employeeName, status, type, employeeId } = await req.json()

    // Write in-app notification for the employee
    if (employeeId) {
      const supabase = createServiceClient()
      await supabase.from('notifications').insert({
        user_id: employeeId,
        type: 'pto_decision',
        title: `Your ${type} request was ${status}`,
        body: null,
        link: '/employee/pto',
      })
    }

    if (!employeeEmail || !process.env.RESEND_API_KEY) return NextResponse.json({ ok: true })

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: employeeEmail,
      subject: `Your ${type} Request has been ${status}`,
      html: `
        <p>Hi ${employeeName},</p>
        <p>Your <strong>${type}</strong> request has been <strong>${status}</strong>.</p>
        <p>Log in to the HR Portal to view details.</p>
      `,
    })
  } catch (e) {
    console.error('Notify error:', e)
  }

  return NextResponse.json({ ok: true })
}
