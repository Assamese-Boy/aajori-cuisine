import { v4 as uuidv4 } from 'uuid';
import { db } from '../../data/mock-db';
import { Restaurant, MenuItem, MenuCategory, GeoLocation } from '../../common/types';
import { calculateHaversineDistanceKm } from '../../common/geo';
import { NotFoundError, BadRequestError } from '../../common/errors';

export class RestaurantService {
  /**
   * Lists serviceable restaurants optionally ordered by distance to customer location.
   */
  public listRestaurants(params?: {
    location?: GeoLocation;
    cuisine?: string;
    vegOnly?: boolean;
    search?: string;
  }): Array<Restaurant & { distanceKm?: number }> {
    let list = Array.from(db.restaurants.values());

    if (params?.cuisine) {
      const q = params.cuisine.toLowerCase();
      list = list.filter((r) => r.cuisineTypes.some((c) => c.toLowerCase().includes(q)));
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.cuisineTypes.some((c) => c.toLowerCase().includes(q))
      );
    }

    const results = list.map((r) => {
      let distanceKm: number | undefined = undefined;
      if (params?.location) {
        distanceKm = calculateHaversineDistanceKm(r.location, params.location);
      }
      return { ...r, distanceKm };
    });

    if (params?.location) {
      results.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }

    return results;
  }

  public getRestaurantById(id: string): Restaurant {
    const restaurant = db.restaurants.get(id);
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }
    return restaurant;
  }

  public getRestaurantMenu(restaurantId: string): {
    restaurant: Restaurant;
    categories: Array<MenuCategory & { items: MenuItem[] }>;
  } {
    const restaurant = this.getRestaurantById(restaurantId);

    const categories = Array.from(db.menuCategories.values())
      .filter((c) => c.restaurantId === restaurantId && c.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const items = Array.from(db.menuItems.values()).filter(
      (i) => i.restaurantId === restaurantId && i.isAvailable
    );

    const structuredCategories = categories.map((cat) => ({
      ...cat,
      items: items.filter((item) => item.categoryId === cat.id),
    }));

    return {
      restaurant,
      categories: structuredCategories,
    };
  }

  public createRestaurant(data: Omit<Restaurant, 'id'>): Restaurant {
    const id = uuidv4();
    const newRestaurant: Restaurant = {
      ...data,
      id,
    };
    db.restaurants.set(id, newRestaurant);
    return newRestaurant;
  }

  public updateRestaurant(id: string, updates: Partial<Restaurant>): Restaurant {
    const existing = db.restaurants.get(id);
    if (!existing) {
      throw new NotFoundError('Restaurant not found');
    }
    const updated = { ...existing, ...updates };
    db.restaurants.set(id, updated);
    return updated;
  }

  public toggleAcceptingOrders(id: string, isAccepting: boolean): Restaurant {
    return this.updateRestaurant(id, { isAcceptingOrders: isAccepting });
  }
}

export const restaurantService = new RestaurantService();
