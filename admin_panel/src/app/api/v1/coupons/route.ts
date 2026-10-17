import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  try {
    const coupons = await ServerDb.getAllCoupons();
    return apiSuccess(coupons);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to retrieve coupons', 500);
  }
}
