import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import * as recruiterService from '@/services/recruiter.service';

/**
 * POST /api/recruiter-emails/bulk-delete
 * Access: Admin only
 * Body: { ids: string[] }
 *
 * Deletes multiple recruiter email records by ID array.
 * Only valid ObjectIds are processed; invalid ones are silently skipped.
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
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    const result = await recruiterService.bulkDeleteRecruiterEmails(ids);

    return NextResponse.json({
      message: `${result.deletedCount} record(s) deleted successfully.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Recruiter email bulk delete error:', error.message);
    return NextResponse.json({ error: 'Failed to delete records' }, { status: 500 });
  }
}
