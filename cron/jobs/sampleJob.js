// jobs/sampleJob.js
// This job will run every 5 minutes

import axios from 'axios';
import campaignModel from '../model/campaign.model.js';
import '../model/emailList.model.js';
import '../model/emailTemplate.model.js';

// Returns the current date/time expressed in IST (Asia/Kolkata) as a Date object
const getISTDate = () => {
  const now = new Date();
  const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  return new Date(istString);
};

const sampleJob = async () => {
  try {
    // Aggregation: get campaigns and perDayLimit emails to send
    const campaigns = await campaignModel.aggregate([
      {
          $match: {
          status: { $ne: "completed" },
          $or: [
            { cronAt: null },
            { cronAt: { $lte: new Date(Date.now())} }
          ],
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
    
    console.log('sampleJob started at:', getISTDate());
    console.log('Fetching campaigns scheduled for today...',new Date(Date.now()));
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
        let anySent = false;
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
              anySent = true;
              console.log('Email sent and sendedImailIds updated for:', payload);
            } else {
              console.error('Email send failed for:', payload, 'Response:', response.data);
            }
          } catch (error) {
            console.error('Error sending email for payload:', payload, 'Error:', error.message);
          }
        }
        // After processing, update cronAt to next run (e.g., +1 day or now+5min)
        if (anySent) {
          // Set cronAt to the next day, but keep the time from scheduledFor
          let nextDay = new Date();
          let scheduled = campaign.scheduledFor ? new Date(campaign.scheduledFor) : new Date();
          nextDay.setDate(nextDay.getDate() + 1);
          nextDay.setHours(scheduled.getHours(), scheduled.getMinutes(), scheduled.getSeconds(), scheduled.getMilliseconds());
          await campaignModel.updateOne(
            { _id: campaign._id },
            { $set: { cronAt: nextDay } }
          );
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
