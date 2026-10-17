import { NextRequest } from 'next/server';
import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  try {
    const zones = await ServerDb.getAllDeliveryZones();
    return apiSuccess(zones);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to retrieve delivery zones', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) {
      return apiError('Zone name is required', 400);
    }

    const saved = await ServerDb.saveDeliveryZone(body);
    if (!saved) {
      return apiError('Failed to save delivery zone', 500);
    }
    return apiSuccess(saved, 201);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to create delivery zone', 500);
  }
}
