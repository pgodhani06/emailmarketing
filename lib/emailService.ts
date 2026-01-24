import nodemailer from 'nodemailer';

export async function getGmailTransport() {
  const senderEmail = process.env.GMAIL_SENDER_EMAIL;
  const senderPassword = process.env.GMAIL_PASSWORD;

  if (!senderEmail || !senderPassword) {
    throw new Error(
      'Gmail SMTP credentials not configured. Please set:\n' +
      '- GMAIL_SENDER_EMAIL\n' +
      '- GMAIL_PASSWORD (use Gmail App Password)'
    );
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: senderEmail,
        pass: senderPassword,
      },
    });

    // Verify connection
    await transporter.verify();
    return transporter;
  } catch (error) {
    console.error('Failed to create Gmail SMTP transport:', error);
    throw new Error('Failed to connect to Gmail. Please check your email and password.');
  }
}

export function replaceVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, variables[key]);
  });
  return result;
}
