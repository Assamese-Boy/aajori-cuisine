import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

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
  trendingDishes: [
    {
      id: 'trend-1',
      name: 'Smoked Pork with Khorisa (Bamboo Shoot)',
      tagline: 'Authentic wood-smoked pork infused with wild fermented bamboo shoots',
      price: 320,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
      restaurantId: 'd0000000-0000-0000-0000-000000000001',
      restaurantName: 'Heritage Khorikaa Kitchen',
      isVeg: false,
      orderCountText: '🔥 140+ orders this week',
      isActive: true,
    },
    {
      id: 'trend-2',
      name: 'Grand Parampara Non-Veg Thali',
      tagline: 'Complete royal feast with Joha rice, Khar, Pitika, Masor Tenga & Kaji Nemu',
      price: 380,
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
      restaurantId: 'd0000000-0000-0000-0000-000000000002',
      restaurantName: 'Paradise Heritage Thali',
      isVeg: false,
      orderCountText: '👑 #1 Best Seller',
      isActive: true,
    },
    {
      id: 'trend-3',
      name: 'Riverfront Duck Curry with Black Sesame',
      tagline: 'Slow-simmered tender country duck in aromatic roasted Til gravies',
      price: 360,
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
      restaurantId: 'd0000000-0000-0000-0000-000000000003',
      restaurantName: 'Riverfront Ethnic Flavors',
      isVeg: false,
      orderCountText: '⚡ Top Rated in City',
      isActive: true,
    },
    {
      id: 'trend-4',
      name: 'Brahmaputra Rohu Masor Tenga',
      tagline: 'Tangy heirloom fish curry infused with elephant apple (Ou Tenga) and fresh herbs',
      price: 260,
      imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600',
      restaurantId: 'd0000000-0000-0000-0000-000000000001',
      restaurantName: 'Heritage Khorikaa Kitchen',
      isVeg: false,
      orderCountText: '🍋 Chef Choice',
      isActive: true,
    },
  ],
};

async function loadPersistedSettings() {
  try {
    const raw = await fs.readFile(SETTINGS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      heroBanners: Array.isArray(parsed.heroBanners) ? parsed.heroBanners : DEFAULT_SETTINGS.heroBanners,
      culinaryCategories: Array.isArray(parsed.culinaryCategories) ? parsed.culinaryCategories : DEFAULT_SETTINGS.culinaryCategories,
      trendingDishes: Array.isArray(parsed.trendingDishes) ? parsed.trendingDishes : DEFAULT_SETTINGS.trendingDishes,
    };
  } catch {
    await savePersistedSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
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
  return NextResponse.json({
    success: true,
    data: current,
  });
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
