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
    const list = await ServerDb.getAllDeliveryPartners();
    const partner = list.find((p) => p.id === params.id);
    if (!partner) {
      return apiError('Delivery partner not found', 404);
    }
    return apiSuccess(partner);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to retrieve delivery partner', 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const cleanId = (params.id || '').trim().replace(/\/+$/, '');
    const updated = await ServerDb.saveDeliveryPartner({ ...body, id: cleanId });
    return apiSuccess(updated);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to update delivery partner', 500);
  }
}

export const PUT = PATCH;

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ok = await ServerDb.deleteDeliveryPartner(params.id);
    if (!ok) {
      return apiError('Failed to delete delivery partner', 404);
    }
    return apiSuccess({ deleted: true, id: params.id });
  } catch (err: any) {
    return apiError(err?.message || 'Failed to delete delivery partner', 500);
  }
}
