import { NextRequest } from 'next/server';
import { apiSuccess, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const phone = body.phone || '+919864000020';

  const resetSession = {
    phone,
    stage: 'WELCOME',
    cart: [],
    address: null,
    orderId: null,
    lastInteraction: new Date().toISOString(),
  };

  return apiSuccess({
    session: resetSession,
    message: 'Session has been reset',
  });
}
