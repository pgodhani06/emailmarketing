import cron from 'node-cron';
import { connectToDatabase } from '@/lib/mongodb';
import Campaign from '@/models/Campaign';
import { getGmailTransport, replaceVariables } from '@/lib/emailService';
import EmailList from '@/models/EmailList';
import EmailTemplate from '@/models/EmailTemplate';
import Report from '@/models/Report';

export function initializeCronJobs() {
  // Check every minute for campaigns that need to be sent
  cron.schedule('* * * * *', async () => {
    try {
      await connectToDatabase();

      const now = new Date();
      const campaigns = await Campaign.find({
        status: 'scheduled',
        scheduledFor: { $lte: now },
      }).populate('emailListId').populate('templateId');

      for (const campaign of campaigns) {
        try {
          await sendCampaign(campaign);
        } catch (error) {
          console.error(`Failed to send campaign ${campaign._id}:`, error);
          campaign.status = 'failed';
          await campaign.save();
        }
      }
    } catch (error) {
      console.error('Cron job error:', error);
    }
  });

  console.log('Cron jobs initialized');
}

async function sendCampaign(campaign: any) {
  const transporter = await getGmailTransport();
  const trackingDomain = process.env.NEXT_PUBLIC_TRACKING_DOMAIN;
  let sentCount = 0;
  let failedCount = 0;

  campaign.status = 'running';
  campaign.startedAt = new Date();
  await campaign.save();

  const emailList = await EmailList.findById(campaign.emailListId);
  const template = await EmailTemplate.findById(campaign.templateId);

  if (!emailList || !template) {
    throw new Error('Invalid email list or template');
  }

  for (const recipient of emailList.emails) {
    try {
      const personalizedContent = replaceVariables(template.htmlContent, recipient.variables || {});
      const trackingPixel = `<img src="${trackingDomain}/api/track/${campaign.trackingPixelId}?email=${encodeURIComponent(recipient.email)}" width="1" height="1" alt="" style="display:none;" />`;

      const mailOptions = {
        from: process.env.GMAIL_SENDER_EMAIL,
        to: recipient.email,
        subject: replaceVariables(template.subject, recipient.variables || {}),
        html: personalizedContent + trackingPixel,
      };

      await transporter.sendMail(mailOptions);

      await Report.create({
        campaignId: campaign._id,
        recipientEmail: recipient.email,
        status: 'sent',
        sentAt: new Date(),
        trackingPixelId: campaign.trackingPixelId,
      });

      sentCount++;
    } catch (error) {
      failedCount++;
      console.error(`Failed to send email to ${recipient.email}:`, error);
    }
  }

  campaign.status = 'completed';
  campaign.sentCount = sentCount;
  campaign.failedCount = failedCount;
  campaign.completedAt = new Date();
  await campaign.save();
}
