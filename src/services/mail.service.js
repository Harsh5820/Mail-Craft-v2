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
    },
    pool: true,
    maxConnections: 1, // Single connection to mimic human behavior
    maxMessages: 10,
    rateDelta: 30000, // 30 seconds between messages
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
