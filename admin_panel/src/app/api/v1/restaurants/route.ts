import { NextRequest } from 'next/server';
import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  try {
    const restaurants = await ServerDb.getAllRestaurants();
    return apiSuccess(restaurants);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to retrieve restaurants', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) {
      return apiError('Restaurant name is required', 400);
    }

    const saved = await ServerDb.saveRestaurant(body);
    return apiSuccess(saved, 201);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to save restaurant', 500);
  }
}
