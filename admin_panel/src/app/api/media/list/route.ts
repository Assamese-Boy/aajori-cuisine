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

export async function GET(req: NextRequest) {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const manifest = await getManifest();

    return NextResponse.json({
      success: true,
      files: manifest,
      total: manifest.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to list media' },
      { status: 500 }
    );
  }
}
