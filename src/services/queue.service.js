import Campaign from '@/lib/models/Campaign';
import CampaignLog from '@/lib/models/CampaignLog';
import User from '@/lib/models/User';
import { createTransporter, renderTemplate, sendEmail, destroyTransporter } from './mail.service';
import { canSendEmails, incrementDailySendCount, PLAN_CONFIG, checkAndDowngradePlan, resetDailySendCountIfNeeded } from './plan.service';

/**
 * In-memory active campaigns tracker.
 * Maps campaignId -> { paused: boolean, cancelled: boolean }
 */
const activeCampaigns = new Map();

/**
 * Sleep for given milliseconds
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Anti-spam configuration
 * Fixed 3000ms delay between consecutive emails (sequential, non-cumulative).
 * Email 1 is sent immediately; every subsequent email waits exactly 3000ms.
 */
const ANTI_SPAM = {
  delayBetweenEmails: 3000, // Fixed 3 seconds between emails (not per index)
  dailyLimit: 80,           // Safe daily session limit for Gmail
};

/**
 * Start processing a campaign
 * This runs asynchronously — call and forget
 */
export async function startCampaignQueue(campaignId, credentials, senderInfo, attachment = null) {
  // Mark campaign as active
  activeCampaigns.set(campaignId, { paused: false, cancelled: false });

  // Run in background — don't await
  processCampaign(campaignId, credentials, senderInfo, attachment).catch(async (error) => {
    console.error(`Campaign ${campaignId} fatal error:`, error.message);
    await Campaign.findByIdAndUpdate(campaignId, {
      status: 'failed',
      errorMessage: error.message,
    });
    activeCampaigns.delete(campaignId);
  });

  return { started: true };
}

/**
 * Core campaign processing loop
 */
