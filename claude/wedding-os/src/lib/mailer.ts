import nodemailer from 'nodemailer';

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT) || 587,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
}

function hasSmtpConfig() {
  return !!(process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_HOST !== 'smtp.example.com');
}

export async function sendRsvpEmail(
  to: string,
  guestName: string,
  body: string,
  subject: string = 'Wedding RSVP'
) {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev && !hasSmtpConfig()) {
    console.log('\n--- RSVP EMAIL (dev mode) ---');
    console.log(`To: ${to} (${guestName})`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${body}`);
    console.log('-----------------------------\n');
    return;
  }

  const htmlBody = body.replace(/\n/g, '<br>').replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" style="color:#e11d48;">$1</a>'
  );

  await createTransporter().sendMail({
    from: process.env.EMAIL_FROM || 'noreply@wedding-os.com',
    to,
    subject,
    text: body,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="color:#e11d48;margin-bottom:16px;">Wedding Invitation</h2>
        <p style="line-height:1.6;color:#374151;">${htmlBody}</p>
      </div>
    `,
  });
}

export async function sendScheduleEmail({
  to, coupleNames, eventCount, message, icsContent, icsFilename,
}: {
  to: string; coupleNames: string; eventCount: number;
  message: string; icsContent: string; icsFilename: string;
}) {
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev && !hasSmtpConfig()) {
    console.log('\n--- SCHEDULE EMAIL (dev mode) ---');
    console.log(`To: ${to} | Events: ${eventCount} | ICS length: ${icsContent.length}`);
    console.log('----------------------------------\n');
    return;
  }

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
      <h2 style="color:#e11d48;margin-bottom:8px;">💍 ${coupleNames} — Wedding Day Schedule</h2>
      <p style="color:#374151;line-height:1.6;">${message || `The full wedding day schedule (${eventCount} events) is attached as a .ics calendar file. Open it to add all events to your calendar.`}</p>
      <p style="color:#6b7280;font-size:13px;margin-top:16px;">Open the attached .ics file to import into Google Calendar, Apple Calendar, or Outlook.</p>
    </div>
  `;

  await createTransporter().sendMail({
    from: process.env.EMAIL_FROM || 'noreply@wedding-os.com',
    to,
    subject: `💍 ${coupleNames} — Wedding Day Schedule`,
    html,
    attachments: [{ filename: icsFilename, content: icsContent, contentType: 'text/calendar' }],
  });
}

export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  // In development without real SMTP config, just log the link
  const isDev = process.env.NODE_ENV !== 'production';
  const hasSmtp = process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_HOST !== 'smtp.example.com';

  if (isDev && !hasSmtp) {
    console.log('\n--- EMAIL VERIFICATION (dev mode) ---');
    console.log(`To: ${email}`);
    console.log(`Verify URL: ${verifyUrl}`);
    console.log('--------------------------------------\n');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT) || 587,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@wedding-os.com',
    to: email,
    subject: 'Verify your email – Wedding OS',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #e11d48;">Welcome to Wedding OS!</h2>
        <p>Click the button below to verify your email address. This link expires in 24 hours.</p>
        <a href="${verifyUrl}"
           style="display:inline-block;padding:12px 24px;background:#e11d48;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
          Verify Email
        </a>
        <p style="margin-top:24px;color:#6b7280;font-size:13px;">
          Or copy this link: <a href="${verifyUrl}">${verifyUrl}</a>
        </p>
      </div>
    `,
  });
}
