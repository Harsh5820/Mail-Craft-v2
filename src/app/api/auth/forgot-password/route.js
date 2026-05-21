import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { sendPlatformEmail } from '@/services/mail.service';
import crypto from 'crypto';
import { z } from 'zod';

const forgotSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
});

export async function POST(req) {
  try {
    const body = await req.json();
    const validated = forgotSchema.parse(body);

    await dbConnect();

    // Find user by email
    const user = await User.findOne({ email: validated.email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      );
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token to store in the DB
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store in User document with 1 hour expiration
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + 3600000); // 1 hour from now

    await user.save({ validateBeforeSave: false });

    // Build reset link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // Construct premium HTML email body
    const emailHtml = `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #0c0f1d; border-radius: 16px; color: #f3f4f6; border: 1px solid rgba(255, 255, 255, 0.08);">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; padding: 12px; background: linear-gradient(135deg, #a855f7, #6366f1); border-radius: 12px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(168, 85, 247, 0.2);">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </div>
          <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">MailCraft</h2>
          <p style="color: #9ca3af; margin: 4px 0 0 0; font-size: 14px;">Smart Job Application Mailer</p>
        </div>
        
        <div style="background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 12px; padding: 32px; margin-bottom: 32px; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);">
          <h3 style="color: #ffffff; margin-top: 0; font-size: 18px; font-weight: 600; margin-bottom: 16px;">Reset Your Password</h3>
          <p style="color: #d1d5db; font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
            Hello ${user.name || 'there'},
          </p>
          <p style="color: #d1d5db; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            We received a request to reset the password for your MailCraft account. Click the button below to secure your account and set a new password:
          </p>
          
          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #a855f7, #6366f1); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px rgba(168, 85, 247, 0.3); border: 1px solid rgba(255, 255, 255, 0.1);">
              Reset Password
            </a>
          </div>
          
          <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.06);">
            <strong>Important Note:</strong> This reset link is valid for <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.
          </p>
        </div>
        
        <div style="font-size: 12px; color: #6b7280; text-align: center; line-height: 1.6;">
          <p style="margin: 0 0 8px 0;">If you are having trouble with the button above, copy and paste the URL below into your web browser:</p>
          <p style="margin: 0; word-break: break-all; color: #6366f1; font-family: monospace;">${resetUrl}</p>
          <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.05); margin: 24px 0;" />
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} MailCraft. All rights reserved.</p>
        </div>
      </div>
    `;

    // Send email using platform SMTP service
    await sendPlatformEmail({
      to: user.email,
      subject: 'MailCraft — Reset Your Password',
      html: emailHtml,
    });

    return NextResponse.json(
      { message: 'A password reset link has been sent to your email address' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError || error?.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors?.[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}
