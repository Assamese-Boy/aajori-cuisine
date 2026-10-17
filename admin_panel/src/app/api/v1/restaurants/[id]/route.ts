import { NextRequest } from 'next/server';
import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const restaurant = await ServerDb.getRestaurantById(params.id);
    if (!restaurant) {
      return apiError('Restaurant not found', 404);
    }
    return apiSuccess(restaurant);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to retrieve restaurant', 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = await ServerDb.saveRestaurant({ ...body, id: params.id });
    return apiSuccess(updated);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to update restaurant', 500);
  }
}

export const PUT = PATCH;

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ok = await ServerDb.deleteRestaurant(params.id);
    if (!ok) {
      return apiError('Restaurant not found or delete failed', 404);
    }
    return apiSuccess({ deleted: true, id: params.id });
  } catch (err: any) {
    return apiError(err?.message || 'Failed to delete restaurant', 500);
  }
}
