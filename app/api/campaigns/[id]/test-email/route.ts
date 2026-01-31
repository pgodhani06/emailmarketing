import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Campaign from '@/models/Campaign';
import EmailList from '@/models/EmailList';
import EmailTemplate from '@/models/EmailTemplate';
import { sendEmail } from '@/lib/emailService';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Test email address is required' }, { status: 400 });
    }
    const campaign = await Campaign.findById(params.id).populate('templateId');
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    const template = campaign.templateId;
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    // Prepare variables for template rendering (use dummy data or campaign defaults)
    const variables = { firstName: 'Test', ...campaign.variables };
    const html = template.htmlContent.replace(/{{\s*(\w+)\s*}}/g, (_, v) => variables[v] || '');
    await sendEmail({
      to: email,
      subject: campaign.name + ' (Test Email)',
      html,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ error: 'Failed to send test email', details: error?.message || error }, { status: 500 });
  }
}
