import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import * as campaignService from '@/services/campaign.service';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analytics = await campaignService.getCampaignAnalytics(session.user.id);
    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Get analytics error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
