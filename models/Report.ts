import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      // required: true,
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
  },
  { timestamps: true }
);

export default mongoose.models.Report || mongoose.model('Report', reportSchema);
