import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import * as templateService from '@/services/template.service';
import { updateTemplateSchema } from '@/schemas/template.schema';
import { z } from 'zod';

export async function GET(req, { params }) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const template = await templateService.getTemplate(id, session.user.id);

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Get template error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validated = updateTemplateSchema.parse(body);

    const template = await templateService.updateTemplate(id, session.user.id, validated);

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Update template error:', error.message);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const result = await templateService.deleteTemplate(id, session.user.id);

    if (!result) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Template deleted' });
  } catch (error) {
    console.error('Delete template error:', error.message);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
