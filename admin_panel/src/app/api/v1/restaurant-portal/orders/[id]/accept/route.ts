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
    const prepMinutes = Number(body.prepMinutes) || 25;

    const updated = await ServerDb.updateOrderStatus(params.id, 'RESTAURANT_ACCEPTED');
    if (!updated) {
      return apiError('Order not found', 404);
    }

    return apiSuccess({
      ...updated,
      estimatedPreparationTimeMinutes: prepMinutes,
      message: 'Order accepted by kitchen',
    });
  } catch (err: any) {
    return apiError(err?.message || 'Failed to accept order', 500);
  }
}
