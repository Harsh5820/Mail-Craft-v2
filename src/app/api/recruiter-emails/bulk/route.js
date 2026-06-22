import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import * as recruiterService from '@/services/recruiter.service';

/**
 * POST /api/recruiter-emails/bulk
 * Access: Admin only
 * Body: { rows: Array<{ company_name, recruiter_name, recruiter_email, job_role }> }
 *
 * Accepts pre-parsed CSV rows (parsing done client-side or passed as JSON array).
 * Returns detailed stats: valid, invalid, duplicate, uploaded, failed, errors.
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
    const { rows } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 });
    }

    if (rows.length > 5000) {
      return NextResponse.json({ error: 'Maximum 5000 rows per upload' }, { status: 400 });
    }

    const stats = await recruiterService.bulkInsertRecruiterEmails(rows, session.user.id);

    return NextResponse.json({
      message: `Upload complete. ${stats.uploaded} records added.`,
      stats,
    });
  } catch (error) {
    console.error('Recruiter email bulk upload error:', error.message);
    return NextResponse.json({ error: 'Failed to process bulk upload' }, { status: 500 });
  }
}
