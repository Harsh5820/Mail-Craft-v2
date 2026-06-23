/**
 * recruiter.service.js
 *
 * Handles all recruiter email batch operations:
 * - Admin uploads (textarea → batch)
 * - Premium/admin reads (batches, newest-first)
 * - Admin delete (single batch, bulk batch)
 * - One-time migration from legacy RecruiterEmail flat records
 */

import dbConnect from '@/lib/db';
import RecruiterBatch from '@/lib/models/RecruiterBatch';
import mongoose from 'mongoose';

// RFC-5322 simplified but practical email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate a single email address string.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email);
}

/**
 * Parse and validate a comma-separated email input string.
 * Returns categorized results — does not touch the database.
 *
 * Processing steps (all done server-side):
 * 1. Split on commas
 * 2. Trim whitespace from every token
 * 3. Convert to lowercase
 * 4. Remove empty strings from consecutive/trailing commas
 * 5. Validate each email
 * 6. Deduplicate within the submission (keep first occurrence)
 *
 * @param {string} rawText - Raw comma-separated email string from admin textarea
 * @returns {{ validEmails: string[], invalidEmails: string[], inSubmissionDuplicates: string[] }}
 */
export function parseEmailText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { validEmails: [], invalidEmails: [], inSubmissionDuplicates: [] };
  }

  const tokens = rawText
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);

  const seen = new Set();
  const validEmails = [];
  const invalidEmails = [];
  const inSubmissionDuplicates = [];

  for (const token of tokens) {
    if (!isValidEmail(token)) {
      invalidEmails.push(token);
      continue;
    }
    if (seen.has(token)) {
      inSubmissionDuplicates.push(token);
      continue;
    }
    seen.add(token);
    validEmails.push(token);
  }

  return { validEmails, invalidEmails, inSubmissionDuplicates };
}

/**
 * Upload a batch of recruiter emails from admin textarea input.
 * Creates one RecruiterBatch document for this submission.
 *
 * Returns detailed stats so the admin can see exactly what happened.
 *
 * @param {string} emailText - Raw comma-separated emails from admin textarea
 * @param {string} adminUserId - MongoDB ObjectId string of the uploading admin
 * @returns {{
 *   success: boolean,
 *   stats: {
 *     total: number,        // total tokens after split/trim (non-empty)
 *     valid: number,        // passed format validation and not a duplicate-in-submission
 *     invalid: number,      // failed email format validation
 *     inSubmissionDuplicates: number, // duplicate within this paste (only first kept)
 *     dbDuplicates: number, // already exist in the database
 *     uploaded: number,     // actually stored in new batch
 *   },
 *   invalidEmails: string[],
 *   batchId?: string,
 *   error?: string
 * }}
 */
