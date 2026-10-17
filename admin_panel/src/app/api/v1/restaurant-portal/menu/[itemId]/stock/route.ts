import { NextRequest } from 'next/server';
import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const body = await req.json();
    const isAvailable = Boolean(body.isAvailable);

    const ok = await ServerDb.updateMenuItemStock(params.itemId, isAvailable);
    if (!ok) {
      return apiError('Menu item not found or update failed', 404);
    }

    return apiSuccess({
      itemId: params.itemId,
      isAvailable,
      message: `Item stock updated to ${isAvailable ? 'available' : 'unavailable'}`,
    });
  } catch (err: any) {
    return apiError(err?.message || 'Failed to update stock', 500);
  }
}
