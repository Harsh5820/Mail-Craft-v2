import dbConnect from '@/lib/db';
import Template from '@/lib/models/Template';

/**
 * Get all templates for a user
 */
export async function getUserTemplates(userId) {
  await dbConnect();
  return Template.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function getTemplate(templateId, userId) {
  await dbConnect();
  return Template.findOne({ _id: templateId, userId }).lean();
}

/**
 * Create a new template
 */
export async function createTemplate(userId, data) {
  await dbConnect();
  const placeholders = extractPlaceholders((data.html || '') + ' ' + (data.subject || ''));
  return Template.create({ userId, ...data, placeholders });
}

/**
 * Update a template
 */
export async function updateTemplate(templateId, userId, data) {
  await dbConnect();
  if (data.html || data.subject) {
    const existing = await Template.findOne({ _id: templateId, userId }).lean();
    const html = data.html || existing?.html || '';
    const subject = data.subject || existing?.subject || '';
    data.placeholders = extractPlaceholders(html + ' ' + subject);
  }
  return Template.findOneAndUpdate(
    { _id: templateId, userId },
    { $set: data },
    { new: true, runValidators: true }
  );
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId, userId) {
  await dbConnect();
  return Template.findOneAndDelete({ _id: templateId, userId });
}

/**
 * Duplicate a template
 */
export async function duplicateTemplate(templateId, userId) {
  await dbConnect();
  const original = await Template.findOne({ _id: templateId, userId }).lean();
  if (!original) return null;

  const { _id, createdAt, updatedAt, ...rest } = original;
  return Template.create({
    ...rest,
    name: `${rest.name} (Copy)`,
  });
}

/**
 * Extract all placeholder variables from a template string
 */
export function extractPlaceholders(text) {
  const matches = text.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))];
}
