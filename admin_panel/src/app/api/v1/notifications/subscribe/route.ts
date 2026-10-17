import { NextRequest } from 'next/server';
import { notificationService } from '@/lib/notification-service';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, fcmToken, userId, role } = body;

    if (!subscription && !fcmToken) {
      return apiError('Either FCM token or PushSubscription is required', 400);
    }

    const record = notificationService.registerPushSubscription({
      userId,
      role,
      fcmToken,
      subscription,
    });

    return apiSuccess({
      registered: true,
      id: record.id,
      role: record.role,
      hasFcm: Boolean(record.fcmToken),
    });
  } catch (err: any) {
    return apiError(err?.message || 'Failed to register notification subscription', 500);
  }
}
