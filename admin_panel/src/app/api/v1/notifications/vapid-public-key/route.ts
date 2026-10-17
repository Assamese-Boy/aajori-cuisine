import { notificationService } from '@/lib/notification-service';
import { apiSuccess, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  const publicKey = notificationService.getVapidPublicKey();
  return apiSuccess({ publicKey });
}
