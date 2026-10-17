import { NextRequest, NextResponse } from 'next/server';
import { listFromStorage, getProxiedMediaUrl } from '@/lib/media-storage';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') || '50', 10)));

    const result = await listFromStorage(page, limit);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to list media from storage',
          files: [],
          total: 0,
        },
        { status: 502 }
      );
    }

    // Remap file URLs so all files are accessed through the admin_panel proxy
    const proxiedFiles = (result.files || []).map((file) => ({
      id: file.id,
      url: getProxiedMediaUrl(file.id, req),
      filename: file.original_name || file.filename || file.id,
      size: file.size,
      mimeType: file.mime_type,
      createdAt: file.uploaded_at || file.createdAt || new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      files: proxiedFiles,
      total: result.total !== undefined ? result.total : proxiedFiles.length,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('[Media List API Error]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to list media assets', files: [], total: 0 },
      { status: 500 }
    );
  }
}
