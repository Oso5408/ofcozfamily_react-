// SMTP Client using standard SMTP protocol
// Compatible with any SMTP server (Gmail, Office365, custom SMTP, etc.)

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: {
    name: string
    email: string
  }
}

// Helper function to encode string to base64
function encodeBase64(str: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  return btoa(String.fromCharCode(...data));
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; message?: string; error?: string }> {
  // Get SMTP configuration from environment variables
  const SMTP_HOST = Deno.env.get('SMTP_HOST')
  const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '587')
  const SMTP_USER = Deno.env.get('SMTP_USER')
  const SMTP_PASS = Deno.env.get('SMTP_PASS')
  const SMTP_FROM_EMAIL = Deno.env.get('SMTP_FROM_EMAIL') || SMTP_USER
  const SMTP_FROM_NAME = Deno.env.get('SMTP_FROM_NAME') || 'Ofcoz Family'
  const SMTP_SECURE = Deno.env.get('SMTP_SECURE') === 'true' // true for port 465, false for 587

  // Validate required configuration
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error('❌ SMTP not configured. Missing: SMTP_HOST, SMTP_USER, or SMTP_PASS')
    return { success: false, error: 'SMTP server not configured' }
  }

  console.log('📧 SMTP Configuration:', {
    host: SMTP_HOST,
    port: SMTP_PORT,
    user: SMTP_USER,
    secure: SMTP_SECURE,
    from: SMTP_FROM_EMAIL,
  })

  try {
    // Create SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: SMTP_SECURE,
        auth: {
          username: SMTP_USER,
          password: SMTP_PASS,
        },
      },
    });

    console.log('📨 Connecting to SMTP server...')

    // Validate email fields before sending
    const fromEmail = options.from?.email || SMTP_FROM_EMAIL;
    const toEmail = options.to;
    const emailSubject = options.subject;
    const emailHtml = options.html;

    console.log('📧 Email fields:', {
      from: fromEmail,
      to: toEmail,
      subject: emailSubject,
      hasHtml: !!emailHtml,
      htmlLength: emailHtml?.length || 0
    });

    // Check for undefined fields
    if (!fromEmail || !toEmail || !emailSubject || !emailHtml) {
      console.error('❌ Missing required email fields:', {
        hasFrom: !!fromEmail,
        hasTo: !!toEmail,
        hasSubject: !!emailSubject,
        hasHtml: !!emailHtml
      });
      return { success: false, error: 'Missing required email fields (from, to, subject, or html)' };
    }

    // Encode HTML content as base64 for proper Chinese character rendering
    const base64Html = encodeBase64(emailHtml);

    // Send email with base64-encoded HTML content
    await client.send({
      from: fromEmail,
      to: toEmail,
      subject: emailSubject,
      headers: {
        'Reply-To': 'ofcozfamily@gmail.com',
      },
      mimeContent: [
        {
          contentType: 'text/html; charset=UTF-8',
          content: base64Html,
          transferEncoding: 'base64',
        }
      ],
    });

    await client.close();

    console.log('✅ Email sent successfully to:', options.to)
    return { success: true, message: 'Email sent successfully' }

  } catch (error) {
    console.error('❌ Error sending email:', error)

    // Provide helpful error messages
    let errorMessage = error.message || 'Failed to send email'

    if (error.message?.includes('authentication')) {
      errorMessage = 'SMTP authentication failed. Check username and password.'
    } else if (error.message?.includes('connection')) {
      errorMessage = 'Could not connect to SMTP server. Check host and port.'
    } else if (error.message?.includes('tls') || error.message?.includes('ssl')) {
      errorMessage = 'TLS/SSL error. Check SMTP_SECURE setting (true for port 465, false for 587).'
    }

    return { success: false, error: errorMessage }
  }
}