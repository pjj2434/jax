// app/api/contact/route.ts
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { z } from 'zod'

const formSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  service: z.enum(['linkedin-optimization', 'resume-review', 'resume-writing']),
  message: z.string().min(10),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const validatedFields = formSchema.safeParse(body)
    
    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'Invalid form data' },
        { status: 400 }
      )
    }

    const { name, email, phone, service, message } = validatedFields.data

    // Create a more readable service name
    const serviceNames = {
      'linkedin-optimization': 'LinkedIn Profile Optimization',
      'resume-review': 'Resume Review',
      'resume-writing': 'Resume Writing'
    }
    const readableService = serviceNames[service]

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    // Email content for the customer
    const customerMailOptions = {
      from: process.env.SMTP_USER, // Host email as sender
      to: email, // Customer's email from the form
      bcc: process.env.SMTP_USER, // BCC to host email
      subject: `Thank you for contacting us, ${name}!`,
      text: `
        Dear ${name},

        Thank you for reaching out to us. We have received your message and will get back to you shortly.

        Here's a copy of your message:

        Phone: ${phone}
        Service Requested: ${readableService}
        Message: ${message}

        Best regards,
        First Impressions Resume Writing
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #44067F;">Thank You for Contacting Us</h2>
          <p>Dear ${name},</p>
          <p>Thank you for reaching out to us. We have received your message and will get back to you shortly.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #44067F; margin-top: 0;">Your Message Details:</h3>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Service Requested:</strong> ${readableService}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>

          <p>Best regards,<br>First Impressions Resume Writing</p>
        </div>
      `,
    }

    // Send email
    await transporter.sendMail(customerMailOptions)

    return NextResponse.json(
      { message: 'Email sent successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Failed to send email:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
