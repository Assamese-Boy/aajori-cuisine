import { NextRequest } from 'next/server';
import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  try {
    const logs = await ServerDb.getAuditLogs();
    return apiSuccess(logs);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to retrieve audit logs', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.action || !body.entityType) {
      return apiError('action and entityType are required', 400);
    }
    const ok = await ServerDb.createAuditLog(body);
    return apiSuccess({ success: ok });
  } catch (err: any) {
    return apiError(err?.message || 'Failed to create audit log', 500);
  }
}
