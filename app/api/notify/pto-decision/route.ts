import { NextRequest, NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  try {
    const { employeeEmail, employeeName, status, type, employeeId } = await req.json()

    // Write in-app notification for the employee
    if (employeeId) {
      const supabase = createServiceClient()
      const isRemote = type === 'Remote Work'
      await supabase.from('notifications').insert({
        user_id: employeeId,
        type: isRemote ? 'remote_decision' : 'pto_decision',
        title: `Your ${type} request was ${status}`,
        body: null,
        link: isRemote ? '/employee/remote' : '/employee/pto',
      })
    }

    if (!employeeEmail || !process.env.SENDGRID_API_KEY) return NextResponse.json({ ok: true })

    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    await sgMail.send({
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