export async function uploadBatch(emailText, adminUserId, category = 'Other') {
  await dbConnect();

  // Empty / whitespace-only check
  if (!emailText || !emailText.trim() || emailText.replace(/[,\s]/g, '').length === 0) {
    return {
      success: false,
      error: 'Input is empty. Please paste at least one email address.',
      stats: { total: 0, valid: 0, invalid: 0, inSubmissionDuplicates: 0, dbDuplicates: 0, uploaded: 0 },
      invalidEmails: [],
    };
  }

  // Step 1–6: parse, validate, dedup within submission
  const { validEmails, invalidEmails, inSubmissionDuplicates } = parseEmailText(emailText);

  const totalTokens =
    validEmails.length + invalidEmails.length + inSubmissionDuplicates.length;

  if (validEmails.length === 0) {
    return {
      success: false,
      error: 'No valid email addresses found. Please check your input.',
      stats: {
        total: totalTokens,
        valid: 0,
        invalid: invalidEmails.length,
        inSubmissionDuplicates: inSubmissionDuplicates.length,
        dbDuplicates: 0,
        uploaded: 0,
      },
      invalidEmails,
    };
  }

  // Step 7: check which valid emails already exist across ALL existing batches
  const existingBatches = await RecruiterBatch.find(
    { emails: { $in: validEmails } },
    { emails: 1, _id: 0 }
  ).lean();

  const existingEmailSet = new Set();
  for (const batch of existingBatches) {
    for (const email of batch.emails) {
      existingEmailSet.add(email);
    }
  }

  const dbDuplicates = validEmails.filter((e) => existingEmailSet.has(e));
  const newEmails = validEmails.filter((e) => !existingEmailSet.has(e));

  if (newEmails.length === 0) {
    return {
      success: false,
      error: 'All valid emails already exist in the database. Nothing new to upload.',
      stats: {
        total: totalTokens,
        valid: validEmails.length,
        invalid: invalidEmails.length,
        inSubmissionDuplicates: inSubmissionDuplicates.length,
        dbDuplicates: dbDuplicates.length,
        uploaded: 0,
      },
      invalidEmails,
    };
  }

  // Step 8–10: store only new valid emails as a single batch
  const batch = await RecruiterBatch.create({
    emails: newEmails,
    emailCount: newEmails.length,
    uploadedBy: adminUserId,
    uploadedAt: new Date(),
    category,
  });

  return {
    success: true,
    stats: {
      total: totalTokens,
      valid: validEmails.length,
      invalid: invalidEmails.length,
      inSubmissionDuplicates: inSubmissionDuplicates.length,
      dbDuplicates: dbDuplicates.length,
      uploaded: newEmails.length,
    },
    invalidEmails,
    batchId: batch._id.toString(),
  };
}

/**
 * Get paginated batches for admin panel.
 * Includes all fields except uploadedBy user details.
 *
 * @param {number} page - 1-based page
 * @param {number} limit - batches per page
 * @returns {{ batches: Array, total: number, page: number, totalPages: number }}
 */
export async function getBatchesForAdmin(page = 1, limit = 20) {
  await dbConnect();

  const safeLimit = Math.min(Math.max(1, limit), 100);
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * safeLimit;

  const [batches, total] = await Promise.all([
    RecruiterBatch.find()
      .select('emails emailCount uploadedAt label createdAt category')
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    RecruiterBatch.countDocuments(),
  ]);

  return {
    batches,
    total,
    page: safePage,
    totalPages: Math.ceil(total / safeLimit),
  };
}

/**
 * Get paginated batches for premium users.
 * Does NOT expose uploadedBy, _id is converted to safe public id.
 * Only returns non-empty batches.
 *
 * @param {number} page - 1-based page
 * @param {number} limit - batches per page
 * @param {string} explicitCategory - Strictly filter by category, overriding interests
 * @returns {{ batches: Array, total: number, page: number, totalPages: number }}
 */
export async function getBatchesForPremium(page = 1, limit = 20, isPremium = false, interests = [], explicitCategory = null) {
  await dbConnect();

  const safeLimit = Math.min(Math.max(1, limit), 50);
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * safeLimit;

  // Only batches with at least 1 email
  const query = { emailCount: { $gt: 0 } };

  // Filter by interests if provided
  if (explicitCategory) {
    query.category = explicitCategory;
  } else if (interests && interests.length > 0) {
    // Strictly filter by what user selected
    query.category = { $in: interests };
  } else {
    // If user has no interests selected, only show 'Other' batches (or default fallback) 
    // rather than exposing everything
    query.category = 'Other';
  }

  const [batches, total] = await Promise.all([
    RecruiterBatch.find(query)
      .select('emails emailCount uploadedAt category') // explicitly exclude uploadedBy
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    RecruiterBatch.countDocuments(query),
  ]);

  // Return safe public shape
  const safeBatches = batches.map((b) => {
    let emailsToReturn = b.emails;
    if (!isPremium) {
      // Free users only see max 2 emails per batch
      emailsToReturn = b.emails.slice(0, 2);
      if (b.emails.length > 2) {
        // Mask the rest
        emailsToReturn.push(...Array(b.emails.length - 2).fill('__LOCKED__'));
      }
    }

    return {
      id: b._id.toString(),
      uploadedAt: b.uploadedAt,
      emailCount: b.emailCount,
      category: b.category || 'Other',
      emails: emailsToReturn,
    };
  });

  return {
    batches: safeBatches,
    total,
    page: safePage,
    totalPages: Math.ceil(total / safeLimit),
    isPremium,
  };
}

