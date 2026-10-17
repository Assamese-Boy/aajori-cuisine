import { NextRequest } from 'next/server';
import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const status = body.status || body.toStatus;
    if (!status) {
      return apiError('Status is required', 400);
    }

    const updated = await ServerDb.updateOrderStatus(params.id, status);
    if (!updated) {
      return apiError('Order not found', 404);
    }
    return apiSuccess(updated);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to update order status', 500);
  }
}
