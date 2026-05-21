import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

/**
 * Plan configuration with pricing and limits
 */
export const PLAN_CONFIG = {
  free: {
    name: 'Free',
    price: 0,
    currency: 'rs',
    dailyEmails: 20,
    templates: 2,
    campaignsPerMonth: 3,
  },
  daily: {
    name: 'Daily',
    price: 10,
    currency: 'rs',
    dailyEmails: 100,
    templates: 50,
    campaignsPerMonth: 30,
  },
  monthly: {
    name: 'Monthly',
    price: 1000,
    currency: 'rs',
    dailyEmails: 300,
    templates: -1, // unlimited
    campaignsPerMonth: -1, // unlimited
  },
};

/**
 * Check if a plan has expired and auto-downgrade to free if needed
 * Returns the updated user document
 */
export async function checkAndDowngradePlan(userId) {
  await dbConnect();

  const user = await User.findById(userId);
  if (!user) return null;

  // If user is already on free plan, nothing to check
  if (user.plan === 'free') return user;

  // If plan has expiry date and it's in the past, downgrade
  if (user.planExpiresAt && new Date(user.planExpiresAt) < new Date()) {
    user.plan = 'free';
    user.planExpiresAt = null;
    user.dailySendCount = 0;
    user.lastSendDate = null;
    await user.save();
    return user;
  }

  return user;
}

/**
 * Reset daily email count if 24 hours have passed
 */
export async function resetDailySendCountIfNeeded(userId) {
  await dbConnect();

  const user = await User.findById(userId);
  if (!user) return null;

  const now = new Date();
  const lastSend = user.lastSendDate ? new Date(user.lastSendDate) : null;

  // If no last send date, or more than 24 hours have passed, reset count
  if (!lastSend || now.getTime() - lastSend.getTime() > 24 * 60 * 60 * 1000) {
    user.dailySendCount = 0;
    user.lastSendDate = now;
    await user.save();
    return user;
  }

  return user;
}

/**
 * Increment daily send count and update lastSendDate
 */
export async function incrementDailySendCount(userId, increment = 1) {
  await dbConnect();

  // Reset first if needed
  await resetDailySendCountIfNeeded(userId);

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $inc: { dailySendCount: increment },
      lastSendDate: new Date(),
    },
    { new: true }
  );

  return user;
}

/**
 * Get remaining emails user can send today
 */
export async function getRemainingDailyEmails(userId) {
  await dbConnect();

  // First check if plan expired
  let user = await checkAndDowngradePlan(userId);
  if (!user) return { allowed: 0, remaining: 0, reason: 'User not found' };

  // Reset count if needed
  user = await resetDailySendCountIfNeeded(userId);

  const limits = PLAN_CONFIG[user.plan] || PLAN_CONFIG.free;
  const remaining = Math.max(0, limits.dailyEmails - user.dailySendCount);

  return {
    plan: user.plan,
    allowed: limits.dailyEmails,
    used: user.dailySendCount,
    remaining,
    planExpiresAt: user.planExpiresAt,
    lastSendDate: user.lastSendDate,
  };
}

/**
 * Check if user can send N emails today
 * Returns { canSend, reason, remaining }
 */
export async function canSendEmails(userId, emailCount = 1) {
  await dbConnect();

  // First check if plan expired
  let user = await checkAndDowngradePlan(userId);
  if (!user) return { canSend: false, reason: 'User not found' };

  // Reset count if needed
  user = await resetDailySendCountIfNeeded(userId);

  const limits = PLAN_CONFIG[user.plan] || PLAN_CONFIG.free;
  const remaining = limits.dailyEmails - user.dailySendCount;

  if (remaining <= 0) {
    return {
      canSend: false,
      reason: `Daily email limit (${limits.dailyEmails}) reached for ${user.plan} plan. Try tomorrow.`,
      plan: user.plan,
      allowed: limits.dailyEmails,
      used: user.dailySendCount,
      remaining: 0,
    };
  }

  if (remaining < emailCount) {
    return {
      canSend: true, // Allow partial send
      reason: `Only ${remaining} emails remaining today`,
      plan: user.plan,
      allowed: limits.dailyEmails,
      used: user.dailySendCount,
      remaining,
      partial: true,
    };
  }

  return {
    canSend: true,
    plan: user.plan,
    allowed: limits.dailyEmails,
    used: user.dailySendCount,
    remaining,
  };
}

/**
 * Get plan expiry info for display
 */
export async function getPlanExpiryInfo(userId) {
  await dbConnect();

  let user = await checkAndDowngradePlan(userId);
  if (!user) return null;

  if (user.plan === 'free') {
    return {
      plan: 'free',
      planName: PLAN_CONFIG.free.name,
      expiresAt: null,
      daysRemaining: null,
      status: 'active',
    };
  }

  const expiresAt = new Date(user.planExpiresAt);
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diff / (24 * 60 * 60 * 1000));

  return {
    plan: user.plan,
    planName: PLAN_CONFIG[user.plan].name,
    expiresAt: user.planExpiresAt,
    daysRemaining: Math.max(0, daysRemaining),
    hoursRemaining: Math.max(0, Math.ceil(diff / (60 * 60 * 1000))),
    status: daysRemaining <= 0 ? 'expired' : daysRemaining <= 1 ? 'expiring_soon' : 'active',
  };
}
