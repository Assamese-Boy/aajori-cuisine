import { apiSuccess, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  return apiSuccess([
    {
      id: 'log_001',
      actor: 'Manabendra Sarma (Super Admin)',
      action: 'SYSTEM_SYNC',
      target: 'Supabase PostgreSQL Cloud Cluster',
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
    },
    {
      id: 'log_002',
      actor: 'System Daemon',
      action: 'GEO_RELOAD',
      target: 'Kamrup Metropolitan Dispatch Grid',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'SUCCESS',
    },
  ]);
}
