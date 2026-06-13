/**
 * Universal Email Sender
 * Cloudflare Pages Function - handles POST /api/send-email
 *
 * Automatically collects ALL form fields and sends them in an email.
 * Works with any form without modification.
 *
 * Environment Variables (set in Cloudflare Dashboard):
 * - RESEND_API_KEY: Your Resend API key
 * - TO_EMAIL: Email address to receive form submissions
 * - FROM_EMAIL: Sender email address (must be verified domain)
 * - EMAIL_SUBJECT: (optional) Custom email subject
 */

interface Env {
  RESEND_API_KEY: string;
  TO_EMAIL: string;
  FROM_EMAIL?: string;
  EMAIL_SUBJECT?: string;
}

interface FormResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Cloudflare Pages Function context
 */
interface PagesContext<E = unknown> {
  request: Request;
  env: E;
  params: Record<string, string>;
  waitUntil: (promise: Promise<unknown>) => void;
  passThroughOnException: () => void;
}

export async function onRequestPost(
  context: PagesContext<Env>
): Promise<Response> {
  try {
    const formData = await context.request.formData();

    // Collect ALL form fields dynamically
    const fields: { name: string; value: string }[] = [];
    for (const [name, value] of formData.entries()) {
      // Skip empty values and file uploads
      if (value && typeof value === 'string') {
        fields.push({ name, value });
      }
    }

    if (fields.length === 0) {
      return Response.json(
        { success: false, error: 'No form data received' } satisfies FormResponse,
        { status: 400 }
      );
    }

    // Build plain text email body
    const textBody = fields
      .map((f) => `${formatFieldName(f.name)}: ${f.value}`)
      .join('\n');

    // Build HTML email body
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    table { border-collapse: collapse; width: 100%; max-width: 600px; }
    td { padding: 12px; border-bottom: 1px solid #eee; }
    td:first-child { font-weight: 600; color: #333; width: 30%; }
    td:last-child { color: #666; }
    h2 { color: #333; margin-bottom: 20px; }
  </style>
</head>
<body>
  <h2>New Form Submission</h2>
  <table>
    ${fields.map((f) => `<tr><td>${escapeHtml(formatFieldName(f.name))}</td><td>${escapeHtml(f.value)}</td></tr>`).join('\n    ')}
  </table>
</body>
</html>
    `.trim();

    // Validate required env vars
    if (!context.env.RESEND_API_KEY || !context.env.TO_EMAIL) {
      console.error('Missing required environment variables: RESEND_API_KEY or TO_EMAIL');
      return Response.json(
        { success: false, error: 'Server configuration error' } satisfies FormResponse,
        { status: 500 }
      );
    }

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: context.env.FROM_EMAIL || 'Form <noreply@example.com>',
        to: context.env.TO_EMAIL,
        subject: context.env.EMAIL_SUBJECT || 'New Form Submission',
        text: textBody,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      return Response.json(
        { success: false, error: 'Failed to send email' } satisfies FormResponse,
        { status: 500 }
      );
    }

    return Response.json(
      { success: true, message: 'Message sent successfully!' } satisfies FormResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Email send error:', error);
    return Response.json(
      { success: false, error: 'An unexpected error occurred' } satisfies FormResponse,
      { status: 500 }
    );
  }
}

/**
 * Format field name for display (e.g., "firstName" -> "First Name")
 */
function formatFieldName(name: string): string {
  return name
    // Insert space before capitals (camelCase)
    .replace(/([A-Z])/g, ' $1')
    // Replace underscores and hyphens with spaces
    .replace(/[-_]/g, ' ')
    // Capitalize first letter of each word
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
