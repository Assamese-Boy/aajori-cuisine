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
    const identifier = (body.identifier || body.email || body.phone || '').trim();
    const password = body.password || '';

    if (!identifier) {
      return apiError('Please enter your email or phone number', 400);
    }

    const user = await ServerDb.findUserByIdentifier(identifier);
    if (!user) {
      return apiError('No account found with this identifier. Please check or sign up.', 401);
    }

    if (user.status === 'SUSPENDED') {
      return apiError('This account has been suspended. Please contact support.', 403);
    }

    // Verify password if account has password_hash and caller supplied password
    if (user.password && password) {
      if (user.password !== password) {
        return apiError('Incorrect password. Please check your credentials and try again.', 401);
      }
    }

    const token = `jwt_live_${user.id}_${Date.now()}`;
    const { password: _, ...safeUser } = user;

    return apiSuccess({
      token,
      user: safeUser,
      message: 'Signed in successfully',
    });
  } catch (err: any) {
    return apiError(err?.message || 'Authentication failed', 500);
  }
}
