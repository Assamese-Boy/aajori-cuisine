import { NextRequest } from 'next/server';
import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = await ServerDb.saveDeliveryZone({ ...body, id: params.id });
    if (!updated) {
      return apiError('Zone update failed', 404);
    }
    return apiSuccess(updated);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to update zone', 500);
  }
}

export const PATCH = PUT;

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ok = await ServerDb.deleteDeliveryZone(params.id);
    if (!ok) {
      return apiError('Zone not found or already deleted', 404);
    }
    return apiSuccess({ deleted: true, id: params.id });
  } catch (err: any) {
    return apiError(err?.message || 'Failed to delete zone', 500);
  }
}
