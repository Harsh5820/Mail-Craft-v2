import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { canCheckAts, incrementAtsCount, checkAtsScore } from '@/services/ai.service';

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'AI features are not enabled on this server.' }, { status: 503 });
    }

    await dbConnect();

    // Check limits
    const check = await canCheckAts(session.user.id);
    if (!check.allowed) {
      return NextResponse.json(
        { error: 'Monthly ATS check limit reached (15/month). Please try again next month.' },
        { status: 429 }
      );
    }

    const { resumeText, targetRole } = await req.json();
    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json({ error: 'Please provide a valid resume text (min 50 characters).' }, { status: 400 });
    }
    if (!targetRole || targetRole.trim().length < 3) {
      return NextResponse.json({ error: 'Please provide a valid target role.' }, { status: 400 });
    }

    // Call Gemini
    const result = await checkAtsScore(resumeText, targetRole);

    // Increment count after successful generation
    await incrementAtsCount(session.user.id);

    return NextResponse.json({
      ...result,
      remainingChecks: check.remaining - 1,
    });
  } catch (error) {
    console.error('ATS Check Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to check ATS score' }, { status: 500 });
  }
}
