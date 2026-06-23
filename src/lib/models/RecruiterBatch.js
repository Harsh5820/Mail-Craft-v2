import mongoose from 'mongoose';

/**
 * RecruiterBatch — one document per admin upload submission.
 * Each batch holds all emails pasted in that single admin action.
 * uploadedBy is stored server-side only; never returned to premium users.
 */
const RecruiterBatchSchema = new mongoose.Schema(
  {
    emails: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'A batch must contain at least one email address.',
      },
    },
    emailCount: {
      type: Number,
      required: true,
      min: [1, 'Email count must be at least 1'],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    uploadedAt: {
      type: Date,
      required: true,
      default: () => new Date(),
      index: -1, // newest-first sort
    },
    // Optional label — used to mark the migration batch
    label: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for newest-first listing
RecruiterBatchSchema.index({ uploadedAt: -1 });

// Index for per-email duplicate detection across batches
RecruiterBatchSchema.index({ emails: 1 });

export default mongoose.models.RecruiterBatch ||
  mongoose.model('RecruiterBatch', RecruiterBatchSchema);
