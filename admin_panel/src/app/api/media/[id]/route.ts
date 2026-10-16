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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const manifest = await getManifest();
    const item = manifest.find((m) => m.id === id);

    if (item && item.url) {
      const filename = path.basename(item.url);
      const filePath = path.join(UPLOAD_DIR, filename);
      await fs.unlink(filePath).catch(() => null);
    }

    const updated = manifest.filter((m) => m.id !== id);
    await saveManifest(updated);

    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Delete failed' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const manifest = await getManifest();
    const item = manifest.find((m) => m.id === id);

    if (!item) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, metadata: item });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Metadata failed' },
      { status: 500 }
    );
  }
}
