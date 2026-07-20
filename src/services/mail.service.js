import nodemailer from 'nodemailer';

/**
 * Create a temporary SMTP transporter.
 * Transporter is NOT cached — created per campaign, destroyed after.
 */
export function createTransporter(email, appPassword) {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: email,
      pass: appPassword,
    }
  });
}

/**
 * Replace template placeholders with actual data
 */
export function renderTemplate(html, data) {
  let rendered = html;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    rendered = rendered.replace(regex, value || '');
  }
  return rendered;
}

/**
 * Send a single email
 */
export async function sendEmail(transporter, { from, to, subject, html, attachments = [] }) {
  const mailOptions = {
    from: `"${from.name}" <${from.email}>`,
    to,
    subject,
    html,
    attachments,
  };

  return transporter.sendMail(mailOptions);
}

/**
 * Verify SMTP credentials without sending an email
 */
export async function verifyCredentials(email, appPassword) {
  const transporter = createTransporter(email, appPassword);
  try {
    await transporter.verify();
    transporter.close();
    return { valid: true };
  } catch (error) {
    transporter.close();
    return { valid: false, error: error.message };
  }
}

/**
 * Close and destroy transporter — credential cleanup
 */
export function destroyTransporter(transporter) {
  if (transporter) {
    transporter.close();
  }
}

/**
 * Send an email from the platform sender account using environment credentials.
 * This is used for support and system transactional emails (like forgot password).
 */
export async function sendPlatformEmail({ to, subject, html }) {
  const platformEmail = process.env.platform_email || process.env.PLATFORM_EMAIL;
  const platformEmailPassword = process.env.platform_email_password || process.env.PLATFORM_EMAIL_PASSWORD;

  if (!platformEmail || !platformEmailPassword) {
    throw new Error('Platform email configurations (platform_email and platform_email_password) are missing from environment.');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: platformEmail,
      pass: platformEmailPassword,
    },
  });

  try {
    const mailOptions = {
      from: `"MailCraft Support" <${platformEmail}>`,
      to,
      subject,
      html,
    };
    return await transporter.sendMail(mailOptions);
  } finally {
    transporter.close();
  }
}
