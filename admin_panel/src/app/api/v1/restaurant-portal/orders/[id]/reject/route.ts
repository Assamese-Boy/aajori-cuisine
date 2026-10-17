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
    const reason = body.reason || 'Kitchen at maximum capacity';

    const updated = await ServerDb.updateOrderStatus(params.id, 'REJECTED');
    if (!updated) {
      return apiError('Order not found', 404);
    }

    return apiSuccess({
      ...updated,
      rejectionReason: reason,
      message: 'Order rejected by kitchen',
    });
  } catch (err: any) {
    return apiError(err?.message || 'Failed to reject order', 500);
  }
}
