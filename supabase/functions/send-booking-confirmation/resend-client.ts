// Resend Email Client (HTTP-based, works with Supabase Edge Functions)
// Unlike SMTP, Resend uses HTTP API which is not blocked by Supabase

export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: {
    name: string
    email: string
  }
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; message?: string; error?: string }> {
  // Get Resend API key from environment
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  const DEFAULT_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@yourverifieddomain.com'
  const DEFAULT_FROM_NAME = Deno.env.get('RESEND_FROM_NAME') || 'Ofcoz Family'

  // Validate API key
  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not configured')
    return { success: false, error: 'Resend API key not configured' }
  }

  console.log('📧 Resend Configuration:', {
    from: options.from?.email || DEFAULT_FROM_EMAIL,
    hasApiKey: !!RESEND_API_KEY,
  })

  try {
    const fromEmail = options.from?.email || DEFAULT_FROM_EMAIL
    const fromName = options.from?.name || DEFAULT_FROM_NAME

    console.log('📧 Sending email via Resend:', {
      from: `${fromName} <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      hasHtml: !!options.html,
    })

    // Call Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [options.to],
        subject: options.subject,
        html: options.html,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Resend API error:', result)
      return {
        success: false,
        error: result.message || `Resend API error: ${response.status}`,
      }
    }

    console.log('✅ Email sent successfully via Resend:', result.id)
    return {
      success: true,
      message: `Email sent successfully (ID: ${result.id})`,
    }

  } catch (error) {
    console.error('❌ Error sending email via Resend:', error)
    return {
      success: false,
      error: error?.message || String(error) || 'Failed to send email',
    }
  }
}
