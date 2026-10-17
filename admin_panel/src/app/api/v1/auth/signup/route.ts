import { NextRequest } from 'next/server';
import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.fullName || !body.fullName.trim()) {
      return apiError('Full Name is required', 400);
    }
    if (!body.phone || body.phone.trim().length < 7) {
      return apiError('A valid phone number is required', 400);
    }

    const cleanPhone = body.phone.trim();
    const cleanEmail = (body.email || `${cleanPhone.replace(/[^0-9]/g, '')}@customer.aajori.in`).trim().toLowerCase();

    // Create user in persistent server DB
    const user = await ServerDb.createUser({
      fullName: body.fullName.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      password: body.password || 'Customer@2026',
      role: 'CUSTOMER',
      status: 'ACTIVE',
    });

    // Optional address attachment
    let savedAddress: any = undefined;
    if (body.address && (body.address.addressLine1 || typeof body.address === 'string')) {
      const addressText = typeof body.address === 'string' ? body.address : body.address.addressLine1;
      savedAddress = await ServerDb.createAddress({
        userId: user.id,
        label: body.address.label || 'Home',
        addressLine1: addressText,
        city: body.address.city || 'Guwahati',
        latitude: body.address.latitude,
        longitude: body.address.longitude,
        isDefault: true,
      });
    }

    const token = `jwt_live_${user.id}_${Date.now()}`;

    return apiSuccess(
      {
        token,
        user,
        address: savedAddress,
        message: 'Account registered successfully',
      },
      201
    );
  } catch (err: any) {
    return apiError(err?.message || 'Customer registration failed', 500);
  }
}
