import { NextRequest } from 'next/server';
import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  try {
    const users = await ServerDb.getAllUsers();
    return apiSuccess(users);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to retrieve users', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.fullName || !body.phone) {
      return apiError('Full Name and Phone are required', 400);
    }

    const cleanEmail = (body.email || `${body.phone.replace(/[^0-9]/g, '')}@staff.aajori.in`).trim().toLowerCase();

    const newUser = await ServerDb.createUser({
      fullName: body.fullName,
      phone: body.phone,
      email: cleanEmail,
      password: body.password || 'Staff@2026',
      role: body.role || 'ADMIN',
      status: body.status || 'ACTIVE',
    });

    return apiSuccess(newUser, 201);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to create user', 500);
  }
}
