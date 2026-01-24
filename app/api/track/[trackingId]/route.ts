import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Report from '@/models/Report';

export async function GET(request: NextRequest, { params }: { params: { trackingId: string } }) {
  try {
    await dbConnect();
    
    const email = request.nextUrl.searchParams.get('email');
    
    console.log(`[TRACKING] Tracking pixel loaded - trackingId: ${params.trackingId}, email: ${email}`);
    
    // Update report status to opened
    if (email && params.trackingId) {
      const updateResult = await Report.updateOne(
        {
          trackingPixelId: params.trackingId,
          recipientEmail: email.toLowerCase(),
        },
        {
          status: 'opened',
          openedAt: new Date(),
          userAgent: request.headers.get('user-agent') || undefined,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        }
      );
      
      console.log(`[TRACKING] Update result:`, updateResult);
    }

    // Return a 1x1 transparent pixel
    const pixel = Buffer.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
      0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
      0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
      0x01, 0x00, 0x3b,
    ]);

    return new NextResponse(pixel, {
      headers: {
        'Content-Type': 'image/gif',
        'Content-Length': pixel.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Tracking error:', error);
    // Still return pixel even if tracking fails
    const pixel = Buffer.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
      0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
      0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
      0x01, 0x00, 0x3b,
    ]);
    return new NextResponse(pixel, {
      headers: {
        'Content-Type': 'image/gif',
      },
    });
  }
}
