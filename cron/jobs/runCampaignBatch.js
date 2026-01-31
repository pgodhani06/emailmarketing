// jobs/runCampaignBatch.js
// Shared campaign batch logic for cron job (mail sending logic is separate)

import campaignModel from '../model/campaign.model.js';
import emailListModel from '../model/emailList.model.js';
import emailTemplateModel from '../model/emailTemplate.model.js';

export const getCampaignBatchData = async () => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  // Get all scheduled campaigns for today
  const campaigns = await campaignModel.find({
    status: 'scheduled',
    cronAt: { $gte: startOfDay, $lt: endOfDay },
  });
  let result = [];
  for (const campaign of campaigns) {
    const emailList = await emailListModel.findById(campaign.emailListId);
    const template = await emailTemplateModel.findById(campaign.templateId);
    result.push({
      campaign,
      emailList,
      template
    });
  }
  return result;
};
