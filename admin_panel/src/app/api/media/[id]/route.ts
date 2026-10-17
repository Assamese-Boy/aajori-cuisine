import { NextRequest, NextResponse } from 'next/server';
import {
  streamMediaFromStorage,
  deleteFromStorage,
  getMetadataFromStorage,
  getProxiedMediaUrl,
} from '@/lib/media-storage';

export const dynamic = 'force-dynamic';

/**
 * Handle CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range',
    },
  });
}

/**
 * GET: Stream image/media asset directly to browser or return JSON info
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rawId = params.id;
    const cleanId = rawId.replace(/\.[a-zA-Z0-9]+$/, '');

    // If metadata info is explicitly requested via query param ?info=true
    if (req.nextUrl.searchParams.get('info') === 'true') {
      const metaResult = await getMetadataFromStorage(cleanId);
      if (!metaResult.success) {
        return NextResponse.json(
          { success: false, error: metaResult.error || 'Metadata not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        metadata: {
          ...metaResult.metadata,
          url: getProxiedMediaUrl(cleanId, req),
        },
      });
    }

    // Otherwise, proxy and stream the actual media file from storage
    const rangeHeader = req.headers.get('range');
    const upstreamRes = await streamMediaFromStorage(cleanId, rangeHeader);

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      if (upstreamRes.status === 404) {
        return new NextResponse('Media asset not found on storage server', { status: 404 });
      }
      return new NextResponse(`Storage upstream error: HTTP ${upstreamRes.status}`, {
        status: upstreamRes.status,
      });
    }

    // Build optimized media response headers
    const headers = new Headers();

    const forwardHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'last-modified',
      'etag',
    ];

    forwardHeaders.forEach((h) => {
      const val = upstreamRes.headers.get(h);
      if (val) headers.set(h, val);
    });

    // Ensure fallback content-type
    if (!headers.get('content-type')) {
      headers.set('content-type', 'image/jpeg');
    }

    // Aggressive immutable caching for media assets
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('X-Content-Type-Options', 'nosniff');

    // CORS headers: allow customer_web and any client to render smoothly
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    headers.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers,
    });
  } catch (error: any) {
    console.error('[Media Stream Proxy Error]', error);
    return new NextResponse(
      `Error proxying media asset: ${error?.message || 'Server Error'}`,
      { status: 500 }
    );
  }
}

/**
 * HEAD: Retrieve media headers without response body
 */
export async function HEAD(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const getRes = await GET(req, { params });
  return new NextResponse(null, {
    status: getRes.status,
    headers: getRes.headers,
  });
}

/**
 * DELETE: Delete file and metadata from remote storage
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rawId = params.id;
    const cleanId = rawId.replace(/\.[a-zA-Z0-9]+$/, '');

    const result = await deleteFromStorage(cleanId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to delete file from storage' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Media asset deleted successfully from storage server',
      id: cleanId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Delete operation failed' },
      { status: 500 }
    );
  }
}
