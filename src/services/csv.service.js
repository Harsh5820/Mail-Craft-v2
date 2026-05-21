import Papa from 'papaparse';

const REQUIRED_COLUMNS = ['company_name', 'recruiter_email', 'recruiter_name', 'job_role'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Parse and validate CSV text
 * Returns { valid, data, errors, duplicates, stats }
 */
export function parseAndValidateCSV(csvText) {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
  });

  const errors = [];
  const validRows = [];
  const emailSet = new Set();
  const duplicates = [];

  // Check required columns
  const headers = result.meta.fields || [];
  const missingColumns = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missingColumns.length > 0) {
    return {
      valid: false,
      data: [],
      errors: [`Missing required columns: ${missingColumns.join(', ')}`],
      duplicates: [],
      stats: { total: 0, valid: 0, invalid: 0, duplicates: 0 },
    };
  }

  // Validate each row
  result.data.forEach((row, index) => {
    const rowNum = index + 2; // +2 for header row and 1-indexing
    const rowErrors = [];

    // Check required fields
    if (!row.company_name?.trim()) {
      rowErrors.push(`Row ${rowNum}: Missing company name`);
    }
    if (!row.recruiter_name?.trim()) {
      rowErrors.push(`Row ${rowNum}: Missing recruiter name`);
    }
    if (!row.job_role?.trim()) {
      rowErrors.push(`Row ${rowNum}: Missing job role`);
    }

    // Validate email
    const email = row.recruiter_email?.trim().toLowerCase();
    if (!email) {
      rowErrors.push(`Row ${rowNum}: Missing email`);
    } else if (!EMAIL_REGEX.test(email)) {
      rowErrors.push(`Row ${rowNum}: Invalid email "${email}"`);
    } else if (emailSet.has(email)) {
      duplicates.push({ row: rowNum, email });
    } else {
      emailSet.add(email);
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else if (!duplicates.find((d) => d.email === email && d.row === rowNum)) {
      validRows.push({
        company_name: row.company_name.trim(),
        recruiter_email: email,
        recruiter_name: row.recruiter_name.trim(),
        job_role: row.job_role.trim(),
      });
    }
  });

  return {
    valid: errors.length === 0 && validRows.length > 0,
    data: validRows,
    errors,
    duplicates,
    stats: {
      total: result.data.length,
      valid: validRows.length,
      invalid: errors.length,
      duplicates: duplicates.length,
    },
  };
}

/**
 * Parse comma-separated emails (plain email list, no CSV headers).
 * Returns same shape as parseAndValidateCSV for consistency.
 */
export function parseCommaSeparatedEmails(text) {
  // Split by comma, newline, semicolon, or space
  const raw = text
    .split(/[,;\n\r\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const validRows = [];
  const errors = [];
  const emailSet = new Set();
  const duplicates = [];

  raw.forEach((email, index) => {
    if (!EMAIL_REGEX.test(email)) {
      errors.push(`"${email}" is not a valid email address`);
    } else if (emailSet.has(email)) {
      duplicates.push({ row: index + 1, email });
    } else {
      emailSet.add(email);
      validRows.push({
        company_name: '',
        recruiter_email: email,
        recruiter_name: '',
        job_role: '',
      });
    }
  });

  return {
    valid: validRows.length > 0,
    data: validRows,
    errors,
    duplicates,
    stats: {
      total: raw.length,
      valid: validRows.length,
      invalid: errors.length,
      duplicates: duplicates.length,
    },
  };
}

/**
 * Generate a CSV template string for download
 */
export function generateCSVTemplate() {
  return 'company_name,recruiter_email,recruiter_name,job_role\nGoogle,recruiter@google.com,John Doe,Frontend Developer\n';
}
