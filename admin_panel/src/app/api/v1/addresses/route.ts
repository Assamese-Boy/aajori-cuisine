import { NextRequest } from 'next/server';
import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    let userId = '';
    if (token) {
      const match = token.match(/^jwt_live_([^_]+_[^_]+_[^_]+)/) || token.match(/^jwt_live_([^_]+)/);
      if (match) userId = match[1];
    }

    if (!userId) {
      // Find latest customer or return empty
      const users = await ServerDb.getAllUsers();
      const customer = users.find((u) => u.role === 'CUSTOMER');
      userId = customer ? customer.id : '';
    }

    const addresses = userId ? await ServerDb.getAddressesByUserId(userId) : [];
    return apiSuccess(addresses);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to retrieve addresses', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    let userId = body.userId;
    if (!userId && token) {
      const match = token.match(/^jwt_live_([^_]+_[^_]+_[^_]+)/) || token.match(/^jwt_live_([^_]+)/);
      if (match) userId = match[1];
    }

    if (!userId) {
      const users = await ServerDb.getAllUsers();
      const customer = users.find((u) => u.role === 'CUSTOMER');
      userId = customer ? customer.id : 'usr_guest';
    }

    const address = await ServerDb.createAddress({
      userId,
      label: body.label || 'Home',
      addressLine1: body.addressLine1 || body.address || 'Delivery Address',
      city: body.city || 'Guwahati',
      latitude: body.latitude,
      longitude: body.longitude,
      isDefault: body.isDefault ?? true,
    });

    return apiSuccess(address, 201);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to create address', 500);
  }
}
