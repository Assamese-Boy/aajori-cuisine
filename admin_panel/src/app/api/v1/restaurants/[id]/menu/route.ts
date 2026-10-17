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
    const categoriesMap = new Map<string, any>();
    items.forEach((item) => {
      if (!categoriesMap.has(item.category)) {
        categoriesMap.set(item.category, {
          id: `cat_${item.category.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
          name: item.category,
        });
      }
    });

    return apiSuccess({
      categories: Array.from(categoriesMap.values()),
      items,
    });
  } catch (err: any) {
    return apiError(err?.message || 'Failed to retrieve menu', 500);
  }
}