async function processCampaign(campaignId, credentials, senderInfo, attachment = null) {
  let transporter = null;

  try {
    // Create transporter
    transporter = createTransporter(credentials.email, credentials.appPassword);

    // Get campaign with template
    const campaign = await Campaign.findById(campaignId).populate('templateId');
    if (!campaign || !campaign.templateId) {
      throw new Error('Campaign or template not found');
    }

    // Get user, check plan, and reset daily send count if needed (single prep check)
    let user = await checkAndDowngradePlan(campaign.userId);
    if (!user) {
      throw new Error('User not found');
    }
    user = await resetDailySendCountIfNeeded(campaign.userId);

    const template = campaign.templateId;
    const recipients = campaign.csvData;
    const startIndex = campaign.currentIndex || 0;
    let sentInSession = 0;
    // Track whether this is the very first send attempt in this session.
    // Email 1 is sent immediately; every subsequent email waits ANTI_SPAM.delayBetweenEmails ms.
    let isFirstEmail = true;

    // Update status to running
    await Campaign.findByIdAndUpdate(campaignId, {
      status: 'running',
      startedAt: campaign.startedAt || new Date(),
    });

    // Process recipients
    for (let i = startIndex; i < recipients.length; i++) {
      // Check if paused or cancelled
      const state = activeCampaigns.get(campaignId);
      if (!state || state.cancelled) {
        await Campaign.findByIdAndUpdate(campaignId, {
          status: 'cancelled',
          currentIndex: i,
        });
        break;
      }

      if (state.paused) {
        await Campaign.findByIdAndUpdate(campaignId, {
          status: 'paused',
          currentIndex: i,
        });
        // Wait until resumed or cancelled
        while (state.paused && !state.cancelled) {
          await sleep(2000);
        }
        if (state.cancelled) {
          await Campaign.findByIdAndUpdate(campaignId, { status: 'cancelled', currentIndex: i });
          break;
        }
        await Campaign.findByIdAndUpdate(campaignId, { status: 'running' });
      }

      // Check plan-based daily limit using local cached state (massive speedup!)
      const limits = PLAN_CONFIG[user.plan] || PLAN_CONFIG.free;
      
      // Since anti-spam delays can cause campaigns to cross the 24h threshold,
      // let's do a fast local timestamp check to see if we should reset user's daily count
      const now = new Date();
      const lastSend = user.lastSendDate ? new Date(user.lastSendDate) : null;
      if (!lastSend || now.getTime() - lastSend.getTime() > 24 * 60 * 60 * 1000) {
        user.dailySendCount = 0;
        user.lastSendDate = now;
        // Fast direct reset in DB
        await User.findByIdAndUpdate(campaign.userId, { dailySendCount: 0, lastSendDate: now });
      }

      const remaining = limits.dailyEmails - user.dailySendCount;
      if (remaining <= 0) {
        await Campaign.findByIdAndUpdate(campaignId, {
          status: 'paused',
          currentIndex: i,
          errorMessage: `Daily email limit (${limits.dailyEmails}) reached for ${user.plan} plan. Try tomorrow.`,
        });
        break;
      }

      // Also respect Gmail anti-spam safety limit (hard cap)
      if (sentInSession >= ANTI_SPAM.dailyLimit) {
        await Campaign.findByIdAndUpdate(campaignId, {
          status: 'paused',
          currentIndex: i,
          errorMessage: 'Gmail safety limit reached. Will resume tomorrow.',
        });
        break;
      }

      const recipient = recipients[i];

      // ===== ANTI-SPAM FIXED DELAY =====
      // Email 1 is sent immediately. Every subsequent email waits exactly 3000ms before sending.
      // Delay is checked here (before the send attempt) so failures/retries do NOT accumulate extra time.
      if (isFirstEmail) {
        isFirstEmail = false;
      } else {
        await sleep(ANTI_SPAM.delayBetweenEmails);
      }

      try {
        // Render email
        const data = {
          ...recipient,
          user_name: senderInfo.name || '',
          skills: senderInfo.skills || '',
          portfolio: senderInfo.portfolio || '',
          linkedin: senderInfo.linkedin || '',
          experience: senderInfo.experience || '',
          github: senderInfo.github || '',
          contact_number_1: senderInfo.contact_number_1 || '',
          contact_number_2: senderInfo.contact_number_2 || '',
        };

        const renderedSubject = renderTemplate(template.subject, data);
        const renderedHtml = renderTemplate(template.html, data);

        // Build attachments
        const attachments = [];
        
        // Use inline attachment (immediate send) or DB attachment (scheduled send)
        const finalAttachment = attachment || (campaign.resumeBase64 && campaign.resumeFileName ? {
          resumeBase64: campaign.resumeBase64,
          resumeFileName: campaign.resumeFileName
        } : null);

        if (finalAttachment && finalAttachment.resumeBase64 && finalAttachment.resumeFileName) {
          const base64Data = finalAttachment.resumeBase64.replace(/^data:.*?;base64,/, '');
          attachments.push({
            filename: finalAttachment.resumeFileName,
            content: Buffer.from(base64Data, 'base64'),
          });
        }

        // Send email
        await sendEmail(transporter, {
          from: { name: senderInfo.name, email: credentials.email },
          to: recipient.recruiter_email,
          subject: renderedSubject,
          html: renderedHtml,
          attachments,
        });

        // Increment daily send count in DB and update local cache
        await incrementDailySendCount(campaign.userId, 1);
        user.dailySendCount++;
        user.lastSendDate = new Date();

        // Log success
        await CampaignLog.create({
          campaignId,
          userId: campaign.userId,
          recipientEmail: recipient.recruiter_email,
          recipientName: recipient.recruiter_name || '',
          company: recipient.company_name || '',
          status: 'sent',
          sentAt: new Date(),
        });

        sentInSession++;

        // Update campaign counters
        await Campaign.findByIdAndUpdate(campaignId, {
          $inc: { sentCount: 1 },
          currentIndex: i + 1,
          pendingCount: recipients.length - (i + 1),
        });
      } catch (sendError) {
        // Log failure
        await CampaignLog.create({
          campaignId,
          userId: campaign.userId,
          recipientEmail: recipient.recruiter_email,
          recipientName: recipient.recruiter_name || '',
          company: recipient.company_name || '',
          status: 'failed',
          errorMessage: sendError.message,
        });

        await Campaign.findByIdAndUpdate(campaignId, {
          $inc: { failedCount: 1 },
          currentIndex: i + 1,
          pendingCount: recipients.length - (i + 1),
        });
      }
    }

    // Campaign complete
    const finalState = activeCampaigns.get(campaignId);
    if (finalState && !finalState.cancelled) {
      await Campaign.findByIdAndUpdate(campaignId, {
        status: 'completed',
        completedAt: new Date(),
      });
    }
  } finally {
    // ALWAYS destroy credentials and transporter
    destroyTransporter(transporter);
    activeCampaigns.delete(campaignId);

    // Clean up temporary resume from DB to free up space (scheduled runs)
    try {
      await Campaign.findByIdAndUpdate(campaignId, { 
        $unset: { resumeBase64: 1, resumeFileName: 1 } 
      });
    } catch (e) {
      // Silent cleanup
    }
  }
}

/**
 * Pause a running campaign
 */
export function pauseCampaign(campaignId) {
  const state = activeCampaigns.get(campaignId);
  if (state) {
    state.paused = true;
    return true;
  }
  return false;
}

/**
 * Resume a paused campaign
 */
export function resumeCampaign(campaignId) {
  const state = activeCampaigns.get(campaignId);
  if (state) {
    state.paused = false;
    return true;
  }
  return false;
}

/**
 * Cancel a campaign
 */
export function cancelCampaign(campaignId) {
  const state = activeCampaigns.get(campaignId);
  if (state) {
    state.cancelled = true;
    state.paused = false;
    return true;
  }
  return false;
}

/**
 * Check if a campaign is actively running
 */
export function isCampaignActive(campaignId) {
  return activeCampaigns.has(campaignId);
}
