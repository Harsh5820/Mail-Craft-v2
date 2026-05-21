import mongoose from 'mongoose';

const CampaignSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'running', 'paused', 'completed', 'failed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    csvData: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    totalEmails: {
      type: Number,
      default: 0,
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    pendingCount: {
      type: Number,
      default: 0,
    },
    currentIndex: {
      type: Number,
      default: 0,
    },
    resumeFileName: {
      type: String,
      default: '',
    },
    resumeBase64: {
      type: String,
      default: '',
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    errorMessage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Campaign || mongoose.model('Campaign', CampaignSchema);
