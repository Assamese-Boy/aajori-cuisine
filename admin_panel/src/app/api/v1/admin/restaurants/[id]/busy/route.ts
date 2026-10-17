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
    const isBusy = Boolean(body.isBusy);
    const ok = await ServerDb.toggleRestaurantBusy(params.id, isBusy);
    return apiSuccess({ success: ok, isBusy });
  } catch (err: any) {
    return apiError(err?.message || 'Failed to toggle busy status', 500);
  }
}

export const PATCH = POST;
