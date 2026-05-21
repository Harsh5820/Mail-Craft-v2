import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import * as campaignService from '@/services/campaign.service';

export async function GET(req, { params }) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const progress = await campaignService.getCampaignProgress(id, session.user.id);

    if (!progress) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Get progress error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}
