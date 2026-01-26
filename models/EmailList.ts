import mongoose from 'mongoose';

// Create a separate schema for subscribers with timestamps
const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    name: String,
    companyName: String,
    websiteUrl: String,
    notes: String,
    emailStatus: {
      type: String,
      enum: ['Right', 'Wrong'],
      default: 'Right',
    },
    sended: {
      type: Boolean,
      default: false,
    },
    variables: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

const emailListSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    emails: [subscriberSchema],
    totalCount: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.models.EmailList || mongoose.model('EmailList', emailListSchema);
