import dbConnect from '@/lib/db';
import PlanRequest from '@/lib/models/PlanRequest';
import User from '@/lib/models/User';
import AuditLog from '@/lib/models/AuditLog';

/**
 * Get all pending upgrade requests
 */
export async function getPendingRequests() {
  await dbConnect();
  return PlanRequest.find({ status: 'pending' })
    .populate('userId', 'name email plan planExpiresAt')
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Approve or Reject a plan request
 * Daily plan: 24 hours from now
 * Monthly plan: 30 days from now
 */
export async function updateRequestStatus(requestId, status) {
  await dbConnect();
  
  if (!['approved', 'rejected'].includes(status)) {
    throw new Error('Invalid status');
  }

  const request = await PlanRequest.findById(requestId);
  if (!request || request.status !== 'pending') {
    throw new Error('Request not found or already processed');
  }

  request.status = status;
  request.reviewedAt = new Date();
  await request.save();

  if (status === 'approved') {
    const expiresAt = new Date();
    
    // Set expiry based on plan type
    if (request.plan === 'daily') {
      // 24 hours from now
      expiresAt.setDate(expiresAt.getDate() + 1);
    } else if (request.plan === 'monthly') {
      // 30 days from now
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    const updatedUser = await User.findByIdAndUpdate(request.userId, {
      $set: {
        plan: request.plan,
        planExpiresAt: expiresAt,
        dailySendCount: 0, // reset on upgrade
        lastSendDate: null,
      }
    }, { new: true });

    // Handle Subscription Referral Bonus (+10 days to referrer)
    if (updatedUser.referredBy) {
      const referrer = await User.findById(updatedUser.referredBy);
      if (referrer) {
        const now = new Date();
        if (referrer.plan === 'free' || !referrer.planExpiresAt || referrer.planExpiresAt < now) {
          referrer.plan = 'daily'; // Temporary premium
          referrer.planExpiresAt = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
          referrer.dailySendCount = 0;
        } else {
          // Extend existing plan
          referrer.planExpiresAt = new Date(referrer.planExpiresAt.getTime() + 10 * 24 * 60 * 60 * 1000);
        }
        await referrer.save();
      }
    }

    // Log the upgrade in audit log
    try {
      await AuditLog.create({
        userId: request.userId,
        action: 'plan_upgrade',
        details: `Upgraded to ${request.plan} plan, expires at ${expiresAt.toISOString()}`,
        ip: '',
      });
    } catch (e) {
      // Silently ignore audit log errors
    }
  }

  return request;
}
