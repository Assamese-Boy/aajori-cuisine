import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MANIFEST_PATH = path.join(UPLOAD_DIR, 'manifest.json');

async function getManifest(): Promise<any[]> {
  try {
    const raw = await fs.readFile(MANIFEST_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveManifest(manifest: any[]): Promise<void> {
  try {
    await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Media API] Error saving manifest:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded in "file" field' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Only image files are permitted' },
        { status: 400 }
      );
    }

    // Ensure upload dir exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Clean filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const finalFilename = `${timestamp}_${safeName}`;
    const filePath = path.join(UPLOAD_DIR, finalFilename);

    const bytes = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(bytes));

    const item = {
      id: `media_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
      url: `/uploads/${finalFilename}`,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
      createdAt: new Date().toISOString(),
    };

    const manifest = await getManifest();
    manifest.unshift(item);
    await saveManifest(manifest);

    return NextResponse.json({
      success: true,
      data: item,
      id: item.id,
      url: item.url,
      filename: item.filename,
    });
  } catch (error: any) {
    console.error('[Media Upload API Error]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal upload error' },
      { status: 500 }
    );
  }
}
