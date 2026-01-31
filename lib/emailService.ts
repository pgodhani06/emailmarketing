
import nodemailer from 'nodemailer';
import dbConnect from '@/lib/mongodb';
import SmtpSetting from '@/models/SmtpSetting';

export async function getGmailTransport() {
  await dbConnect();
  const setting = await SmtpSetting.findOne({ provider: 'gmail' });
  const senderEmail = setting?.senderEmail;
  const senderPassword = setting?.password;
  if (!senderEmail || !senderPassword) {
    throw new Error(
      'Gmail SMTP credentials not configured in DB. Please set them in Settings.'
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
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, variables[key]);
  });
  return result;
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const transporter = await getGmailTransport();
  // Get sender email from DB
  const setting = await SmtpSetting.findOne({ provider: 'gmail' });
  await transporter.sendMail({
    from: setting?.senderEmail,
    to,
    subject,
    html,
  });
}
