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
    const { email, name, companyName, websiteUrl, notes, emailStatus } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if email already exists
    const list = await EmailList.findById(params.id);
    if (!list) {
      return NextResponse.json({ error: 'Email list not found' }, { status: 404 });
    }

    const emailExists = list.emails.some((sub: any) => sub.email === email);
    if (emailExists) {
      return NextResponse.json({ error: 'Email already exists in this list' }, { status: 400 });
    }

    // Add subscriber
    list.emails.push({ 
      email, 
      name: name || '',
      companyName: companyName || '',
      websiteUrl: websiteUrl || '',
      notes: notes || '',
      emailStatus: emailStatus || 'Right',
    });
    list.totalCount = list.emails.length;
    await list.save();

    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    console.error('Failed to add subscriber:', error);
    return NextResponse.json(
      { error: 'Failed to add subscriber' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const body = await request.json();
    const { email, emails } = body;

    // Handle bulk delete (multiple emails)
    if (emails && Array.isArray(emails)) {
      if (emails.length === 0) {
        return NextResponse.json(
          { error: 'Please select at least one subscriber to delete' },
          { status: 400 }
        );
      }

      const list = await EmailList.findById(params.id);
      if (!list) {
        return NextResponse.json(
          { error: 'Email list not found' },
          { status: 404 }
        );
      }

      const emailsSet = new Set(
        emails.map((e: string) => e.toLowerCase())
      );
      const deletedCount = list.emails.length;
      list.emails = list.emails.filter(
        (sub: any) => !emailsSet.has(sub.email.toLowerCase())
      );
      const actualDeleted = deletedCount - list.emails.length;
      list.totalCount = list.emails.length;
      await list.save();

      return NextResponse.json({
        ...list.toObject(),
        message: `${actualDeleted} subscriber(s) deleted successfully`,
      });
    }

    // Handle single delete (for backward compatibility)
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const list = await EmailList.findById(params.id);
    if (!list) {
      return NextResponse.json(
        { error: 'Email list not found' },
        { status: 404 }
      );
    }

    // Remove subscriber
    list.emails = list.emails.filter((sub: any) => sub.email !== email);
    list.totalCount = list.emails.length;
    await list.save();

    return NextResponse.json(list);
  } catch (error) {
    console.error('Failed to delete subscriber:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscriber' },
      { status: 500 }
    );
  }
}
