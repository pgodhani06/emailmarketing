import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Report from '@/models/Report';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const reports = await Report.find({ campaignId: params.id })
      .select('recipientEmail status sentAt openedAt createdAt')
      .sort({ sentAt: -1, createdAt: -1 })
      .limit(50);

    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch campaign emails' },
      { status: 500 }
    );
  }
}
