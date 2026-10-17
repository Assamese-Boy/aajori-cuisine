import { NextRequest } from 'next/server';
import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    if (!body.name || body.price === undefined) {
      return apiError('Dish name and price are required', 400);
    }

    const saved = await ServerDb.saveMenuItem(params.id, body);
    if (!saved) {
      return apiError('Failed to save menu item', 500);
    }
    return apiSuccess(saved, 201);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to add dish', 500);
  }
}
