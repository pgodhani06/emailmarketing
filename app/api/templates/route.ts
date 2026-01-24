import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import EmailTemplate from '@/models/EmailTemplate';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const templates = await EmailTemplate.find();
    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Extract variables from HTML content (e.g., {{firstName}})
    const variableRegex = /{{(\w+)}}/g;
    const variables: string[] = [];
    let match;
    while ((match = variableRegex.exec(body.htmlContent)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    const template = new EmailTemplate({
      name: body.name,
      subject: body.subject,
      htmlContent: body.htmlContent,
      variables,
      previewText: body.previewText,
    });

    await template.save();
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
