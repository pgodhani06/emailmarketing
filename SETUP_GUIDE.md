## Environment Setup Guide

### Gmail Configuration (Simple Authentication)

1. **Generate App Password**
   - Go to your [Google Account](https://myaccount.google.com/)
   - Go to "Security" tab
   - Enable 2-Step Verification (if not already enabled)
   - Create an "App Password" for "Mail" and "Windows Computer"
   - Copy the generated 16-character password

2. **Add to .env.local**
   ```
   GMAIL_SENDER_EMAIL=your-gmail@gmail.com
   GMAIL_PASSWORD=your-16-character-app-password
   ```

**Note:** Using app passwords is simpler than OAuth2 and works perfectly for development and most production use cases.

### MongoDB Setup

1. **Create a MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster
   - Create a database user with username and password

2. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

3. **Add to .env.local**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/email-marketing?retryWrites=true&w=majority
   ```

### Final Environment File (.env.local)

```
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/email-marketing?retryWrites=true&w=majority

# Gmail (Simple Auth with App Password)
GMAIL_SENDER_EMAIL=your-email@gmail.com
GMAIL_PASSWORD=your-16-character-app-password

# Application
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_TRACKING_DOMAIN=http://localhost:3000
```

### Running the Project

```bash
# Install dependencies
npm install

# (Optional) Seed sample data
npm run db:seed

# Run development server
npm run dev

# Open http://localhost:3000
```

## Features Walkthrough

1. **Dashboard** - View overview of campaigns, templates, and lists
2. **Email Lists** - Create and manage subscriber lists
3. **Templates** - Design email templates with dynamic variables (e.g., `{{firstName}}`)
4. **Campaigns** - Create campaigns and send them immediately or schedule for later
5. **Reports** - View detailed analytics including open rates and email delivery status

## Testing the System

1. Create an email list with test subscribers
2. Create an email template with dynamic variables
3. Create a campaign connecting the list and template
4. Send the campaign to see emails being tracked
5. View reports to see open tracking and delivery status
