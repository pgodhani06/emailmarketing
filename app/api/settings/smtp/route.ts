import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SmtpSetting from '@/models/SmtpSetting';

export async function GET() {
  await dbConnect();
  const setting = await SmtpSetting.findOne({ provider: 'gmail' });
  if (!setting) {
    return NextResponse.json({ error: 'SMTP settings not found' }, { status: 404 });
  }
  return NextResponse.json({
    senderEmail: setting.senderEmail,
    provider: setting.provider,
    updatedAt: setting.updatedAt,
    hasPassword: !!setting.password,
  });
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const { senderEmail, password } = await request.json();
  if (!senderEmail || !password) {
    return NextResponse.json({ error: 'senderEmail and password required' }, { status: 400 });
  }
  let setting = await SmtpSetting.findOneAndUpdate(
    { provider: 'gmail' },
    { senderEmail, password, updatedAt: new Date() },
    { upsert: true, new: true }
  );
  return NextResponse.json({ success: true });
}
