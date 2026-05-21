import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import * as templateService from '@/services/template.service';
import { checkTemplateLimit } from '@/services/plan.service';

export async function POST(req, { params }) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check plan-based template limit
    const templateLimitCheck = await checkTemplateLimit(session.user.id);
    if (!templateLimitCheck.allowed) {
      return NextResponse.json({ error: templateLimitCheck.reason }, { status: 403 });
    }

    const { id } = await params;
    const template = await templateService.duplicateTemplate(id, session.user.id);

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Duplicate template error:', error.message);
    return NextResponse.json({ error: 'Failed to duplicate template' }, { status: 500 });
  }
}
