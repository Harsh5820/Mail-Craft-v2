import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { canGenerateTemplate, incrementGenerationCount, generatePersonalizedTemplate } from '@/services/ai.service';

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
    const check = await canGenerateTemplate(session.user.id);
    if (!check.allowed) {
      return NextResponse.json(
        { error: 'Daily AI generation limit reached (2/day). Please try again tomorrow.' },
        { status: 429 }
      );
    }

    const { objective } = await req.json();
    if (!objective || objective.trim().length < 10) {
      return NextResponse.json({ error: 'Please provide a clearer objective (min 10 characters).' }, { status: 400 });
    }

    const user = await User.findById(session.user.id);
    const profile = {
      name: user.name,
      ...user.profile,
    };

    // Call Gemini
    const result = await generatePersonalizedTemplate(profile, objective);

    // Increment count after successful generation
    await incrementGenerationCount(session.user.id);

    return NextResponse.json({
      subject: result.subject,
      html: result.html,
      remainingGenerations: check.remaining - 1,
    });
  } catch (error) {
    console.error('AI Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate template' }, { status: 500 });
  }
}
