import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { parseAndValidateCSV, parseCommaSeparatedEmails } from '@/services/csv.service';

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { csvText, mode = 'csv' } = body;

    if (!csvText || typeof csvText !== 'string') {
      return NextResponse.json({ error: 'Input text is required' }, { status: 400 });
    }

    if (csvText.length > 1024 * 1024) {
      return NextResponse.json({ error: 'Input too large (max 1MB)' }, { status: 400 });
    }

    const result = mode === 'emails'
      ? parseCommaSeparatedEmails(csvText)
      : parseAndValidateCSV(csvText);

    return NextResponse.json(result);
  } catch (error) {
    console.error('CSV validation error:', error.message);
    return NextResponse.json({ error: 'Failed to validate input' }, { status: 500 });
  }
}
