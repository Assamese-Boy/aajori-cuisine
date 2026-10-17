import { NextRequest } from 'next/server';
import { notificationService } from '@/lib/notification-service';
import { apiSuccess, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(req: NextRequest) {
  let userId: string | undefined;
  let role: string | undefined;

  try {
    const body = await req.json();
    userId = body.userId;
    role = body.role;
  } catch (_) {}

  const count = notificationService.markAllAsRead(userId, role);
  return apiSuccess({ success: true, count });
}
