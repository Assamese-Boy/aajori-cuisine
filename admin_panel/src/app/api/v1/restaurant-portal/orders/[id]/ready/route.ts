import { NextRequest } from 'next/server';
import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updated = await ServerDb.updateOrderStatus(params.id, 'READY_FOR_PICKUP');
    if (!updated) {
      return apiError('Order not found', 404);
    }

    return apiSuccess({
      ...updated,
      message: 'Order marked ready for pickup',
    });
  } catch (err: any) {
    return apiError(err?.message || 'Failed to update order status', 500);
  }
}
