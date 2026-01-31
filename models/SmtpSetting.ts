import mongoose from 'mongoose';

const smtpSettingSchema = new mongoose.Schema({
  senderEmail: { type: String, required: true },
  password: { type: String, required: true },
  provider: { type: String, default: 'gmail' },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.SmtpSetting || mongoose.model('SmtpSetting', smtpSettingSchema);
