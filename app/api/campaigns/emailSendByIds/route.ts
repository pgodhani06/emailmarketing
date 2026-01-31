import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import EmailList from '@/models/EmailList';
import EmailTemplate from '@/models/EmailTemplate';
import Report from '@/models/Report';
import { getGmailTransport, replaceVariables } from '@/lib/emailService';

    export async function POST(request: NextRequest) {
      try {
        await dbConnect();
        const { emailId, templateId ,campaignId} = await request.json();
        if (!emailId || !templateId) {
          return NextResponse.json({ error: 'emailId and templateId are required' }, { status: 400 });
        }
        console.log('Received emailId:', emailId, 'templateId:', templateId);
        // Find the email by _id in any EmailList
        // Use aggregation to get only the matching email object and campaigns, using ObjectId
        const objectEmailId = new mongoose.Types.ObjectId(emailId);
        const result = await EmailList.aggregate([
          { $match: { 'emails._id': objectEmailId } },
          { $project: {
              emails: {
                $filter: {
                  input: '$emails',
                  as: 'email',
                  cond: { $eq: ['$$email._id', objectEmailId] }
                }
              },
              campaigns: 1
            }
          }
        ]);
        if (!result || result.length === 0 || !result[0].emails || result[0].emails.length === 0) {
          return NextResponse.json({ error: 'Email not found' }, { status: 404 });
        }
        const emailList = result[0].emails[0];
        console.log('Found emailList:', emailList);
        const recipient = emailList;
        // Try to get campaignId from the emailList's campaigns array (first one)
        // const campaignId = Array.isArray(emailList.campaigns) && emailList.campaigns.length > 0 ? emailList.campaigns[0] : undefined;
        // if (!campaignId) {
        //   return NextResponse.json({ error: 'No campaignId found for this email. Cannot create report.' }, { status: 400 });
        // }

        // Find the template
        const template = await EmailTemplate.findById(templateId);
        if (!template) {
          return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        let trackingDomain = process.env.NEXT_PUBLIC_TRACKING_DOMAIN;
        if (!trackingDomain) {
          const url = new URL(request.url);
          trackingDomain = url.origin;
        }

        let transporter;
        try {
          transporter = await getGmailTransport();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to initialize email service';
          console.error('Email service error:', error);
          return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        // Merge variables from recipient and fallback fields
        const variables = {
          firstName: recipient.firstName || recipient.name?.split(' ')[0] || '',
          lastName: recipient.lastName || recipient.name?.split(' ')[1] || '',
          company: recipient.companyName || '',
          name: recipient.name || '',
          email: recipient.email || '',
          websiteUrl: recipient.websiteUrl || '',
          notes: recipient.notes || '',
        };

        const personalizedContent = replaceVariables(template.htmlContent, variables);
        const trackingPixel = `<img src="${trackingDomain}/api/track/none?email=${encodeURIComponent(recipient.email.toLowerCase())}" width="1" height="1" alt="" style="display:none;" />`;
        const mailOptions = {
          from: process.env.GMAIL_SENDER_EMAIL,
          to: recipient.email,
          subject: replaceVariables(template.subject, variables),
          html: personalizedContent + trackingPixel,
        };

        try {
          await transporter.sendMail(mailOptions);
          await Report.create({
            recipientEmail: recipient.email.toLowerCase(),
            status: 'sent',
            sentAt: new Date(),
            templateId: template._id,
            campaignId,
          });
          return NextResponse.json({ success: true });
        } catch (error) {
          console.error(`Failed to send email to ${recipient.email}:`, error);
          try {
            await Report.create({
              recipientEmail: recipient.email.toLowerCase(),
              status: 'failed',
              sentAt: new Date(),
              templateId: template._id,
              campaignId,
            });
          } catch (reportError) {
            console.error(`Failed to create report for ${recipient.email}:`, reportError);
          }
          return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
        }
      } catch (error) {
        console.error('Send mail error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to send mail';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
      }
    }