/**
 * Delete a single batch by ID.
 * Admin-only operation.
 *
 * @param {string} batchId
 * @returns {boolean} true if deleted, false if not found or invalid ID
 */
export async function deleteBatch(batchId) {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(batchId)) return false;

  const result = await RecruiterBatch.findByIdAndDelete(batchId);
  return !!result;
}

/**
 * Bulk delete batches by array of IDs.
 * Admin-only operation. Silently skips invalid ObjectIds.
 *
 * @param {string[]} batchIds
 * @returns {{ deletedCount: number }}
 */
export async function bulkDeleteBatches(batchIds) {
  await dbConnect();

  if (!Array.isArray(batchIds) || batchIds.length === 0) {
    return { deletedCount: 0 };
  }

  const validIds = batchIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (validIds.length === 0) return { deletedCount: 0 };

  const result = await RecruiterBatch.deleteMany({ _id: { $in: validIds } });
  return { deletedCount: result.deletedCount };
}

/**
 * One-time migration: reads all legacy RecruiterEmail flat records and
 * groups them into a single RecruiterBatch marked as "Migrated Legacy Data".
 *
 * Safe to call multiple times — idempotent via label check.
 * Does NOT delete legacy RecruiterEmail records.
 *
 * @returns {{ migrated: boolean, emailCount: number, message: string }}
 */
export async function migrateLegacyEmails() {
  await dbConnect();

  // Skip if migration batch already exists
  const existing = await RecruiterBatch.findOne({ label: 'migrated_legacy' }).lean();
  if (existing) {
    return {
      migrated: false,
      emailCount: 0,
      message: 'Migration already completed previously. Skipped.',
    };
  }

  // Dynamically import the old model to avoid circular deps
  let RecruiterEmail;
  try {
    const mod = await import('@/lib/models/RecruiterEmail.js');
    RecruiterEmail = mod.default;
  } catch {
    return { migrated: false, emailCount: 0, message: 'Legacy RecruiterEmail model not found. Skipped.' };
  }

  const legacyRecords = await RecruiterEmail.find({})
    .select('recruiter_email uploadedBy createdAt')
    .lean();

  if (legacyRecords.length === 0) {
    return { migrated: false, emailCount: 0, message: 'No legacy records found. Skipped.' };
  }

  // Deduplicate legacy emails
  const seen = new Set();
  const emails = [];
  let earliestDate = new Date();
  let uploadedBy = null;

  for (const rec of legacyRecords) {
    const email = (rec.recruiter_email || '').toLowerCase().trim();
    if (email && !seen.has(email)) {
      seen.add(email);
      emails.push(email);
    }
    if (rec.createdAt && rec.createdAt < earliestDate) {
      earliestDate = rec.createdAt;
    }
    if (!uploadedBy && rec.uploadedBy) {
      uploadedBy = rec.uploadedBy;
    }
  }

  if (emails.length === 0) {
    return { migrated: false, emailCount: 0, message: 'No valid emails in legacy records. Skipped.' };
  }

  // Use a fallback system admin ID if no uploadedBy exists
  const adminId =
    uploadedBy ||
    new mongoose.Types.ObjectId('000000000000000000000000');

  await RecruiterBatch.create({
    emails,
    emailCount: emails.length,
    uploadedBy: adminId,
    uploadedAt: earliestDate,
    label: 'migrated_legacy',
  });

  return {
    migrated: true,
    emailCount: emails.length,
    message: `Migrated ${emails.length} email(s) from legacy RecruiterEmail records into one batch.`,
  };
}
