import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import EmailList from '@/models/EmailList';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const body = await request.json();
    const { subscribers } = body;

    if (!Array.isArray(subscribers) || subscribers.length === 0) {
      return NextResponse.json(
        { error: 'Subscribers array is required and must not be empty' },
        { status: 400 }
      );
    }

    const list = await EmailList.findById(params.id);
    if (!list) {
      return NextResponse.json({ error: 'Email list not found' }, { status: 404 });
    }

    // Get existing emails for duplicate checking
    const existingEmails = new Set(list.emails.map((sub) => sub.email.toLowerCase()));

    // Add new subscribers (skip duplicates)
    let addedCount = 0;
    for (const subscriber of subscribers) {
      if (
        subscriber.email &&
        !existingEmails.has(subscriber.email.toLowerCase())
      ) {
        list.emails.push({
          email: subscriber.email,
          name: subscriber.name || '',
          companyName: subscriber.companyName || '',
          websiteUrl: subscriber.websiteUrl || '',
          notes: subscriber.notes || '',
          emailStatus: subscriber.emailStatus || 'Right',
        });
        existingEmails.add(subscriber.email.toLowerCase());
        addedCount++;
      }
    }

    list.totalCount = list.emails.length;
    await list.save();

    return NextResponse.json(
      {
        ...list.toObject(),
        message: `${addedCount} subscriber(s) added successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to bulk add subscribers:', error);
    return NextResponse.json(
      { error: 'Failed to bulk add subscribers' },
      { status: 500 }
    );
  }
}
