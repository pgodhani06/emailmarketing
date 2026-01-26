// app/runCampaignBatch.js
// Shared campaign batch logic for both API and cron.js

const dbConnect = require('../lib/mongodb').default;
const Campaign = require('../models/Campaign').default;
const EmailList = require('../models/EmailList').default;
const EmailTemplate = require('../models/EmailTemplate').default;
const Report = require('../models/Report').default;
const CroneLog = require('../models/CroneLog').default;
const { getGmailTransport, replaceVariables } = require('../lib/emailService');

async function runCampaignBatch() {
  const now = new Date();
  await dbConnect();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const campaigns = await Campaign.find({
    status: 'scheduled',
    cronAt: { $gte: startOfDay, $lt: endOfDay },
  });
  let totalCampaigns = campaigns.length;
  let totalSent = 0;
  let totalFailed = 0;
  let allMails = [];
  for (const campaign of campaigns) {
    let sentCount = 0;
    let failedCount = 0;
    let lastSendemailId = campaign.lastSendemailId;
    const emailList = await EmailList.findById(campaign.emailListId);
    const template = await EmailTemplate.findById(campaign.templateId);
    if (!emailList || !template) continue;
    let startIdx = 0;
    if (lastSendemailId) {
      startIdx = emailList.emails.findIndex(sub => String(sub._id) === String(lastSendemailId)) + 1;
      if (startIdx < 0) startIdx = 0;
    }
    const perDayLimit = campaign.perDayLimit || 1;
    const recipientsToSend = emailList.emails.slice(startIdx, startIdx + perDayLimit);
    const transporter = await getGmailTransport();
    for (const recipient of recipientsToSend) {
      let mailStatus = 'sent';
      let errorMsg = '';
      try {
        const personalizedContent = replaceVariables(template.htmlContent, recipient.variables || {});
        const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_TRACKING_DOMAIN}/api/track/${campaign.trackingPixelId}?email=${encodeURIComponent(recipient.email)}" width="1" height="1" alt="" style="display:none;" />`;
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
    if (startIdx + perDayLimit >= emailList.emails.length) {
      campaign.status = 'completed';
      campaign.completedAt = new Date();
    } else {
      const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, now.getHours(), now.getMinutes(), now.getSeconds());
      campaign.cronAt = nextDay;
    }
    campaign.sentCount = (campaign.sentCount || 0) + sentCount;
    campaign.failedCount = (campaign.failedCount || 0) + failedCount;
    campaign.lastSendemailId = lastSendemailId;
    await campaign.save();
    totalSent += sentCount;
    totalFailed += failedCount;
  }
  if (allMails.length > 0) {
    await CroneLog.create({
      runAt: new Date(),
      logType: 'cron',
      message: `Node Cron: Processed ${totalCampaigns} campaigns. Sent: ${totalSent}, Failed: ${totalFailed}`,
      mails: allMails,
    });
  }
  console.log(`Node Cron: Processed ${totalCampaigns} campaigns. Sent: ${totalSent}, Failed: ${totalFailed}`);
}

module.exports = { runCampaignBatch };
