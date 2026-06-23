import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password by default
    },
    image: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    plan: {
      type: String,
      enum: ['free', 'daily', 'monthly'],
      default: 'free',
    },
    planExpiresAt: {
      type: Date,
      default: null,
    },
    dailySendCount: {
      type: Number,
      default: 0,
    },
    lastSendDate: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpire: {
      type: Date,
      default: null,
    },
    // Professional profile — saved once, auto-filled in campaigns
    profile: {
      skills: { type: String, default: '' },
      experience: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      portfolio: { type: String, default: '' },
      contact_number_1: { type: String, default: '' },
      contact_number_2: { type: String, default: '' },
      location: { type: String, default: '' },
      headline: { type: String, default: '' },
      interests: { type: [String], default: [] },
    },
    // Monetization & Premium Limits
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    aiGenerationsToday: {
      type: Number,
      default: 0,
    },
    lastAIGenerationDate: {
      type: Date,
      default: null,
    },
    atsChecksThisMonth: {
      type: Number,
      default: 0,
    },
    lastAtsCheckDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

if (mongoose.models.User && !mongoose.models.User.schema.paths.resetPasswordToken) {
  delete mongoose.models.User;
}

export default mongoose.models.User || mongoose.model('User', UserSchema);
