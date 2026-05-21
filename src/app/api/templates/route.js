import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import * as templateService from '@/services/template.service';
import { createTemplateSchema } from '@/schemas/template.schema';
import { checkRateLimit } from '@/services/security.service';
import { z } from 'zod';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await templateService.getUserTemplates(session.user.id);
    return NextResponse.json({ templates });
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
