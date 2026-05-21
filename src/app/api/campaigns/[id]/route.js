import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import * as campaignService from '@/services/campaign.service';
import { cancelCampaign, pauseCampaign, resumeCampaign } from '@/services/queue.service';

export async function GET(req, { params }) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const campaign = await campaignService.getCampaign(id, session.user.id);

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Get campaign error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    // Verify ownership
    const campaign = await campaignService.getCampaign(id, session.user.id);
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    switch (action) {
      case 'pause':
        pauseCampaign(id);
        await campaignService.updateCampaignStatus(id, 'paused');
        return NextResponse.json({ message: 'Campaign paused' });
      case 'resume':
        const resumed = resumeCampaign(id);
        if (!resumed) {
          return NextResponse.json({ 
            error: 'Session expired. Please click "New Campaign" and select this campaign to resume with credentials.' 
          }, { status: 400 });
        }
        await campaignService.updateCampaignStatus(id, 'running');
        return NextResponse.json({ message: 'Campaign resumed' });
      case 'cancel':
        cancelCampaign(id);
        await campaignService.updateCampaignStatus(id, 'cancelled');
        return NextResponse.json({ message: 'Campaign cancelled' });
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Update campaign error:', error.message);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const result = await campaignService.deleteCampaign(id, session.user.id);

    if (!result) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Campaign deleted' });
  } catch (error) {
    console.error('Delete campaign error:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to delete campaign' }, { status: 500 });
  }
}
