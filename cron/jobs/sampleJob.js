// jobs/sampleJob.js
// This job will run every 5 minutes

import axios from 'axios';
import campaignModel from '../model/campaign.model.js';
import '../model/emailList.model.js';
import '../model/emailTemplate.model.js';

const sampleJob = async () => {
  try {
    // Get today's date in YYYY-MM-DD format
    // Fetch campaigns from local API, filtered by today's date
    // Get today's date range
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    console.log(`Fetching campaigns scheduled for today: ${start.toISOString().split('T')[0]}`);
    console.log('Start:', start);
    console.log('End:', end);
    // Aggregation: get campaigns and perDayLimit emails to send
    const campaigns = await campaignModel.aggregate([
      {
        $match: {
          status: { $ne: "completed" },
          // scheduledFor: { $gte: start, $lt: end }
        }
      },
      {
        $lookup: {
          from: "emaillists",
          localField: "emailListId",
          foreignField: "_id",
          as: "result"
        }
      },
      { $unwind: "$result" },
      {
        $addFields: {
          emailsToSend: {
            $slice: [
              {
                $filter: {
                  input: "$result.emails",
                  as: "email",
                  cond: {
                    $not: [
                      { $in: ["$$email._id", { $ifNull: ["$sendedImailIds", []] }] }
                    ]
                  }
                }
              },
              "$perDayLimit"
            ]
          }
        }
      },
      {
        $project: {
          name: 1,
          emailListId: 1,
          perDayLimit: 1,
          emailsToSend: 1,          
          scheduledFor: 1,
          status: 1,
          templateId:1
        }
      }
    ]);
    console.log('Campaigns fetched successfully.campaigns::',campaigns);
    if (Array.isArray(campaigns) && campaigns.length > 0) {
      for (const campaign of campaigns) {
        console.log('Campaign and emails to send:', campaign);
        if (!campaign.emailsToSend || campaign.emailsToSend.length === 0) {
          // Set status to completed if no emails to send
          await campaignModel.updateOne({ _id: campaign._id }, { $set: { status: "completed" } });
          console.log(`Campaign ${campaign._id} marked as completed (no emails to send).`);
          continue;
        }
        for (const emailObj of campaign.emailsToSend) {
          const payload = {
            campaignId: campaign._id.toString(),
            templateId: campaign.templateId.toString(),
            emailId: emailObj._id.toString()
          };
          try {
            console.log('Sending email with payload:',process.env.BASE_URL, payload);
            const response = await axios.post(`${process.env.BASE_URL}/api/campaigns/emailSendByIds`, payload);
            // Update email status to sent if response is successful
            if (response && response.data && response.data.success) {
              // Add the sent email's _id to the campaign's sendedImailIds array
              const { Types } = await import('mongoose');
              await campaignModel.updateOne(
                { _id: new Types.ObjectId(campaign._id) },
                { $addToSet: { sendedImailIds: new Types.ObjectId(emailObj._id) } }
              );
              console.log('Email sent and sendedImailIds updated for:', payload);
            } else {
              console.error('Email send failed for:', payload, 'Response:', response.data);
            }
          } catch (error) {
            console.error('Error sending email for payload:', payload, 'Error:', error.message);
          }
        }
      }
    } else {
      console.log('No campaigns scheduled for today.');
    }
  } catch (error) {
    console.error('Error fetching campaigns:', error.message);
  }
};

export default sampleJob;
