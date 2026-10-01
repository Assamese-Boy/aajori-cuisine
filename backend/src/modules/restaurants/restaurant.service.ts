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

  public deleteRestaurant(id: string): boolean {
    if (!db.restaurants.has(id)) {
      throw new NotFoundError('Restaurant not found');
    }
    // Delete associated menu items and categories
    for (const [itemId, item] of db.menuItems.entries()) {
      if (item.restaurantId === id) db.menuItems.delete(itemId);
    }
    for (const [catId, cat] of db.menuCategories.entries()) {
      if (cat.restaurantId === id) db.menuCategories.delete(catId);
    }
    return db.restaurants.delete(id);
  }

  public createMenuItem(restaurantId: string, data: {
    name: string;
    description?: string;
    price: number;
    isVeg: boolean;
    categoryId?: string;
    categoryName?: string;
    imageUrl?: string;
    isAvailable?: boolean;
    prepTimeMinutes?: number;
  }): MenuItem {
    this.getRestaurantById(restaurantId);

    let catId = data.categoryId;
    if (!catId) {
      // Find or create default category
      const targetCatName = data.categoryName || 'Signature Dishes';
      let existingCat = Array.from(db.menuCategories.values()).find(
        (c) => c.restaurantId === restaurantId && c.name.toLowerCase() === targetCatName.toLowerCase()
      );
      if (!existingCat) {
        existingCat = {
          id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          restaurantId,
          name: targetCatName,
          displayOrder: db.menuCategories.size + 1,
          isActive: true,
        };
        db.menuCategories.set(existingCat.id, existingCat);
      }
      catId = existingCat.id;
    }

    const newItem: MenuItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      restaurantId,
      categoryId: catId,
      name: data.name,
      description: data.description || '',
      price: Number(data.price),
      isVeg: Boolean(data.isVeg),
      imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
      isAvailable: data.isAvailable !== undefined ? Boolean(data.isAvailable) : true,
      spicinessLevel: 1,
      prepTimeMinutes: data.prepTimeMinutes || 20,
    };

    db.menuItems.set(newItem.id, newItem);
    return newItem;
  }

  public updateMenuItem(itemId: string, updates: Partial<MenuItem>): MenuItem {
    const item = db.menuItems.get(itemId);
    if (!item) {
      throw new NotFoundError('Menu item not found');
    }
    const updated: MenuItem = {
      ...item,
      ...updates,
      id: item.id,
      restaurantId: item.restaurantId,
    };
    db.menuItems.set(itemId, updated);
    return updated;
  }

  public deleteMenuItem(itemId: string): boolean {
    if (!db.menuItems.has(itemId)) {
      throw new NotFoundError('Menu item not found');
    }
    return db.menuItems.delete(itemId);
  }
}

export const restaurantService = new RestaurantService();
