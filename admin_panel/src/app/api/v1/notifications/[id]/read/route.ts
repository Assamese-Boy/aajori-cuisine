import { NextRequest } from 'next/server';
import { notificationService } from '@/lib/notification-service';
import { apiSuccess, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const success = notificationService.markAsRead(params.id);
  return apiSuccess({ success });
}
