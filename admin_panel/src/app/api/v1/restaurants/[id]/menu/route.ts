import { NextRequest } from 'next/server';
import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const restaurant = await ServerDb.getRestaurantById(params.id);
    if (!restaurant) {
      return apiError('Restaurant not found', 404);
    }

    const items = restaurant.menu || [];
    const categoriesMap = new Map<string, { id: string; name: string; items: any[] }>();
    items.forEach((item) => {
      const catName = item.category || 'Signature Dishes';
      if (!categoriesMap.has(catName)) {
        categoriesMap.set(catName, {
          id: `cat_${catName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
          name: catName,
          items: [],
        });
      }
      categoriesMap.get(catName)!.items.push(item);
    });

    return apiSuccess({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
      },
      categories: Array.from(categoriesMap.values()),
      items,
    });
  } catch (err: any) {
    return apiError(err?.message || 'Failed to retrieve menu', 500);
  }
}
