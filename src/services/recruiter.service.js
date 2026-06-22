import dbConnect from '@/lib/db';
import RecruiterEmail from '@/lib/models/RecruiterEmail';
import mongoose from 'mongoose';

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

/**
 * Get paginated recruiter emails with optional search filters.
 * Available to admins and active premium users (access check done in API route).
 *
 * @param {object} filters - { company_name, recruiter_name, recruiter_email, job_role }
 * @param {number} page - 1-based page number
 * @param {number} limit - records per page (max 100)
 * @returns {{ records: Array, total: number, page: number, totalPages: number }}
 */
export async function getRecruiterEmails(filters = {}, page = 1, limit = 20) {
  await dbConnect();

  const safeLimit = Math.min(Math.max(1, limit), 100);
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * safeLimit;

  const query = {};
  if (filters.company_name) {
    query.company_name = { $regex: filters.company_name.trim(), $options: 'i' };
  }
  if (filters.recruiter_name) {
    query.recruiter_name = { $regex: filters.recruiter_name.trim(), $options: 'i' };
  }
  if (filters.recruiter_email) {
    query.recruiter_email = { $regex: filters.recruiter_email.trim(), $options: 'i' };
  }
  if (filters.job_role) {
    query.job_role = { $regex: filters.job_role.trim(), $options: 'i' };
  }

  const [records, total] = await Promise.all([
    RecruiterEmail.find(query)
      .select('company_name recruiter_name recruiter_email job_role createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    RecruiterEmail.countDocuments(query),
  ]);

  return {
    records,
    total,
    page: safePage,
    totalPages: Math.ceil(total / safeLimit),
  };
}

/**
 * Add a single recruiter email record.
 * Admin-only operation.
 *
 * @param {object} data - { company_name, recruiter_name, recruiter_email, job_role }
 * @param {string} adminUserId - ID of the admin creating the record
 * @returns {{ success: boolean, record?: object, error?: string, isDuplicate?: boolean }}
 */
export async function addRecruiterEmail(data, adminUserId) {
  await dbConnect();

  const { company_name, recruiter_name, recruiter_email, job_role } = data;

  // Validate required fields
  if (!company_name?.trim()) return { success: false, error: 'Company name is required' };
  if (!recruiter_name?.trim()) return { success: false, error: 'Recruiter name is required' };
  if (!recruiter_email?.trim()) return { success: false, error: 'Recruiter email is required' };
  if (!job_role?.trim()) return { success: false, error: 'Job role is required' };
  if (!EMAIL_REGEX.test(recruiter_email.trim())) {
    return { success: false, error: 'Invalid recruiter email address' };
  }

  try {
    const record = await RecruiterEmail.create({
      company_name: company_name.trim(),
      recruiter_name: recruiter_name.trim(),
      recruiter_email: recruiter_email.trim().toLowerCase(),
      job_role: job_role.trim(),
      uploadedBy: adminUserId,
    });
    return { success: true, record };
  } catch (err) {
    if (err.code === 11000) {
      return { success: false, error: 'Duplicate record: this recruiter email already exists for this company and role.', isDuplicate: true };
    }
    throw err;
  }
}

/**
 * Bulk insert recruiter emails from parsed CSV data.
 * Admin-only operation. Each row is validated individually.
 * Returns detailed stats per row.
 *
 * @param {Array<object>} rows - Array of { company_name, recruiter_name, recruiter_email, job_role }
 * @param {string} adminUserId
 * @returns {{ valid, invalid, duplicate, uploaded, failed, errors: Array<{row, error}> }}
 */
export async function bulkInsertRecruiterEmails(rows, adminUserId) {
  await dbConnect();

  let valid = 0;
  let invalid = 0;
  let duplicate = 0;
  let uploaded = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-based, +1 for header row

    // Skip empty rows
    if (!row.company_name && !row.recruiter_name && !row.recruiter_email && !row.job_role) {
      continue;
    }

    // Normalize values
    const company_name = (row.company_name || '').trim();
    const recruiter_name = (row.recruiter_name || '').trim();
    const recruiter_email = (row.recruiter_email || '').trim().toLowerCase();
    const job_role = (row.job_role || '').trim();

    // Validate fields
    if (!company_name) {
      invalid++;
      errors.push({ row: rowNum, error: 'company_name is required' });
      continue;
    }
    if (!recruiter_name) {
      invalid++;
      errors.push({ row: rowNum, error: 'recruiter_name is required' });
      continue;
    }
    if (!recruiter_email) {
      invalid++;
      errors.push({ row: rowNum, error: 'recruiter_email is required' });
      continue;
    }
    if (!EMAIL_REGEX.test(recruiter_email)) {
      invalid++;
      errors.push({ row: rowNum, error: `Invalid email: "${recruiter_email}"` });
      continue;
    }
    if (!job_role) {
      invalid++;
      errors.push({ row: rowNum, error: 'job_role is required' });
      continue;
    }

    valid++;

    try {
      await RecruiterEmail.create({
        company_name,
        recruiter_name,
        recruiter_email,
        job_role,
        uploadedBy: adminUserId,
      });
      uploaded++;
    } catch (err) {
      if (err.code === 11000) {
        duplicate++;
        errors.push({ row: rowNum, error: `Duplicate: ${recruiter_email} already exists for this company and role` });
      } else {
        failed++;
        errors.push({ row: rowNum, error: err.message });
      }
    }
  }

  return { valid, invalid, duplicate, uploaded, failed, errors };
}

/**
 * Delete a single recruiter email record by ID.
 * Admin-only operation.
 *
 * @param {string} id - RecruiterEmail document ID
 * @returns {boolean} true if deleted, false if not found
 */
export async function deleteRecruiterEmail(id) {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) return false;

  const result = await RecruiterEmail.findByIdAndDelete(id);
  return !!result;
}

/**
 * Bulk delete recruiter email records by an array of IDs.
 * Admin-only operation. Only deletes valid ObjectId entries.
 *
 * @param {string[]} ids - Array of RecruiterEmail document IDs
 * @returns {{ deletedCount: number }}
 */
export async function bulkDeleteRecruiterEmails(ids) {
  await dbConnect();

  if (!Array.isArray(ids) || ids.length === 0) {
    return { deletedCount: 0 };
  }

  // Filter to valid ObjectIds only to avoid errors and prevent deleting unrelated records
  const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));

  if (validIds.length === 0) return { deletedCount: 0 };

  const result = await RecruiterEmail.deleteMany({ _id: { $in: validIds } });
  return { deletedCount: result.deletedCount };
}
