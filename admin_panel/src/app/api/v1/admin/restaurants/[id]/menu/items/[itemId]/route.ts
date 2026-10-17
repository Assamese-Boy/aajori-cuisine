import { NextRequest } from 'next/server';
import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const body = await req.json();
    const updated = await ServerDb.saveMenuItem(params.id, { ...body, id: params.itemId });
    if (!updated) {
      return apiError('Dish not found or update failed', 404);
    }
    return apiSuccess(updated);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to update dish', 500);
  }
}

export const PATCH = PUT;

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const ok = await ServerDb.deleteMenuItem(params.itemId);
    if (!ok) {
      return apiError('Failed to delete dish', 404);
    }
    return apiSuccess({ deleted: true, itemId: params.itemId });
  } catch (err: any) {
    return apiError(err?.message || 'Failed to delete dish', 500);
  }
}
