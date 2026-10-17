import { NextRequest } from 'next/server';
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.code) {
      return apiError('Coupon code is required', 400);
    }

    const saved = await ServerDb.saveCoupon(body);
    if (!saved) {
      return apiError('Failed to save coupon', 500);
    }
    return apiSuccess(saved, 201);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to create coupon', 500);
  }
}
