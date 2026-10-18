import { NextRequest } from 'next/server';
import { notificationService } from '@/lib/notification-service';
import { apiSuccess, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(req: NextRequest) {
  let targetRole: any = 'ADMIN';
  let targetUserId: string | undefined;
  let title = '🔔 Test Web Push Notification';
  let message = 'Live real-time push alert verified from Aajori Cuisine platform.';

  try {
    const body = await req.json();
    if (body.targetRole) targetRole = body.targetRole;
    if (body.targetUserId) targetUserId = body.targetUserId;
    if (body.title) title = body.title;
    if (body.message) message = body.message;
  } catch (_) {}

  const notif = await notificationService.dispatch(
    targetUserId,
    'TEST_NOTIFICATION',
    title,
    message,
    { timestamp: Date.now() },
    ['PUSH', 'IN_APP'],
    targetRole
  );

  return apiSuccess(notif);
}
