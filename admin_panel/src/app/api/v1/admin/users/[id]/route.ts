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
    const user = await ServerDb.getUserById(params.id);
    if (!user) {
      return apiError('User not found', 404);
    }
    return apiSuccess(user);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to retrieve user', 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = await ServerDb.updateUser(params.id, body);
    if (!updated) {
      return apiError('User not found or update failed', 404);
    }
    return apiSuccess(updated);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to update user', 500);
  }
}

export const PUT = PATCH;

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ok = await ServerDb.deleteUser(params.id);
    if (!ok) {
      return apiError('User not found or already deleted', 404);
    }
    return apiSuccess({ deleted: true, id: params.id });
  } catch (err: any) {
    return apiError(err?.message || 'Failed to delete user', 500);
  }
}
