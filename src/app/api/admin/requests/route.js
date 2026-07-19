import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import * as adminService from '@/services/admin.service';

export async function GET(req) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    //added new layes of fix
    //new fix man
    const requests = await adminService.getPendingRequests();
    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Admin get requests error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = await getSession();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { requestId, status } = body;

    if (!requestId || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const updated = await adminService.updateRequestStatus(requestId, status);
    return NextResponse.json({ message: 'Request updated', request: updated });
  } catch (error) {
    console.error('Admin update request error:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to update request' }, { status: 500 });
  }
}
