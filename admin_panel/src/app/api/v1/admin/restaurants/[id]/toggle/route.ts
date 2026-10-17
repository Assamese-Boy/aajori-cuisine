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
    const isAccepting = body.isOpen ?? body.isAcceptingOrders ?? true;
    const ok = await ServerDb.toggleRestaurantAccepting(params.id, isAccepting);
    return apiSuccess({ success: ok, isOpen: isAccepting });
  } catch (err: any) {
    return apiError(err?.message || 'Failed to toggle status', 500);
  }
}

export const PATCH = POST;
