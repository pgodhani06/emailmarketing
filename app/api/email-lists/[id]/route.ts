import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import EmailList from '@/models/EmailList';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('Fetching email list with ID:', request.method);
    await dbConnect();
    const list = await EmailList.findById(params.id);
    if (!list) {
      return NextResponse.json({ error: 'Email list not found' }, { status: 404 });
    }
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch email list' }, { status: 500 });
  }
}


export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const body = await request.json();
    const list = await EmailList.findByIdAndUpdate(params.id, body, { new: true });
    if (!list) {
      return NextResponse.json({ error: 'Email list not found' }, { status: 404 });
    }
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update email list' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('Deleting email list with ID:', request.method);
    await dbConnect();
    const list = await EmailList.findByIdAndDelete(params.id);
    if (!list) {
      return NextResponse.json({ error: 'Email list not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete email list' }, { status: 500 });
  }
}
