import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getSession } from '@/lib/auth';
import { isActivePremiumUser } from '@/services/plan.service';
import * as recruiterService from '@/services/recruiter.service';

/**
 * GET /api/recruiter-emails
 * Access: Active premium users + admins
 * Query params: page, limit
 *
 * Returns batches grouped by upload, newest first.
 * Premium users receive: { id, uploadedAt, emailCount, emails[] }
 * Admin users receive additional batch metadata.
 * uploadedBy is NEVER returned to any caller.
 */
export async function GET(req) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.user.role === 'admin';
    let isPremium = false;
    let interests = [];

    // Non-admin users fetch premium status and interests
    if (!isAdmin) {
      isPremium = await isActivePremiumUser(session.user.id);
      // Fetch user interests
      const mongoose = await import('mongoose');
      const User = mongoose.models.User || mongoose.model('User');
      const user = await User.findById(session.user.id).select('profile.interests').lean();
      if (user?.profile?.interests) {
        interests = user.profile.interests;
      }
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Admin gets full batch data (for management UI); premium/free gets filtered public shape
    const result = isAdmin
      ? await recruiterService.getBatchesForAdmin(page, limit)
      : await recruiterService.getBatchesForPremium(page, limit, isPremium, interests);

    if (isAdmin) {
      result.isPremium = true;
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Recruiter emails GET error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch recruiter emails' }, { status: 500 });
  }
}

/**
 * POST /api/recruiter-emails
 * Access: Admin only
 * Body: { emailText: string }  — comma-separated email addresses
 *
 * Parses, validates, deduplicates, and stores as a single batch.
 * Returns upload stats.
 */
export async function POST(req) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { emailText, category } = body;

    if (!emailText || typeof emailText !== 'string') {
      return NextResponse.json({ error: 'emailText field is required.' }, { status: 400 });
    }

    const result = await recruiterService.uploadBatch(emailText, session.user.id, category || 'Other');

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, stats: result.stats, invalidEmails: result.invalidEmails },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: `${result.stats.uploaded} recruiter email${result.stats.uploaded !== 1 ? 's' : ''} uploaded successfully.`,
        stats: result.stats,
        invalidEmails: result.invalidEmails,
        batchId: result.batchId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Recruiter email POST error:', error.message);
    return NextResponse.json({ error: 'Failed to upload recruiter emails' }, { status: 500 });
  }
}
