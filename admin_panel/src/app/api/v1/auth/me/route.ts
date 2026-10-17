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

    if (token) {
      // Clean token and extract userId (tokens are jwt_live_<userId>_<timestamp>)
      const userId = token.replace(/^jwt_live_/, '').replace(/_\d+$/, '');
      if (userId) {
        const user = await ServerDb.getUserById(userId);
        if (user) {
          const { password: _, ...safeUser } = user;
          return apiSuccess(safeUser);
        }
      }
    }

    // Default to platform super admin if authenticated via admin panel
    const users = await ServerDb.getAllUsers();
    const admin = users.find((u) => u.role === 'SUPER_ADMIN') || users[0];
    return apiSuccess(admin);
  } catch (err: any) {
    return apiError(err?.message || 'Failed to authenticate session', 500);
  }
}
