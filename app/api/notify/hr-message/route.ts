import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const { adminEmail, subject } = await req.json()
    if (!adminEmail || !process.env.RESEND_API_KEY) return NextResponse.json({ ok: true })

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: adminEmail,
      subject: `New HR Message: ${subject}`,
      html: `
        <p>An employee has sent a new HR message.</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p>Log in to the HR Portal to read and reply.</p>
      `,
    })
  } catch (e) {
    console.error('Email error:', e)
  }

  return NextResponse.json({ ok: true })
}
