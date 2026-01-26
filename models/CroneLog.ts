import mongoose from 'mongoose';

const croneLogSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    campaignName: String,
    listId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailList',
    },
    listName: String,
    sentCount: Number,
    failedCount: Number,
    failedEmails: [String],
    totalRecipients: Number,
    runAt: {
      type: Date,
      default: Date.now,
    },
    logType: {
      type: String,
      enum: ['cron', 'manual'],
      default: 'cron',
    },
    message: String,
  },
  { timestamps: true }
);

export default mongoose.models.CroneLog || mongoose.model('CroneLog', croneLogSchema);
