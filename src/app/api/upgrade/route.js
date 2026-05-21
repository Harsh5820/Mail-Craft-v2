import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import PlanRequest from '@/lib/models/PlanRequest';

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { plan, upiId } = body;

    if (!['daily', 'monthly'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    if (!upiId || upiId.trim() === '') {
      return NextResponse.json({ error: 'UPI transaction ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Check if there is already a pending request
    const existing = await PlanRequest.findOne({ userId: session.user.id, status: 'pending' });
    if (existing) {
      return NextResponse.json({ error: 'You already have a pending upgrade request.' }, { status: 400 });
    }

    const request = await PlanRequest.create({
      userId: session.user.id,
      plan,
      upiId: upiId.trim(),
    });

    return NextResponse.json({ message: 'Upgrade request submitted successfully', request }, { status: 201 });
  } catch (error) {
    console.error('Upgrade request error:', error.message);
    return NextResponse.json({ error: 'Failed to submit upgrade request' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const request = await PlanRequest.findOne({ userId: session.user.id, status: 'pending' });
    return NextResponse.json({ request });
  } catch (error) {
    console.error('Get upgrade request error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch upgrade request' }, { status: 500 });
  }
}
