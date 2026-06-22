import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getSession } from '@/lib/auth';
import { isActivePremiumUser } from '@/services/plan.service';
import * as recruiterService from '@/services/recruiter.service';

/**
 * GET /api/recruiter-emails
 * Access: Active premium users + admins
 * Query params: company_name, recruiter_name, recruiter_email, job_role, page, limit
 */
export async function GET(req) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.user.role === 'admin';

    // Non-admin users must have an active premium plan
    if (!isAdmin) {
      const hasPremium = await isActivePremiumUser(session.user.id);
      if (!hasPremium) {
        return NextResponse.json(
          { error: 'Access denied. An active premium plan is required to view recruiter emails.' },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(req.url);
    const filters = {
      company_name: searchParams.get('company_name') || '',
      recruiter_name: searchParams.get('recruiter_name') || '',
      recruiter_email: searchParams.get('recruiter_email') || '',
      job_role: searchParams.get('job_role') || '',
    };
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await recruiterService.getRecruiterEmails(filters, page, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Recruiter emails GET error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch recruiter emails' }, { status: 500 });
  }
}

/**
 * POST /api/recruiter-emails
 * Access: Admin only
 * Body: { company_name, recruiter_name, recruiter_email, job_role }
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
    const result = await recruiterService.addRecruiterEmail(body, session.user.id);

    if (!result.success) {
      const status = result.isDuplicate ? 409 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ message: 'Recruiter email added successfully', record: result.record }, { status: 201 });
  } catch (error) {
    console.error('Recruiter email POST error:', error.message);
    return NextResponse.json({ error: 'Failed to add recruiter email' }, { status: 500 });
  }
}
