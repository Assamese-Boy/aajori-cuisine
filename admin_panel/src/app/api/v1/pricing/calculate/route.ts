import { NextRequest } from 'next/server';
import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 2.5;
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { restaurantId, customerLocation, items = [], couponCode } = body;

    let subtotal = 0;

    // Fetch restaurant details & menu if available
    let restaurant: any = null;
    let menuItemsMap = new Map<string, any>();

    if (restaurantId) {
      try {
        restaurant = await ServerDb.getRestaurantById(restaurantId).catch(() => null);
        if (restaurant && Array.isArray(restaurant.menu)) {
          restaurant.menu.forEach((it: any) => menuItemsMap.set(it.id, it));
        }
      } catch (_) {}
    }

    // Calculate subtotal from items
    if (Array.isArray(items) && items.length > 0) {
      for (const it of items) {
        const qty = Number(it.quantity) || 1;
        const menuItem = menuItemsMap.get(it.menuItemId);
        const unitPrice = Number(it.price || menuItem?.price || 180);
        subtotal += unitPrice * qty;
      }
    }

    // Default distance if no GPS
    let distanceKm = 2.5;
    if (customerLocation?.latitude && customerLocation?.longitude && restaurant?.location) {
      distanceKm = calculateHaversineDistanceKm(
        restaurant.location.latitude,
        restaurant.location.longitude,
        customerLocation.latitude,
        customerLocation.longitude
      );
    }

    // Delivery fee logic: base ₹25 for first 3km, ₹8/km thereafter
    const baseDeliveryFee = 25;
    const baseKm = 3;
    const perKmRate = 8;
    const deliveryFee =
      distanceKm <= baseKm
        ? baseDeliveryFee
        : baseDeliveryFee + Math.ceil(distanceKm - baseKm) * perKmRate;

    // Packaging fee from restaurant or default ₹20
    const packagingFee = Number(restaurant?.packagingFee) || 20;

    // Govt taxes (5% GST for restaurants)
    const tax = Math.round(subtotal * 0.05);

    // Coupon discount logic
    let discount = 0;
    if (couponCode) {
      const code = String(couponCode).toUpperCase().trim();
      if (code === 'AAJORI50' && subtotal >= 200) {
        discount = 50;
      } else if (code === 'BIHU20' && subtotal >= 250) {
        discount = Math.min(100, Math.round(subtotal * 0.2));
      } else if (code === 'FIRSTMEAL' && subtotal >= 150) {
        discount = 75;
      } else if (subtotal >= 300) {
        discount = 50;
      }
    }

    const total = Math.max(0, subtotal + deliveryFee + packagingFee + tax - discount);

    const result = {
      restaurantId: restaurantId || '',
      distanceKm,
      pricing: {
        subtotal,
        deliveryFee,
        packagingFee,
        tax,
        discount,
        total,
        distanceKm,
      },
      // Flat properties for compatibility with different client parsers
      subtotal,
      deliveryFee,
      packagingFee,
      taxAmount: tax,
      discountAmount: discount,
      totalCustomerPrice: total,
    };

    return apiSuccess(result);
  } catch (err: any) {
    return apiError(err?.message || 'Pricing calculation failed', 500);
  }
}
