import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import * as templateService from '@/services/template.service';
import { createTemplateSchema } from '@/schemas/template.schema';
import { checkRateLimit } from '@/services/security.service';
import { checkTemplateLimit } from '@/services/plan.service';
import { z } from 'zod';

export async function GET(req) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await templateService.getUserTemplates(session.user.id, page, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Get templates error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit
    const rl = checkRateLimit(`template:${session.user.id}`, 30, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Check plan-based template limit
    const templateLimitCheck = await checkTemplateLimit(session.user.id);
    if (!templateLimitCheck.allowed) {
      return NextResponse.json({ error: templateLimitCheck.reason }, { status: 403 });
    }

    const body = await req.json();
    const validated = createTemplateSchema.parse(body);

    const template = await templateService.createTemplate(session.user.id, validated);
    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Create template error:', error.message);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
