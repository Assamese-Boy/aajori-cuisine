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
    const riderId = body.riderId || body.deliveryPartnerId;
    if (!riderId) {
      return apiError('Rider ID is required', 400);
    }

    const updated = await ServerDb.assignRiderToOrder(params.id, riderId);
    if (!updated) {
      return apiError('Failed to assign rider to order', 500);
    }
    return apiSuccess(updated);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to assign rider', 500);
  }
}

export const PATCH = POST;
