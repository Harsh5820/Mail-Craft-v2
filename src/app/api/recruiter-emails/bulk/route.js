import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { migrateLegacyEmails } from '@/services/recruiter.service';

/**
 * POST /api/recruiter-emails/migrate
 * Access: Admin only — one-time migration endpoint
 *
 * Migrates legacy RecruiterEmail flat records into a single RecruiterBatch.
 * Safe to call multiple times (idempotent).
 * Does NOT delete legacy records.
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

    const result = await migrateLegacyEmails();

    return NextResponse.json({
      message: result.message,
      migrated: result.migrated,
      emailCount: result.emailCount,
    });
  } catch (error) {
    console.error('Migration error:', error.message);
    return NextResponse.json({ error: 'Migration failed: ' + error.message }, { status: 500 });
  }
}
