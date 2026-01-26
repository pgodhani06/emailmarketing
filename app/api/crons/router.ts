
import dbConnect from '@/lib/mongodb';
import Campaign from '@/models/Campaign';
import { getGmailTransport, replaceVariables } from '@/lib/emailService';
import EmailList from '@/models/EmailList';
import EmailTemplate from '@/models/EmailTemplate';
import Report from '@/models/Report';
import CroneLog from '@/models/CroneLog';

export async function GET(request: Request) {
  const now = new Date();
  console.log('--- Vercel Cron Triggered ---');
  console.log('Time:', now.toISOString());
  console.log('Method:', request.method);

  try {
    // Connect to MongoDB
    await dbConnect();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    // Fetch all scheduled campaigns for today
    const campaigns = await Campaign.find({
      status: 'scheduled',
      cronAt: { $gte: startOfDay, $lt: endOfDay },
    });
    let totalCampaigns = campaigns.length;
    let totalSent = 0;
    let totalFailed = 0;
    let allMails: any[] = [];
    for (const campaign of campaigns) {
      let sentCount = 0;
      let failedCount = 0;
      let lastSendemailId = campaign.lastSendemailId;
      // Fetch the email list and template for this campaign
      const emailList = await EmailList.findById(campaign.emailListId);
      const template = await EmailTemplate.findById(campaign.templateId);
      if (!emailList || !template) continue;
      let startIdx = 0;
      if (lastSendemailId) {
        startIdx = emailList.emails.findIndex((sub: any) => String(sub._id) === String(lastSendemailId)) + 1;
        if (startIdx < 0) startIdx = 0;
      }
      const perDayLimit = campaign.perDayLimit || 1;
      // Get the batch of recipients to send today
      const recipientsToSend = emailList.emails.slice(startIdx, startIdx + perDayLimit);
      // Create Gmail transporter
      const transporter = await getGmailTransport();
      for (const recipient of recipientsToSend) {
        let mailStatus = 'sent';
        let errorMsg = '';
        try {
          // Prepare and send the email
          const personalizedContent = replaceVariables(template.htmlContent, recipient.variables || {});
          const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_TRACKING_DOMAIN}/api/track/${campaign.trackingPixelId}?email=${encodeURIComponent(recipient.email)}" width="1" height="1" alt="" style="display:none;" />`;
          const mailOptions = {
            from: process.env.GMAIL_SENDER_EMAIL,
            to: recipient.email,
            subject: replaceVariables(template.subject, recipient.variables || {}),
            html: personalizedContent + trackingPixel,
          };
          await transporter.sendMail(mailOptions);
          // Log the sent mail in the Report collection
          await Report.create({
            campaignId: campaign._id,
            recipientEmail: recipient.email,
            status: 'sent',
            sentAt: new Date(),
            trackingPixelId: campaign.trackingPixelId,
          });
          // Update sended to true for this recipient in the email list
          await EmailList.updateOne(
            { _id: emailList._id, 'emails._id': recipient._id },
            { $set: { 'emails.$.sended': true } }
          );
          sentCount++;
          lastSendemailId = recipient._id;
        } catch (error) {
          mailStatus = 'failed';
          errorMsg = error instanceof Error ? error.message : String(error);
          failedCount++;
          console.error(`Failed to send email to ${recipient.email}:`, error);
        }
        allMails.push({
          campaignId: campaign._id,
          campaignName: campaign.name,
          listId: emailList._id,
          listName: emailList.name,
          templateId: template._id,
          templateName: template.name,
          sender: process.env.GMAIL_SENDER_EMAIL,
          recipientEmail: recipient.email,
          status: mailStatus,
          error: errorMsg,
          sentAt: new Date(),
        });
        // Wait random 60-90 seconds between each mail
        const delay = Math.floor(Math.random() * 31 + 60) * 1000;
        await new Promise(res => setTimeout(res, delay));
      }
      // If all emails sent, mark campaign as completed
      if (startIdx + perDayLimit >= emailList.emails.length) {
        campaign.status = 'completed';
        campaign.completedAt = new Date();
      } else {
        // Not completed: update cronAt to next day for next batch
        const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, now.getHours(), now.getMinutes(), now.getSeconds());
        campaign.cronAt = nextDay;
      }
      // Update campaign stats and save
      campaign.sentCount = (campaign.sentCount || 0) + sentCount;
      campaign.failedCount = (campaign.failedCount || 0) + failedCount;
      campaign.lastSendemailId = lastSendemailId;
      await campaign.save();
      totalSent += sentCount;
      totalFailed += failedCount;
    }
    // Log all mail send attempts in CroneLog
    if (allMails.length > 0) {
      await CroneLog.create({
        runAt: new Date(),
        logType: 'cron',
        message: `Vercel Cron: Processed ${totalCampaigns} campaigns. Sent: ${totalSent}, Failed: ${totalFailed}`,
        mails: allMails,
      });
    }
    return new Response(`Vercel Cron: Processed ${totalCampaigns} campaigns. Sent: ${totalSent}, Failed: ${totalFailed}`);
  } catch (err) {
    console.error('Vercel Cron Error:', err);
    return new Response('Vercel Cron Error', { status: 500 });
  }
}