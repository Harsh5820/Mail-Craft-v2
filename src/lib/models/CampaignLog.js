import mongoose from 'mongoose';

const CampaignLogSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipientEmail: {
      type: String,
      required: true,
    },
    recipientName: {
      type: String,
      default: '',
    },
    company: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending', 'retrying'],
      default: 'pending',
      index: true,
    },
    errorMessage: {
      type: String,
      default: '',
    },
    sentAt: {
      type: Date,
      default: null,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient campaign log queries
CampaignLogSchema.index({ campaignId: 1, status: 1 });

export default mongoose.models.CampaignLog || mongoose.model('CampaignLog', CampaignLogSchema);
