import mongoose from 'mongoose';

const TemplateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      maxlength: [200, 'Template name cannot exceed 200 characters'],
    },
    subject: {
      type: String,
      required: [true, 'Email subject is required'],
      trim: true,
      maxlength: [500, 'Subject cannot exceed 500 characters'],
    },
    html: {
      type: String,
      required: [true, 'Email body is required'],
    },
    placeholders: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Template || mongoose.model('Template', TemplateSchema);
