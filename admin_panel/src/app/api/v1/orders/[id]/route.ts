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
