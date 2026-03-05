import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  try {
    const { adminEmail, type, days, hours, start, end, employeeName, employeeId } = await req.json()

    // Write in-app notifications for all admins, excluding the requester themselves
    const supabase = createServiceClient()
    let adminsQuery = supabase
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'both'])
      .eq('is_active', true)

    if (employeeId) adminsQuery = adminsQuery.neq('id', employeeId)

    const { data: admins } = await adminsQuery

    if (admins && admins.length > 0) {
      const hoursVal = hours ?? days
      await supabase.from('notifications').insert(
        admins.map((a: any) => ({
          user_id: a.id,
          type: 'pto_request',
          title: `New ${type} Request`,
          body: [
            employeeName || null,
            start && end ? `${start} → ${end}` : null,
            hoursVal ? `${hoursVal} hrs` : null,
          ]
            .filter(Boolean)
            .join(' · '),
          link: '/admin/pto',
        }))
      )
    }

    if (!adminEmail || !process.env.RESEND_API_KEY) return NextResponse.json({ ok: true })

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: adminEmail,
      subject: `New ${type} Request`,
      html: `
        <p>A new <strong>${type}</strong> request has been submitted.</p>
        <p><strong>Dates:</strong> ${start} → ${end}</p>
        ${days ? `<p><strong>Days:</strong> ${days}</p>` : ''}
        <p>Please log in to the HR Portal to review and approve or decline.</p>
      `,
    })
  } catch (e) {
    console.error('Notify error:', e)
  }

  return NextResponse.json({ ok: true })
}
