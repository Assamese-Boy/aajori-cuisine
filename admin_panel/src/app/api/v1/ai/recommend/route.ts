import { NextRequest } from 'next/server';
import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = (body.message || '').toLowerCase();

    const [restaurants, orders] = await Promise.all([
      ServerDb.getAllRestaurants(),
      ServerDb.getAllOrders(),
    ]);

    // Aggregate all dishes across restaurants
    const allDishes: Array<{
      id: string;
      name: string;
      price: number;
      isVeg?: boolean;
      restaurantName: string;
      restaurantId: string;
      description?: string;
    }> = [];

    restaurants.forEach((r) => {
      (r.menu || []).forEach((item) => {
        allDishes.push({
          id: item.id,
          name: item.name,
          price: item.price,
          isVeg: item.isVeg,
          restaurantName: r.name,
          restaurantId: r.id,
          description: item.description,
        });
      });
    });

    // Extract budget if mentioned (e.g. 500, under 400)
    const budgetMatch = message.match(/(?:under|below|less than|budget|within)?\s*₹?\s*(\d{2,5})/i);
    const maxBudget = budgetMatch ? parseInt(budgetMatch[1], 10) : 1000;

    const isVegQuery = message.includes('veg') && !message.includes('non-veg') && !message.includes('non veg');
    const isNonVegQuery = message.includes('non-veg') || message.includes('non veg') || message.includes('pork') || message.includes('chicken') || message.includes('duck') || message.includes('fish');

    let matchingDishes = allDishes.filter((d) => {
      if (d.price > maxBudget) return false;
      if (isVegQuery && !d.isVeg) return false;
      if (isNonVegQuery && d.isVeg) return false;
      return true;
    });

    // If query mentions spicy, thali, rice, fish, duck, pork, score matching
    const keywords = ['spicy', 'thali', 'rice', 'fish', 'duck', 'pork', 'chicken', 'tenga', 'khorikaa', 'curry'];
    const matchedKeywords = keywords.filter((k) => message.includes(k));

    if (matchedKeywords.length > 0) {
      const keywordFiltered = matchingDishes.filter((d) => {
        const text = `${d.name} ${d.description || ''}`.toLowerCase();
        return matchedKeywords.some((k) => text.includes(k));
      });
      if (keywordFiltered.length > 0) {
        matchingDishes = keywordFiltered;
      }
    }

    if (matchingDishes.length === 0) {
      matchingDishes = allDishes.slice(0, 3);
    } else {
      matchingDishes = matchingDishes.slice(0, 4);
    }

    const estimatedTotal = matchingDishes.reduce((sum, d) => sum + d.price, 0);

    const recommendation = matchingDishes.length > 0
      ? `We found ${matchingDishes.length} authentic dishes matching "${body.message}". Enjoy regional flavours from our top-rated kitchens!`
      : 'Explore our curated menu of authentic regional kitchen specialties.';

    return apiSuccess({
      recommendation,
      dishes: matchingDishes,
      estimatedTotal,
      intent: 'FOOD_RECOMMENDATION',
      matchedCount: matchingDishes.length,
      budgetApplied: maxBudget < 1000 ? maxBudget : null,
    });
  } catch (err: any) {
    return apiError(err?.message || 'Failed to generate recommendation', 500);
  }
}
