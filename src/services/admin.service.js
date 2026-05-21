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
        lastSendDate: new Date(),
      }
    }, { new: true });

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
