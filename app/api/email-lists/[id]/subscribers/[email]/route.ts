import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import EmailList from '@/models/EmailList';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; email: string } }
) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { email, name, companyName, websiteUrl, notes, emailStatus } = body;
    const originalEmail = params.email;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const list = await EmailList.findById(params.id);
    if (!list) {
      return NextResponse.json({ error: 'Email list not found' }, { status: 404 });
    }

    // Find the subscriber to update
    const subscriberIndex = list.emails.findIndex((sub: any) => sub.email === originalEmail);
    if (subscriberIndex === -1) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    // Check if new email already exists (if email changed)
    if (email !== originalEmail) {
      const emailExists = list.emails.some((sub: any) => sub.email === email);
      if (emailExists) {
        return NextResponse.json({ error: 'Email already exists in this list' }, { status: 400 });
      }
    }

    // Update subscriber
    list.emails[subscriberIndex] = {
      ...list.emails[subscriberIndex],
      email,
      name: name || '',
      companyName: companyName || '',
      websiteUrl: websiteUrl || '',
      notes: notes || '',
      emailStatus: emailStatus || 'Right',
    };

    await list.save();
    return NextResponse.json(list);
  } catch (error) {
    console.error('Failed to update subscriber:', error);
    return NextResponse.json(
      { error: 'Failed to update subscriber' },
      { status: 500 }
    );
  }
}
