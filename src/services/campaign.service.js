import dbConnect from '@/lib/db';
import Campaign from '@/lib/models/Campaign';
import CampaignLog from '@/lib/models/CampaignLog';

/**
 * Get all campaigns for a user
 */
export async function getUserCampaigns(userId) {
  await dbConnect();
  return Campaign.find({ userId })
    .populate('templateId', 'name subject')
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Get a single campaign with full details
 */
export async function getCampaign(campaignId, userId) {
  await dbConnect();
  return Campaign.findOne({ _id: campaignId, userId })
    .populate('templateId')
    .lean();
}

/**
 * Update campaign status
 */
export async function updateCampaignStatus(campaignId, status) {
  await dbConnect();
  return Campaign.findByIdAndUpdate(campaignId, { status }, { new: true });
}

/**
 * Create a new campaign
 */
export async function createCampaign(userId, data) {
  await dbConnect();
  return Campaign.create({
    userId,
    ...data,
    totalEmails: data.csvData?.length || 0,
    pendingCount: data.csvData?.length || 0,
  });
}

/**
 * Get campaign progress
 */
export async function getCampaignProgress(campaignId, userId) {
  await dbConnect();
  const campaign = await Campaign.findOne({ _id: campaignId, userId })
    .select('status totalEmails sentCount failedCount pendingCount currentIndex startedAt completedAt errorMessage')
    .lean();

  if (!campaign) return null;

  // Get recent logs
  const recentLogs = await CampaignLog.find({ campaignId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return {
    ...campaign,
    progress: campaign.totalEmails > 0
      ? Math.round(((campaign.sentCount + campaign.failedCount) / campaign.totalEmails) * 100)
      : 0,
    recentLogs,
  };
}

/**
 * Delete a campaign (only if not running)
 */
export async function deleteCampaign(campaignId, userId) {
  await dbConnect();
  const campaign = await Campaign.findOne({ _id: campaignId, userId });
  if (!campaign) return null;
  if (campaign.status === 'running') {
    throw new Error('Cannot delete a running campaign. Pause or cancel it first.');
  }

  // Delete associated logs
  await CampaignLog.deleteMany({ campaignId });
  return Campaign.findByIdAndDelete(campaignId);
}

/**
 * Get campaign analytics for a user
 */
export async function getCampaignAnalytics(userId) {
  await dbConnect();

  const [totalCampaigns, stats, recentActivity] = await Promise.all([
    Campaign.countDocuments({ userId }),
    Campaign.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalSent: { $sum: '$sentCount' },
          totalFailed: { $sum: '$failedCount' },
          totalEmails: { $sum: '$totalEmails' },
        },
      },
    ]),
    Campaign.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name status sentCount totalEmails createdAt')
      .lean(),
  ]);

  const s = stats[0] || { totalSent: 0, totalFailed: 0, totalEmails: 0 };

  return {
    totalCampaigns,
    totalSent: s.totalSent,
    totalFailed: s.totalFailed,
    totalEmails: s.totalEmails,
    successRate: s.totalEmails > 0 ? Math.round((s.totalSent / s.totalEmails) * 100) : 0,
    recentActivity,
  };
}
