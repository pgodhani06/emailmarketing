import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Campaign from '@/models/Campaign';
import Report from '@/models/Report';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching all campaigns',request.method);
    await dbConnect();
    const campaigns = await Campaign.find()
      .populate('emailListId', 'name')
      .populate('templateId', 'name subject');
    
    // Calculate actual sent, opened, and failed counts from reports
    const campaignsWithCounts = await Promise.all(
      campaigns.map(async (campaign) => {
        const sentCount = await Report.countDocuments({
          campaignId: campaign._id,
          status: { $in: ['sent', 'opened'] }
        });
        const openedCount = await Report.countDocuments({
          campaignId: campaign._id,
          status: 'opened'
        });
        const failedCount = await Report.countDocuments({
          campaignId: campaign._id,
          status: 'failed'
        });

        const campaignObj = campaign.toObject();
        return {
          ...campaignObj,
          sentCount: sentCount,
          openedCount: openedCount,
          failedCount: failedCount,
        };
      })
    );

    return NextResponse.json(campaignsWithCounts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    const trackingPixelId = uuidv4();
    const campaign = new Campaign({
      name: body.name,
      emailListId: body.emailListId,
      templateId: body.templateId,
      status: body.status || 'draft',
      scheduledFor: body.scheduledFor,
      trackingPixelId,
      totalRecipients: body.totalRecipients,
      perDayLimit: body.perDayLimit ?? 1,
      cronAt: body.scheduledFor
    });

    await campaign.save();
    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
