import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import * as recruiterService from '@/services/recruiter.service';

/**
 * DELETE /api/recruiter-emails/[id]
 * Access: Admin only
 */
export async function DELETE(req, { params }) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { id } = await params;
    const deleted = await recruiterService.deleteRecruiterEmail(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Recruiter email deleted successfully' });
  } catch (error) {
    console.error('Recruiter email DELETE error:', error.message);
    return NextResponse.json({ error: 'Failed to delete recruiter email' }, { status: 500 });
  }
}
