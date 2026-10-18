import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { ServerDb } from '@/lib/server-db';

export const dynamic = 'force-dynamic';

const SETTINGS_FILE_PATH = path.join(
  process.env.VERCEL ? '/tmp' : path.join(process.cwd(), '.data'),
  'app_settings.json'
);

const DEFAULT_SETTINGS = {
  brandName: 'Aajori Cuisine',
  tagline: 'Artisan Food & Gourmet Flavors',
  topBannerDistrict: 'Worldwide Kitchens',
  topBannerTag: '⚡ 25 Mins Express',
  topAnnouncement: '⚡ Fresh Artisan Kitchens & Express Delivery Worldwide',
  promoCodeAnnouncement: 'Use code AAJORI50 for ₹50 off',
  supportPhone: '+91 6002308541',
  supportEmail: 'info@aajori.in',
  whatsappOrderingPhone: '916002308541',
  deliveryTimeEstimate: '25-35 mins',
  currencySymbol: '₹',
  heroBanners: [
    {
      id: 'banner-1',
      title: 'Authentic Assam Khorikaa',
      subtitle: 'Smoked pork with bamboo shoot & Joha rice',
      tag: '⚡ 25 Mins Express',
      code: 'AAJORI50',
      discount: '₹50 OFF',
      condition: 'On orders above ₹250',
      bg: 'from-brand-900 via-stone-900 to-amber-950',
      accent: 'text-amber-400',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
      restaurantId: 'd0000000-0000-0000-0000-000000000001',
    },
    {
      id: 'banner-2',
      title: 'Paradise Heritage Thalis',
      subtitle: 'Parampara non-veg thali with Kaji Nemu',
      tag: '👑 Pioneer Since 1984',
      code: 'BIHU20',
      discount: '20% OFF',
      condition: 'Up to ₹100 on thalis',
      bg: 'from-stone-950 via-amber-950 to-stone-900',
      accent: 'text-amber-300',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
      restaurantId: 'd0000000-0000-0000-0000-000000000002',
    },
    {
      id: 'banner-3',
      title: 'Riverfront Duck & Fish',
      subtitle: 'Duck curry with roasted black sesame',
      tag: '🔥 Charcoal Roasted',
      code: 'FIRSTMEAL',
      discount: '₹75 OFF',
      condition: 'First 3 orders only',
      bg: 'from-amber-950 via-stone-900 to-stone-950',
      accent: 'text-amber-400',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
      restaurantId: 'd0000000-0000-0000-0000-000000000003',
    },
  ],
  culinaryCategories: [
    { name: 'All', icon: '🍲', color: 'from-amber-500 to-brand-500' },
    { name: 'Khorikaa', icon: '🍖', color: 'from-orange-500 to-red-600' },
    { name: 'Thalis', icon: '🍛', color: 'from-yellow-500 to-amber-600' },
    { name: 'Masor Tenga', icon: '🐟', color: 'from-teal-500 to-cyan-600' },
    { name: 'Duck Curry', icon: '🦆', color: 'from-stone-600 to-stone-900' },
    { name: 'Smoked Meat', icon: '🥓', color: 'from-rose-600 to-amber-700' },
    { name: 'Rice and Staples', icon: '🍚', color: 'from-amber-400 to-yellow-600' },
    { name: 'Vegetarian', icon: '🥬', color: 'from-emerald-500 to-green-600' },
    { name: 'Snacks', icon: '🥟', color: 'from-orange-400 to-amber-500' },
    { name: 'Beverages', icon: '🍵', color: 'from-teal-600 to-emerald-700' },
  ],
  trendingDishes: [] as any[],
};

// Check if a dish is a legacy hardcoded mock item
function isLegacyMockDish(d: any): boolean {
  if (!d || !d.name) return true;
  const name = String(d.name).toLowerCase();
  const restId = String(d.restaurantId || '');
  if (restId.startsWith('d0000000-')) return true;
  if (name.includes('smoked pork with khorisa')) return true;
  if (name.includes('grand parampara non-veg thali')) return true;
  if (name.includes('riverfront duck curry')) return true;
  if (name.includes('brahmaputra rohu masor tenga')) return true;
  return false;
}

async function loadPersistedSettings() {
  let settings: any = { ...DEFAULT_SETTINGS };
  try {
    const raw = await fs.readFile(SETTINGS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    settings = {
      ...DEFAULT_SETTINGS,
      ...parsed,
      heroBanners: Array.isArray(parsed.heroBanners) ? parsed.heroBanners : DEFAULT_SETTINGS.heroBanners,
      culinaryCategories: Array.isArray(parsed.culinaryCategories) ? parsed.culinaryCategories : DEFAULT_SETTINGS.culinaryCategories,
      trendingDishes: Array.isArray(parsed.trendingDishes) ? parsed.trendingDishes : [],
    };
  } catch {
    // First run or file not written yet
  }

  // Filter out any legacy dummy mock dishes
  if (Array.isArray(settings.trendingDishes)) {
    settings.trendingDishes = settings.trendingDishes.filter((d: any) => !isLegacyMockDish(d));
  } else {
    settings.trendingDishes = [];
  }

  // If trendingDishes is empty, dynamically auto-populate from real Supabase restaurants & menu items
  if (settings.trendingDishes.length === 0) {
    try {
      const realRestaurants = await ServerDb.getAllRestaurants();
      const realDishes: any[] = [];
      for (const r of realRestaurants) {
        if (Array.isArray(r.menu) && r.menu.length > 0) {
          for (const m of r.menu) {
            realDishes.push({
              id: `trend-${m.id}`,
              name: m.name,
              tagline: m.description || `Specialty dish from ${r.name}`,
              price: m.price || 0,
              imageUrl: m.imageUrl || '',
              restaurantId: r.id,
              restaurantName: r.name,
              isVeg: Boolean(m.isVeg),
              orderCountText: '🔥 Popular Choice',
              isActive: true,
            });
          }
        }
      }
      settings.trendingDishes = realDishes;
      // Persist real dishes
      if (realDishes.length > 0) {
        await savePersistedSettings(settings);
      }
    } catch (_) {}
  }

  // Sanitize hero banners if they point to dummy UUIDs
  if (Array.isArray(settings.heroBanners)) {
    try {
      const rests = await ServerDb.getAllRestaurants();
      const firstRealId = rests[0]?.id || '';
      if (firstRealId) {
        settings.heroBanners = settings.heroBanners.map((b: any) => {
          if (b.restaurantId?.startsWith('d0000000-')) {
            return { ...b, restaurantId: firstRealId };
          }
          return b;
        });
      }
    } catch (_) {}
  }

  return settings;
}

async function savePersistedSettings(settings: any) {
  try {
    await fs.mkdir(path.dirname(SETTINGS_FILE_PATH), { recursive: true });
    await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to persist settings file:', err);
    return false;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET() {
  const current = await loadPersistedSettings();
  return NextResponse.json(
    {
      success: true,
      data: current,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const current = await loadPersistedSettings();
    const updated = { ...current, ...body };
    await savePersistedSettings(updated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Platform settings saved successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error?.message || 'Failed to save settings' } },
      { status: 500 }
    );
  }
}

export const POST = PUT;
