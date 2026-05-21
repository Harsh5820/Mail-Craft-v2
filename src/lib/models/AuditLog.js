import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'login',
        'logout',
        'register',
        'campaign_start',
        'campaign_pause',
        'campaign_resume',
        'campaign_complete',
        'campaign_cancel',
        'template_create',
        'template_delete',
        'credentials_provided',
        'credentials_destroyed',
        'plan_upgrade',
      ],
    },
    details: {
      type: String,
      default: '',
    },
    ip: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete old audit logs after 90 days
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
