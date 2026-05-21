import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import crypto from 'crypto';
import { z } from 'zod';

const resetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export async function POST(req) {
  try {
    const body = await req.json();
    const validated = resetSchema.parse(body);

    await dbConnect();

    // Hash the token received from the query parameter to match the database stored token
    const hashedToken = crypto.createHash('sha256').update(validated.token).digest('hex');

    // Find user with matching token and unexpired reset time
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'The password reset token is invalid or has expired.' },
        { status: 400 }
      );
    }

    // Set new password (the pre('save') hook in User.js handles the hashing)
    user.password = validated.password;
    
    // Clear token fields
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    await user.save();

    return NextResponse.json(
      { message: 'Your password has been successfully reset.' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError || error?.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors?.[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
