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
    const order = await ServerDb.getOrderById(params.id);
    if (!order) {
      return apiError('Order not found', 404);
    }
    return apiSuccess(order);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to retrieve order', 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = await ServerDb.updateOrderStatus(params.id, body.status);
    if (!updated) {
      return apiError('Order not found or update failed', 404);
    }
    return apiSuccess(updated);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to update order', 500);
  }
}

export const PUT = PATCH;
