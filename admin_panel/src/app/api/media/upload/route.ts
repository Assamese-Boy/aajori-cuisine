import { NextRequest, NextResponse } from 'next/server';
import { uploadToStorage, getProxiedMediaUrl } from '@/lib/media-storage';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded in form field "file"' },
        { status: 400 }
      );
    }

    // Permitted file types check
    const isImage = file.type.startsWith('image/');
    const isMedia =
      isImage ||
      file.type.startsWith('video/') ||
      file.type.startsWith('audio/') ||
      file.type === 'application/pdf';

    if (!isMedia) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only image, video, audio, or PDF files are permitted for media upload',
        },
        { status: 400 }
      );
    }

    // Upload to the self-hosted PHP media storage server
    const result = await uploadToStorage(file, file.name);

    if (!result.success || !result.id) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to upload media to storage server',
        },
        { status: 502 }
      );
    }

    // Construct the safe proxied URL through the admin panel
    const proxiedUrl = getProxiedMediaUrl(result.id, req);

    const mediaItem = {
      id: result.id,
      url: proxiedUrl,
      filename: result.metadata?.original_name || file.name,
      size: result.metadata?.size || file.size,
      mimeType: result.metadata?.mime_type || file.type,
      createdAt: result.metadata?.uploaded_at || new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: mediaItem,
        id: mediaItem.id,
        url: mediaItem.url,
        filename: mediaItem.filename,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Media Upload API Error]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal upload error' },
      { status: 500 }
    );
  }
}
