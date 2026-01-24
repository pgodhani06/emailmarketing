import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    emailListId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailList',
      required: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailTemplate',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'running', 'completed', 'paused'],
      default: 'draft',
    },
    scheduledFor: Date,
    startedAt: Date,
    completedAt: Date,
    totalRecipients: Number,
    sentCount: {
      type: Number,
      default: 0,
    },
    openedCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    trackingPixelId: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);
