import nodemailer from 'nodemailer';

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
