import { NextRequest, NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  try {
    const { adminEmail, type, days, hours, start, end, employeeName, employeeId } = await req.json()

    const supabase = createServiceClient()

    // Fetch all active admins
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('id, real_email')
      .in('role', ['admin', 'both'])
      .eq('is_active', true)

    if (adminsError) {
      console.error('Failed to fetch admins:', adminsError)
    }

    // Filter out the requester if they have both role
    const recipients = (admins ?? []).filter(
      (a: { id: string }) => !employeeId || a.id !== employeeId
    )

    if (recipients.length > 0) {
      const hoursVal = hours ?? days
      const isRemote = type === 'Remote Work'
      const { error: insertError } = await supabase.from('notifications').insert(
        recipients.map((a: { id: string }) => ({
          user_id: a.id,
          type: isRemote ? 'remote_request' : 'pto_request',
          title: `New ${type} Request`,
          body: [
            employeeName || null,
            start && end ? `${start} → ${end}` : null,
            hoursVal ? `${hoursVal} hrs` : null,
          ]
            .filter(Boolean)
            .join(' · '),
          link: isRemote ? '/admin/remote' : '/admin/pto',
        }))
      )
      if (insertError) {
        console.error('Failed to insert notifications:', insertError)
      }
    } else {
      console.log('No admin recipients found for notification')
    }

    const adminEmails = recipients
      .map((a: { id: string; real_email?: string }) => a.real_email)
      .filter(Boolean) as string[]

    if (adminEmails.length === 0 || !process.env.SENDGRID_API_KEY) return NextResponse.json({ ok: true })

    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    await sgMail.send({
      from: process.env.EMAIL_FROM!,
      to: adminEmails,
      subject: `New ${type} Request`,
      html: `
        <p>A new <strong>${type}</strong> request has been submitted.</p>
        ${employeeName ? `<p><strong>Employee:</strong> ${employeeName}</p>` : ''}
        <p><strong>Dates:</strong> ${start} → ${end}</p>
        ${hours ? `<p><strong>Hours:</strong> ${hours}</p>` : ''}
        <p>Please log in to the HR Portal to review and approve or decline.</p>
      `,
    })
  } catch (e) {
    console.error('Notify error:', e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
