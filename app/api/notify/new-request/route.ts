import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const { adminEmail, type, days, start, end } = await req.json()
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
    console.error('Email error:', e)
  }

  return NextResponse.json({ ok: true })
}
