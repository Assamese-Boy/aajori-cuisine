import { NextRequest } from 'next/server';
import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const body = await req.json();
    const updated = await ServerDb.saveCoupon({ ...body, code: params.code });
    if (!updated) {
      return apiError('Coupon update failed', 404);
    }
    return apiSuccess(updated);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to update coupon', 500);
  }
}

export const PATCH = PUT;

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const ok = await ServerDb.deleteCoupon(params.code);
    if (!ok) {
      return apiError('Coupon not found or already deleted', 404);
    }
    return apiSuccess({ deleted: true, code: params.code });
  } catch (err: any) {
    return apiError(err?.message || 'Failed to delete coupon', 500);
  }
}
