import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import EmailList from '@/models/EmailList';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const lists = await EmailList.find().select('-emails');
    return NextResponse.json(lists);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch email lists' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const emailList = new EmailList({
      name: body.name,
      description: body.description,
      emails: body.emails || [],
      totalCount: body.emails?.length || 0,
    });

    await emailList.save();
    return NextResponse.json(emailList, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create email list' }, { status: 500 });
  }
}
