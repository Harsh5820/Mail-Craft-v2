import { GoogleGenAI } from '@google/genai';
import User from '@/lib/models/User';

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key is not configured.');
  return new GoogleGenAI({ apiKey });
};

export const AI_DAILY_LIMIT = 2;
export const ATS_MONTHLY_LIMIT = 15;

/**
 * Check if the user can generate an AI template today.
 */
export async function canGenerateTemplate(userId) {
  const user = await User.findById(userId).lean();
  if (!user) throw new Error('User not found');

  const now = new Date();

  // If no generation date or it's a different day, reset count
  if (!user.lastAIGenerationDate || user.lastAIGenerationDate.toDateString() !== now.toDateString()) {
    return { allowed: true, remaining: AI_DAILY_LIMIT };
  }

  // Same day
  if (user.aiGenerationsToday >= AI_DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: AI_DAILY_LIMIT - user.aiGenerationsToday };
}

/**
 * Increment the daily generation count.
 */
export async function incrementGenerationCount(userId) {
  const now = new Date();
  const user = await User.findById(userId).lean();
  if (!user) return;

  if (!user.lastAIGenerationDate || user.lastAIGenerationDate.toDateString() !== now.toDateString()) {
    await User.updateOne({ _id: userId }, { $set: { aiGenerationsToday: 1, lastAIGenerationDate: now } });
  } else {
    await User.updateOne({ _id: userId }, { $inc: { aiGenerationsToday: 1 } });
  }
}

/**
 * Generate a personalized email template using Gemini.
 */
export async function generatePersonalizedTemplate(profile, objective) {
  const ai = getClient();

  const prompt = `
You are an expert cold email copywriter and recruiter outreach specialist.
Your task is to write a highly converting, professional, and personalized cold email template.

User Profile Information:
- Name: ${profile.name || 'Not provided'}
- Headline: ${profile.headline || 'Not provided'}
- Skills: ${profile.skills || 'Not provided'}
- Experience: ${profile.experience || 'Not provided'}
- Interests/Domains: ${(profile.interests || []).join(', ') || 'Not specified'}

Campaign Objective:
${objective}

Instructions:
1. Write a subject line that is catchy and has a high open rate.
2. Write the email body. It should be concise, professional, and highlight the user's relevant skills and experience based on their profile.
3. Use the following placeholders exactly as written so our system can auto-fill them later:
   - {{recruiter_name}}
   - {{company_name}}
   - {{job_role}}
   - {{skills}}
   - {{experience}}
   - {{linkedin}}
   - {{portfolio}}
   - {{user_name}}
4. Format the email using basic HTML tags (<p>, <br>, <strong>, etc.) for formatting, as it will be sent via our rich text editor.

Return ONLY a JSON object with this exact structure:
{
  "subject": "The suggested subject line",
  "html": "The HTML formatted body of the email"
}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    }
  });

  try {
    const rawText = response.text;
    const parsed = JSON.parse(rawText);
    return parsed;
  } catch (error) {
    console.error('Failed to parse Gemini response:', response.text);
    throw new Error('AI returned an invalid format. Please try again.');
  }
}

/**
 * Check if user can run an ATS check this month.
 */
export async function canCheckAts(userId) {
  const user = await User.findById(userId).lean();
  if (!user) throw new Error('User not found');

  const now = new Date();

  if (!user.lastAtsCheckDate || user.lastAtsCheckDate.getMonth() !== now.getMonth() || user.lastAtsCheckDate.getFullYear() !== now.getFullYear()) {
    return { allowed: true, remaining: ATS_MONTHLY_LIMIT };
  }

  if (user.atsChecksThisMonth >= ATS_MONTHLY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: ATS_MONTHLY_LIMIT - user.atsChecksThisMonth };
}

/**
 * Increment the ATS check count.
 */
export async function incrementAtsCount(userId) {
  const now = new Date();
  const user = await User.findById(userId).lean();
  if (!user) return;

  if (!user.lastAtsCheckDate || user.lastAtsCheckDate.getMonth() !== now.getMonth() || user.lastAtsCheckDate.getFullYear() !== now.getFullYear()) {
    await User.updateOne({ _id: userId }, { $set: { atsChecksThisMonth: 1, lastAtsCheckDate: now } });
  } else {
    await User.updateOne({ _id: userId }, { $inc: { atsChecksThisMonth: 1 } });
  }
}

/**
 * Generate an ATS score and analysis using Gemini.
 */
export async function checkAtsScore(resumeText, targetRole) {
  const ai = getClient();

  const prompt = `
You are an expert ATS (Applicant Tracking System) parser and senior technical recruiter.
Your task is to analyze the provided resume text against the target role and provide an ATS compatibility score.

Target Role: ${targetRole}

Resume Text:
${resumeText.slice(0, 6000)}

Instructions:
1. Calculate a strict ATS Match Score out of 100 based on keywords, format, and relevance to the target role.
2. Provide a brief overall analysis (2-3 sentences).
3. List 3 key strengths.
4. List 3 actionable areas for improvement (e.g., missing keywords, formatting issues).

Return ONLY a JSON object with this exact structure:
{
  "score": 85,
  "analysis": "Overall analysis text here...",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "improvements": ["Improvement 1", "Improvement 2", "Improvement 3"]
}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    }
  });

  try {
    const rawText = response.text;
    return JSON.parse(rawText);
  } catch (error) {
    console.error('Failed to parse Gemini ATS response:', response.text);
    throw new Error('Failed to analyze resume. Please try again.');
  }
}

