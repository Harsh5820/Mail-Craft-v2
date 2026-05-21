import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import * as campaignService from '@/services/campaign.service';
import { createCampaignSchema } from '@/schemas/campaign.schema';
import { checkRateLimit } from '@/services/security.service';
import { checkCampaignLimit } from '@/services/plan.service';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaigns = await campaignService.getUserCampaigns(session.user.id);
    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Get campaigns error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit campaign creation
    const rl = checkRateLimit(`campaign:create:${session.user.id}`, 10, 3600000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many campaigns created. Try again later.' }, { status: 429 });
    }

    // Check plan-based monthly campaign limit
    const campaignLimitCheck = await checkCampaignLimit(session.user.id);
    if (!campaignLimitCheck.allowed) {
      return NextResponse.json({ error: campaignLimitCheck.reason }, { status: 403 });
    }

    const body = await req.json();
    
    let validated;
    try {
      validated = createCampaignSchema.parse(body);
    } catch (zodErr) {
      console.error('Create campaign validation error:', JSON.stringify(zodErr.errors || zodErr.message));
      const msg = zodErr.errors?.[0]?.message || zodErr.message || 'Invalid campaign data';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const campaign = await campaignService.createCampaign(session.user.id, validated);
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('Create campaign error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create campaign' }, { status: 500 });
  }
}
