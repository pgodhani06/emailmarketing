# Email Marketing Platform

A full-stack email marketing application built with Next.js, Node.js API routes, and MongoDB. Manage email lists, create dynamic email templates, schedule campaigns, and track email opens with precision.

## Features

### Frontend (Next.js)
- **Dashboard** - Overview of campaigns, templates, and email lists
- **Email List Management** - Upload and manage subscriber lists
- **Email Template Builder** - Create dynamic email templates with variable support (e.g., `{{firstName}}`, `{{company}}`)
- **Campaign Scheduler** - Create and schedule email campaigns
- **Analytics Dashboard** - View detailed reports on sent, opened, and failed emails
- **Open Rate Tracking** - Track email opens in real-time

### Backend (Next.js API Routes)
- **Email Sending** - Send emails via Gmail SMTP with simple authentication
- **Campaign Scheduler** - Cron jobs for automatic campaign scheduling
- **Tracking Pixel** - Invisible pixel-based email open tracking
- **Email Open Detection** - Automatic tracking of email opens with user-agent and IP logging
- **Reporting APIs** - Comprehensive endpoints for campaign analytics

### Database (MongoDB)
- **Email Lists** - Store subscriber information with custom variables
- **Email Templates** - Save reusable email templates with dynamic variables
- **Campaigns** - Track campaign status, scheduling, and sending progress
- **Reports** - Detailed reports on email delivery and opens

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Email**: Nodemailer with Gmail SMTP
- **Scheduling**: node-cron for automated campaign sending
- **Database**: MongoDB with Mongoose ODM
- **Tracking**: Pixel-based email open tracking

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB instance)
- Gmail account with App Password configured

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env.local`:
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/EmailMarketing

# Gmail SMTP Configuration
GMAIL_SENDER_EMAIL=your-email@gmail.com
GMAIL_PASSWORD=your-app-password

# Application
NEXT_PUBLIC_TRACKING_DOMAIN=http://localhost:3000
NODE_ENV=development
```

**Note**: Get Gmail App Password:
1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select Mail & Windows (or All)
3. Google generates a 16-character password
4. Use this password in GMAIL_PASSWORD

3. Seed sample data (optional):
```bash
npm run db:seed
```

### Running the Project

**Development:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
.
├── app/
│   ├── api/                    # Next.js API routes
│   │   ├── email-lists/        # Email list CRUD operations
│   │   ├── templates/          # Email template management
│   │   ├── campaigns/          # Campaign creation and sending
│   │   ├── reports/            # Analytics and reporting
│   │   └── track/              # Pixel-based open tracking
│   ├── email-lists/            # Email list management page
│   ├── templates/              # Email template page
│   ├── campaigns/              # Campaign management page
│   ├── reports/                # Analytics page
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Dashboard
│   └── globals.css             # Global styles
├── models/
│   ├── EmailList.ts            # Email list schema
│   ├── EmailTemplate.ts        # Template schema
│   ├── Campaign.ts             # Campaign schema
│   └── Report.ts               # Report/tracking schema
├── lib/
│   ├── mongodb.ts              # MongoDB connection utility
│   └── emailService.ts         # Gmail sending and variable replacement
├── services/
│   └── cronScheduler.ts        # Cron job scheduler
├── scripts/
│   └── seed.js                 # Database seeding script
├── public/                     # Static assets
├── .env.local                  # Environment variables (Git ignored)
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── README.md                   # This file
```

## API Documentation

### Email Lists
- `GET /api/email-lists` - Get all email lists
- `POST /api/email-lists` - Create new email list
- `GET /api/email-lists/[id]` - Get specific email list
- `PUT /api/email-lists/[id]` - Update email list
- `DELETE /api/email-lists/[id]` - Delete email list

### Templates
- `GET /api/templates` - Get all templates
- `POST /api/templates` - Create new template
- `GET /api/templates/[id]` - Get specific template
- `PUT /api/templates/[id]` - Update template
- `DELETE /api/templates/[id]` - Delete template

### Campaigns
- `GET /api/campaigns` - Get all campaigns
- `POST /api/campaigns` - Create new campaign
- `GET /api/campaigns/[id]` - Get specific campaign
- `PUT /api/campaigns/[id]` - Update campaign
- `DELETE /api/campaigns/[id]` - Delete campaign
- `POST /api/campaigns/[id]/send` - Send campaign immediately

### Reports
- `GET /api/reports` - Get all reports
- `GET /api/reports/[campaignId]` - Get campaign statistics

### Tracking
- `GET /api/track/[trackingId]` - Pixel endpoint for open tracking

## Dynamic Variables in Templates

Use double curly braces to add dynamic variables to email templates:

```html
<h1>Hello {{firstName}} {{lastName}}!</h1>
<p>We hope you're having a great day at {{company}}.</p>
```

When emails are sent, variables are automatically replaced with subscriber-specific values.

## Gmail Setup

To configure Gmail SMTP:

1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select **Mail** and **Windows** (or **All**)
3. Google will generate a 16-character password
4. Copy this password and add it to `.env.local` as `GMAIL_PASSWORD`
5. Set `GMAIL_SENDER_EMAIL` to your Gmail address
6. Restart the development server

## Email Open Tracking

Email opens are tracked using an invisible 1x1 pixel image embedded in the email. When a recipient's email client loads the image, the system records:
- Email address
- Timestamp of open
- User-agent (email client information)
- IP address

Open tracking is automatic and requires no additional setup.

## Cron Jobs

The system automatically checks for scheduled campaigns every minute and sends them at their scheduled time. Campaigns with status `scheduled` and `scheduledFor` date in the past will be automatically sent.

## Development Tips

- Use the Dashboard to create your first email list, template, and campaign
- Test with the sample data by running `npm run db:seed`
- Check the browser console and server logs for debugging information
- MongoDB queries can be slow with large datasets; consider indexing for production

## License

ISC

## Support

For issues or questions, please check the project repository.
