import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import * as campaignService from '@/services/campaign.service';
import { startCampaignQueue, isCampaignActive } from '@/services/queue.service';
import { verifyCredentials } from '@/services/mail.service';
import { startCampaignSchema } from '@/schemas/campaign.schema';
import { canSendEmails, checkAndDowngradePlan } from '@/services/plan.service';
import dbConnect from '@/lib/db';

export async function POST(req, { params }) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check and downgrade plan if expired
    await dbConnect();
    const user = await checkAndDowngradePlan(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user can send any emails today
    const emailCheck = await canSendEmails(session.user.id, 1);
    if (!emailCheck.canSend) {
      return NextResponse.json(
        { error: emailCheck.reason || 'Daily email limit reached' },
        { status: 429 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    
    // Validate — but log errors clearly instead of crashing
    let validated;
    try {
      validated = startCampaignSchema.parse(body);
    } catch (zodErr) {
      console.error('Start campaign validation error:', JSON.stringify(zodErr.errors || zodErr.message));
      const msg = zodErr.errors?.[0]?.message || zodErr.message || 'Invalid input data';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Use senderName or fall back to name (both come from the frontend spread)
    const senderName = validated.senderName || validated.name || '';

    // Verify ownership
    const campaign = await campaignService.getCampaign(id, session.user.id);
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check if already running
    if (isCampaignActive(id)) {
      return NextResponse.json({ error: 'Campaign is already running' }, { status: 400 });
    }

    if (campaign.status === 'completed') {
      return NextResponse.json({ error: 'Campaign is already completed' }, { status: 400 });
    }

    // Verify SMTP credentials before starting
    const verification = await verifyCredentials(validated.email, validated.appPassword);
    if (!verification.valid) {
      return NextResponse.json(
        { error: `Invalid credentials: ${verification.error}` },
        { status: 400 }
      );
    }

    // Start the campaign queue (fire and forget)
    await startCampaignQueue(
      id,
      { email: validated.email, appPassword: validated.appPassword },
      {
        name: senderName,
        skills: validated.skills || '',
        portfolio: validated.portfolio || '',
        linkedin: validated.linkedin || '',
        experience: validated.experience || '',
      }
    );

    return NextResponse.json({ message: 'Campaign started', campaignId: id });
  } catch (error) {
    console.error('Start campaign unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Failed to start campaign' }, { status: 500 });
  }
}
