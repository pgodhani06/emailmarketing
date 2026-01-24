const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// MongoDB connection
const connectionString = process.env.MONGODB_URI;
console.log(connectionString)
console.log('Using MongoDB connection string:', connectionString ? 'Found' : 'Not Found');
if (!connectionString) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

const sampleEmails = [
  { email: 'john@example.com', firstName: 'John', lastName: 'Doe', company: 'Tech Corp' },
  { email: 'jane@example.com', firstName: 'Jane', lastName: 'Smith', company: 'Design Inc' },
  { email: 'bob@example.com', firstName: 'Bob', lastName: 'Johnson', company: 'Startup Labs' },
];

// Define schemas inline
const emailListSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  emails: [
    {
      email: String,
      name: String,
      variables: mongoose.Schema.Types.Mixed,
    },
  ],
  totalCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const emailTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  htmlContent: { type: String, required: true },
  variables: [String],
  previewText: String,
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  emailListId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailList', required: true },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailTemplate', required: true },
  status: { type: String, enum: ['draft', 'scheduled', 'running', 'completed', 'paused'], default: 'draft' },
  scheduledFor: Date,
  startedAt: Date,
  completedAt: Date,
  totalRecipients: Number,
  sentCount: { type: Number, default: 0 },
  openedCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  trackingPixelId: String,
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const reportSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
  },
  recipientEmail: String,
  status: {
    type: String,
    enum: ['sent', 'opened', 'failed', 'bounced'],
    default: 'sent',
  },
  sentAt: Date,
  openedAt: Date,
  trackingPixelId: String,
  userAgent: String,
  ipAddress: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Create models
const EmailList = mongoose.model('EmailList', emailListSchema);
const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);
const Campaign = mongoose.model('Campaign', campaignSchema);
const Report = mongoose.model('Report', reportSchema);

const { v4: uuidv4 } = require('uuid');

const sampleTemplates = [
  {
    name: 'Welcome Email',
    subject: 'Welcome to Our Service, {{firstName}}!',
    htmlContent: `
      <h1>Hello {{firstName}} {{lastName}}</h1>
      <p>Welcome to our email marketing platform!</p>
      <p>We're excited to have you on board at {{company}}.</p>
      <p>Get started with your first campaign today.</p>
    `,
    previewText: 'Welcome message'
  },
  {
    name: 'Monthly Newsletter',
    subject: 'Your {{company}} Monthly Update',
    htmlContent: `
      <h2>Hi {{firstName}},</h2>
      <p>Here's this month's update for {{company}}.</p>
      <h3>Key Highlights:</h3>
      <ul>
        <li>Feature 1</li>
        <li>Feature 2</li>
        <li>Feature 3</li>
      </ul>
      <p>Best regards,<br>The Team</p>
    `,
    previewText: 'Monthly newsletter'
  },
  {
    name: 'Promotional Offer',
    subject: '{{firstName}}, special offer inside!',
    htmlContent: `
      <h2>Exclusive Offer for {{firstName}}!</h2>
      <p>We have a special 20% discount just for you at {{company}}.</p>
      <p>Use code: SPECIAL20</p>
      <p>Valid until end of month!</p>
    `,
    previewText: 'Special promotional offer'
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(connectionString);
    console.log('✅ Connected to MongoDB\n');
    console.log('🌱 Seeding database...\n');

    // Create sample email list
    console.log('📧 Creating email list...');
    const emailListData = {
      name: 'Sample Email List',
      description: 'A sample email list with test subscribers',
      emails: sampleEmails.map((email) => ({
        email: email.email,
        name: `${email.firstName} ${email.lastName}`,
        variables: {
          firstName: email.firstName,
          lastName: email.lastName,
          company: email.company,
        },
      })),
      totalCount: sampleEmails.length,
    };

    const existingList = await EmailList.findOne({ name: emailListData.name });
    let listId;
    if (!existingList) {
      const newList = await EmailList.create(emailListData);
      listId = newList._id;
      console.log('✅ Sample email list created:', emailListData.name);
    } else {
      listId = existingList._id;
      console.log('✅ Email list already exists:', existingList.name);
    }

    // Create sample templates
    console.log('\n📝 Creating email templates...');
    const templateIds = [];
    for (const template of sampleTemplates) {
      const existingTemplate = await EmailTemplate.findOne({ name: template.name });
      if (!existingTemplate) {
        const newTemplate = await EmailTemplate.create(template);
        templateIds.push(newTemplate._id);
        console.log('✅ Template created:', template.name);
      } else {
        templateIds.push(existingTemplate._id);
        console.log('✅ Template already exists:', template.name);
      }
    }

    // Create sample campaign
    console.log('\n📬 Creating sample campaign...');
    const existingCampaign = await Campaign.findOne({ name: 'Sample Campaign' });
    let campaignId;
    if (!existingCampaign && templateIds.length > 0) {
      const trackingPixelId = uuidv4();
      const campaign = await Campaign.create({
        name: 'Sample Campaign',
        emailListId: listId,
        templateId: templateIds[0],
        status: 'completed',
        trackingPixelId: trackingPixelId,
        totalRecipients: sampleEmails.length,
        sentCount: sampleEmails.length,
        openedCount: 2,
        failedCount: 0,
        completedAt: new Date(),
      });
      campaignId = campaign._id;
      console.log('✅ Sample campaign created');

      // Create tracking logs for the campaign
      console.log('\n📊 Creating email tracking logs...');
      const trackingLogs = [
        {
          campaignId: campaignId,
          recipientEmail: 'john@example.com',
          status: 'sent',
          sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          trackingPixelId: trackingPixelId,
        },
        {
          campaignId: campaignId,
          recipientEmail: 'jane@example.com',
          status: 'opened',
          sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          openedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          trackingPixelId: trackingPixelId,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ipAddress: '192.168.1.1',
        },
        {
          campaignId: campaignId,
          recipientEmail: 'bob@example.com',
          status: 'opened',
          sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          openedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          trackingPixelId: trackingPixelId,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
          ipAddress: '203.0.113.42',
        },
      ];

      const existingLogs = await Report.find({ campaignId: campaignId });
      if (existingLogs.length === 0) {
        await Report.insertMany(trackingLogs);
        console.log(`✅ Created ${trackingLogs.length} email tracking records`);
        console.log('   • 1 email sent');
        console.log('   • 2 emails opened');
        console.log('   • 0 emails failed');
      } else {
        console.log('✅ Tracking logs already exist');
      }
    } else if (existingCampaign) {
      campaignId = existingCampaign._id;
      console.log('✅ Sample campaign already exists');
    }

    console.log('\n✨ Database seeding complete!');
    console.log('\n📊 Summary:');
    console.log(`   • Email Lists: 1`);
    console.log(`   • Email Templates: ${sampleTemplates.length}`);
    console.log(`   • Sample Recipients: ${sampleEmails.length}`);
    console.log(`   • Sample Campaign: 1 (with tracking logs)`);
    console.log(`   • Email Tracking Records: 3`);
    console.log('\n📈 Tracking Data:');
    console.log('   • Sent: 1 email');
    console.log('   • Opened: 2 emails');
    console.log('   • Failed: 0 emails');
    console.log('\n💡 Next steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Open: http://localhost:3000');
    console.log('   3. Check Campaigns page to see the sample data with tracking logs');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Database seeding error:', error.message);
    process.exit(1);
  }
}

seedDatabase();
