import { NextRequest } from 'next/server';
import { apiSuccess, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

const inMemorySessions = new Map<string, any>();

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone') || '+919864000020';

  let session = inMemorySessions.get(phone);
  if (!session) {
    session = {
      phone,
      stage: 'WELCOME',
      cart: [],
      address: null,
      orderId: null,
      lastInteraction: new Date().toISOString(),
    };
    inMemorySessions.set(phone, session);
  }

  return apiSuccess({ session });
}
