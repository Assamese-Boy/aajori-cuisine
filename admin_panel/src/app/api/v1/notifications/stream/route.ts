import { NextRequest } from 'next/server';
import { notificationService } from '@/lib/notification-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || undefined;
  const role = searchParams.get('role') || undefined;

  const clientId = `sse_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  let keepAliveTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      notificationService.addSseController(clientId, controller, userId, role);

      // Keepalive heartbeat every 20 seconds
      keepAliveTimer = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`: keepalive ${Date.now()}\n\n`));
        } catch (_) {
          if (keepAliveTimer) clearInterval(keepAliveTimer);
          notificationService.removeSseController(clientId);
        }
      }, 20000);
    },
    cancel() {
      if (keepAliveTimer) clearInterval(keepAliveTimer);
      notificationService.removeSseController(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no',
    },
  });
}
