import { NextRequest } from 'next/server';
import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  try {
    const partners = await ServerDb.getAllDeliveryPartners();
    return apiSuccess(partners);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to retrieve delivery partners', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.fullName || !body.phone) {
      return apiError('Name and Phone are required', 400);
    }

    const partner = await ServerDb.saveDeliveryPartner(body);
    return apiSuccess(partner, 201);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to save delivery partner', 500);
  }
}
