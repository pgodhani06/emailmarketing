import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Campaign from '@/models/Campaign';
import Report from '@/models/Report';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const campaign = await Campaign.findById(params.id)
      .populate('emailListId')
      .populate('templateId');
    
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Calculate actual counts from reports
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
    return NextResponse.json({
      ...campaignObj,
      sentCount: sentCount,
      openedCount: openedCount,
      failedCount: failedCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const body = await request.json();

    const campaign = await Campaign.findByIdAndUpdate(params.id, body, {
      new: true,
    });
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(campaign);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const campaign = await Campaign.findByIdAndDelete(params.id);
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
