## Email Marketing Platform

A full-stack email marketing application with Next.js frontend, Node.js/Next.js API routes backend, and MongoDB database.

### Architecture

**Frontend**: Next.js 14 with React 18 and Tailwind CSS
- Dashboard with campaign statistics
- Email list management and upload
- Dynamic email template builder (supports variables like `{{firstName}}`)
- Campaign scheduler and management
- Email analytics and open rate tracking

**Backend**: Next.js API Routes
- Email sending via Gmail OAuth2 with Nodemailer
- Automatic campaign scheduling with cron jobs
- Pixel-based email open tracking
- Comprehensive reporting APIs

**Database**: MongoDB with Mongoose
- Email Lists: Store subscribers with custom variables
- Email Templates: Save reusable templates with dynamic variables
- Campaigns: Track campaign status, scheduling, and metrics
- Reports: Store email delivery and open events

### Quick Start

1. Install dependencies: `npm install`
2. Configure `.env.local` with MongoDB and Gmail OAuth2 credentials
3. Run development server: `npm run dev`
4. Open http://localhost:3000

### Key Features

- **Email List Management**: Upload and manage subscriber lists with custom attributes
- **Dynamic Templates**: Create email templates with `{{variable}}` placeholders
- **Campaign Scheduling**: Schedule campaigns to send at specific times
- **Email Tracking**: Automatic open tracking with pixel-based detection
- **Analytics**: Real-time reporting on sent, opened, and failed emails
- **Cron Scheduling**: Automatic campaign sending at scheduled times
- **OAuth2 Gmail**: Secure email sending via Gmail accounts

### Environment Variables

```
MONGODB_URI=mongodb+srv://...
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REFRESH_TOKEN=...
GMAIL_SENDER_EMAIL=...
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_TRACKING_DOMAIN=http://localhost:3000
```

### Project Guidelines

- API routes handle all backend logic
- Frontend pages are in `/app` directory
- Database models in `/models` directory
- Utility functions in `/lib` directory
- Services (cron, email) in `/services` directory
- Use TypeScript for type safety
- Tailwind CSS for styling
- Mongoose for MongoDB ODM
