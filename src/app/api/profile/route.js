import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { checkAndDowngradePlan, getPlanExpiryInfo, getRemainingDailyEmails, PLAN_CONFIG } from '@/services/plan.service';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Check and downgrade plan if expired
    const user = await checkAndDowngradePlan(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get plan expiry info
    const planInfo = await getPlanExpiryInfo(session.user.id);
    const dailyEmails = await getRemainingDailyEmails(session.user.id);

    return NextResponse.json({
      name: user.name,
      email: user.email,
      profile: user.profile || {},
      plan: user.plan || 'free',
      planInfo,
      dailyEmails,
      planLimits: PLAN_CONFIG[user.plan] || PLAN_CONFIG.free,
      planExpiresAt: user.planExpiresAt,
      dailySendCount: user.dailySendCount || 0,
      lastSendDate: user.lastSendDate,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, profile } = body;

    await dbConnect();

    const updateData = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (profile) {
      const allowed = [
        'skills',
        'experience',
        'linkedin',
        'github',
        'portfolio',
        'contact_number_1',
        'contact_number_2',
        'location',
        'headline',
      ];
      const cleanProfile = {};
      for (const key of allowed) {
        if (profile[key] !== undefined) {
          cleanProfile[key] = typeof profile[key] === 'string' ? profile[key].trim() : profile[key];
        }
      }
      // Save the whole profile object so Mongoose creates it if it doesn't exist
      updateData.profile = cleanProfile;
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('name email profile').lean();

    return NextResponse.json({
      message: 'Profile updated successfully',
      name: user.name,
      email: user.email,
      profile: user.profile || {},
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
