import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Report from '@/models/Report';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('Fetching campaign reports for ID:', request.method);
    await dbConnect();
    const reports = await Report.find({ campaignId: params.id });
    
    const stats = {
      total: reports.length,
      sent: reports.filter(r => r.status === 'sent').length,
      opened: reports.filter(r => r.status === 'opened').length,
      failed: reports.filter(r => r.status === 'failed').length,
      openRate: 0,
      details: reports,
    };

    stats.openRate = stats.total > 0 ? Math.round((stats.opened / stats.total) * 100) : 0;

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch campaign reports' }, { status: 500 });
  }
}
