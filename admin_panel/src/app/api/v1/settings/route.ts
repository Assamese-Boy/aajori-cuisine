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
  promoCodeAnnouncement: 'Special discounts & express delivery on artisan food',
  supportPhone: '+91 6002308541',
  supportEmail: 'info@aajori.in',
  whatsappOrderingPhone: '916002308541',
  deliveryTimeEstimate: '25-35 mins',
  currencySymbol: '₹',
  heroBanners: [] as any[],
  culinaryCategories: [] as any[],
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

// Check if a hero banner is a legacy hardcoded mock item
function isLegacyMockBanner(b: any): boolean {
  if (!b || !b.title) return true;
  const title = String(b.title).toLowerCase();
  const restId = String(b.restaurantId || '');
  if (restId.startsWith('d0000000-')) return true;
  if (title.includes('authentic assam khorikaa')) return true;
  if (title.includes('paradise heritage thalis')) return true;
  if (title.includes('riverfront duck & fish')) return true;
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
      heroBanners: Array.isArray(parsed.heroBanners) ? parsed.heroBanners : [],
      culinaryCategories: Array.isArray(parsed.culinaryCategories) ? parsed.culinaryCategories : [],
      trendingDishes: Array.isArray(parsed.trendingDishes) ? parsed.trendingDishes : [],
    };
  } catch {
    // First run or file not written yet
  }

  // Filter out any legacy dummy mock banners
  if (Array.isArray(settings.heroBanners)) {
    settings.heroBanners = settings.heroBanners.filter((b: any) => !isLegacyMockBanner(b));
  } else {
    settings.heroBanners = [];
  }

  // Filter out any legacy dummy mock dishes
  if (Array.isArray(settings.trendingDishes)) {
    settings.trendingDishes = settings.trendingDishes.filter((d: any) => !isLegacyMockDish(d));
  } else {
    settings.trendingDishes = [];
  }

  // Dynamically auto-populate hero banners from real Supabase restaurants if none configured
  if (settings.heroBanners.length === 0) {
    try {
      const realRestaurants = await ServerDb.getAllRestaurants();
      if (realRestaurants.length > 0) {
        settings.heroBanners = realRestaurants.map((r, idx) => ({
          id: `banner-${r.id}`,
          title: r.name,
          subtitle: r.addressLine || 'Authentic artisan kitchen with express delivery',
          tag: '⚡ 25 Mins Express',
          code: '',
          discount: 'Artisan Kitchen',
          condition: 'Freshly prepared food',
          bg:
            idx % 2 === 0
              ? 'from-brand-900 via-stone-900 to-amber-950'
              : 'from-stone-950 via-amber-950 to-stone-900',
          accent: 'text-amber-400',
          image:
            (r as any).imageUrl ||
            r.coverUrl ||
            r.logoUrl ||
            'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
          restaurantId: r.id,
        }));
      }
    } catch (_) {}
  }

  // Dynamically auto-populate culinary categories from real Supabase restaurants if none configured
  if (settings.culinaryCategories.length === 0) {
    try {
      const realRestaurants = await ServerDb.getAllRestaurants();
      const catSet = new Set<string>();
      catSet.add('All');
      realRestaurants.forEach((r) => {
        (r.cuisineTypes || []).forEach((c: string) => catSet.add(c));
        if (Array.isArray(r.menu)) {
          r.menu.forEach((m: any) => {
            if (m.category) catSet.add(m.category);
          });
        }
      });
      const emojiMap: Record<string, string> = {
        All: '🍲',
        Traditional: '🍖',
        Gourmet: '🍛',
        'Multi-Cuisine': '🍱',
        'Signature Dishes': '👑',
        Thalis: '🍛',
        Vegetarian: '🥬',
      };
      settings.culinaryCategories = Array.from(catSet).map((name) => ({
        name,
        icon: emojiMap[name] || '🍲',
        color: 'from-amber-500 to-brand-500',
      }));
    } catch (_) {}
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
      if (realDishes.length > 0) {
        await savePersistedSettings(settings);
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
