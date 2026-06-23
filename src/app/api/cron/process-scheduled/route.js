import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Campaign from '@/lib/models/Campaign';
import { startCampaignQueue } from '@/services/queue.service';
import { decryptCredentials } from '@/services/security.service';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  // Check authorization header or a secret token to prevent abuse
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    // Find all scheduled campaigns where scheduledAt is in the past or now
    const now = new Date();
    const scheduledCampaigns = await Campaign.find({
      status: 'scheduled',
      scheduledAt: { $lte: now }
    }).select('_id').lean();

    let processedCount = 0;
    for (const camp of scheduledCampaigns) {
      // Atomic lock: Only one concurrent cron invocation can claim this campaign
      const campaign = await Campaign.findOneAndUpdate(
        { _id: camp._id, status: 'scheduled' },
        { $set: { status: 'running', startedAt: new Date() } },
        { new: true }
      );

      if (!campaign) {
        continue; // Was already claimed by another cron invocation or manually started
      }
      if (!campaign.scheduledCredentials) {
        campaign.status = 'failed';
        campaign.errorMessage = 'Missing encrypted credentials for scheduled execution.';
        await campaign.save();
        continue;
      }

      try {
        const decrypted = decryptCredentials(campaign.scheduledCredentials);
        
        // Start queue
        await startCampaignQueue(
          campaign._id.toString(),
          { email: decrypted.email, appPassword: decrypted.appPassword },
          decrypted.senderInfo
        );
        processedCount++;
      } catch (err) {
        console.error(`Failed to start scheduled campaign ${campaign._id}:`, err);
        campaign.status = 'failed';
        campaign.errorMessage = `Failed to start scheduled campaign: ${err.message}`;
        await campaign.save();
      }
    }

    return NextResponse.json({ message: `Processed ${processedCount} scheduled campaigns` });
  } catch (error) {
    console.error('Cron process-scheduled error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
