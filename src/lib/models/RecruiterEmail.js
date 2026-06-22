import mongoose from 'mongoose';

const RecruiterEmailSchema = new mongoose.Schema(
  {
    company_name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters'],
    },
    recruiter_name: {
      type: String,
      required: [true, 'Recruiter name is required'],
      trim: true,
      maxlength: [150, 'Recruiter name cannot exceed 150 characters'],
    },
    recruiter_email: {
      type: String,
      required: [true, 'Recruiter email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    job_role: {
      type: String,
      required: [true, 'Job role is required'],
      trim: true,
      maxlength: [200, 'Job role cannot exceed 200 characters'],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: same email + company + role = duplicate
RecruiterEmailSchema.index(
  { recruiter_email: 1, company_name: 1, job_role: 1 },
  { unique: true, name: 'unique_recruiter_entry' }
);

// Index for search performance
RecruiterEmailSchema.index({ company_name: 1 });
RecruiterEmailSchema.index({ job_role: 1 });

export default mongoose.models.RecruiterEmail ||
  mongoose.model('RecruiterEmail', RecruiterEmailSchema);
