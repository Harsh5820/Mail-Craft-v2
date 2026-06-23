import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import * as recruiterService from '@/services/recruiter.service';

/**
 * DELETE /api/recruiter-emails/[id]
 * Access: Admin only
 * Deletes an entire upload batch by its ID.
 * All emails in that batch are removed.
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
    const deleted = await recruiterService.deleteBatch(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Recruiter batch DELETE error:', error.message);
    return NextResponse.json({ error: 'Failed to delete batch' }, { status: 500 });
  }
}
