import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import EmailTemplate from '@/models/EmailTemplate';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('Fetching template for ID:', request.method);
    await dbConnect();
    const template = await EmailTemplate.findById(params.id);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    return NextResponse.json(template);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const template = await EmailTemplate.findByIdAndUpdate(params.id, body, { new: true });
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    return NextResponse.json(template);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('Deleting template for ID:', request.method);
    await dbConnect();
    const template = await EmailTemplate.findByIdAndDelete(params.id);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
