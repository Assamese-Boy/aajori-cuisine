import { NextRequest } from 'next/server';
import { notificationService } from '@/lib/notification-service';
import { apiSuccess, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || undefined;
  const role = searchParams.get('role') || undefined;
  const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50;

  const notifications = notificationService.getNotifications(userId, role, limit);
  const unreadCount = notificationService.getUnreadCount(userId, role);

  return apiSuccess({
    notifications,
    unreadCount,
  });
}
