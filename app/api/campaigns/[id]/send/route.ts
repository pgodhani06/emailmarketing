import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Campaign from '@/models/Campaign';
import EmailList from '@/models/EmailList';
import EmailTemplate from '@/models/EmailTemplate';
import Report from '@/models/Report';
import { getGmailTransport, replaceVariables } from '@/lib/emailService';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const campaign = await Campaign.findById(params.id);
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const emailList = await EmailList.findById(campaign.emailListId);
    const template = await EmailTemplate.findById(campaign.templateId);

    if (!emailList || !template) {
      return NextResponse.json(
        { error: 'Invalid email list or template' },
        { status: 400 }
      );
    }

    if (!emailList.emails || emailList.emails.length === 0) {
      return NextResponse.json(
        { error: 'Email list has no recipients' },
        { status: 400 }
      );
    }

    let trackingDomain = process.env.NEXT_PUBLIC_TRACKING_DOMAIN;
    if (!trackingDomain) {
      // Fallback: get domain from request
      const url = new URL(_request.url);
      trackingDomain = url.origin;
    }

    let transporter;
    try {
      transporter = await getGmailTransport();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to initialize email service';
      console.error('Email service error:', error);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    let sentCount = 0;
    let failedCount = 0;

    // Send emails
    for (const recipient of emailList.emails) {
      try {
        // Skip if email status is Wrong
        if (recipient.emailStatus === 'Wrong') {
          failedCount++;
          continue;
        }

        // Merge variables from recipient and fallback fields
        const variables = {
          firstName: recipient.firstName || recipient.name?.split(' ')[0] || '',
          lastName: recipient.lastName || recipient.name?.split(' ')[1] || '',
          company: recipient.companyName || '',
          name: recipient.name || '',
          email: recipient.email || '',
          websiteUrl: recipient.websiteUrl || '',
          notes: recipient.notes || '',
        };

        const personalizedContent = replaceVariables(
          template.htmlContent,
          variables
        );
        const trackingPixel = `<img src="${trackingDomain}/api/track/${
          campaign.trackingPixelId
        }?email=${encodeURIComponent(
          recipient.email.toLowerCase()
        )}" width="1" height="1" alt="" style="display:none;" />`;
        const mailOptions = {
          from: process.env.GMAIL_SENDER_EMAIL,
          to: recipient.email,
          subject: replaceVariables(template.subject, variables),
          html: personalizedContent + trackingPixel,
        };

        await transporter.sendMail(mailOptions);

        // Create report entry
        await Report.create({
          campaignId: campaign._id,
          recipientEmail: recipient.email.toLowerCase(),
          status: 'sent',
          sentAt: new Date(),
          trackingPixelId: campaign.trackingPixelId,
        });

        sentCount++;
      } catch (error) {
        failedCount++;
        console.error(`Failed to send email to ${recipient.email}:`, error);
        
        // Create report entry for failed email
        try {
          await Report.create({
            campaignId: campaign._id,
            recipientEmail: recipient.email.toLowerCase(),
            status: 'failed',
            sentAt: new Date(),
            trackingPixelId: campaign.trackingPixelId,
          });
        } catch (reportError) {
          console.error(`Failed to create report for ${recipient.email}:`, reportError);
        }
      }
    }

    // Update campaign
    campaign.status = 'completed';
    campaign.sentCount = sentCount;
    campaign.failedCount = failedCount;
    campaign.totalRecipients = emailList.emails.length;
    campaign.completedAt = new Date();
    try {
      await campaign.save();
    } catch (saveError) {
      console.error('Failed to save campaign:', saveError);
      return NextResponse.json(
        { error: 'Failed to save campaign results' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount,
      totalRecipients: emailList.emails.length,
    });
  } catch (error) {
    console.error('Campaign send error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to send campaign';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
