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
  if (!lat1 || !lon1 || !lat2 || !lon2) return 2.0;
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

    // Fetch restaurant details & menu
    let restaurant: any = null;
    const menuItemsMap = new Map<string, any>();

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
        const menuItem = menuItemsMap.get(it.menuItemId || it.id);
        const unitPrice = Number(it.price || menuItem?.price || 0);
        subtotal += unitPrice * qty;
      }
    }

    // Accurate Haversine Distance calculation
    let distanceKm = 2.0;
    const restLat = Number(restaurant?.latitude ?? restaurant?.location?.latitude);
    const restLng = Number(restaurant?.longitude ?? restaurant?.location?.longitude);
    const custLat = Number(
      customerLocation?.latitude ?? customerLocation?.lat ?? customerLocation?.location?.latitude
    );
    const custLng = Number(
      customerLocation?.longitude ?? customerLocation?.lng ?? customerLocation?.location?.longitude
    );

    if (
      !isNaN(restLat) &&
      !isNaN(restLng) &&
      !isNaN(custLat) &&
      !isNaN(custLng) &&
      restLat !== 0 &&
      custLat !== 0
    ) {
      distanceKm = calculateHaversineDistanceKm(restLat, restLng, custLat, custLng);
    }

    // Distance-based delivery fee rules (Base fee + per-km thereafter or delivery zones)
    let baseDeliveryFee = 25;
    let baseKm = 3;
    let perKmRate = 8;

    try {
      const zones = await ServerDb.getAllDeliveryZones();
      const activeZone = zones.find((z) => z.isActive);
      if (activeZone) {
        if (Number(activeZone.baseFee) > 0) baseDeliveryFee = Number(activeZone.baseFee);
        if (Number(activeZone.baseDistanceKm) > 0) baseKm = Number(activeZone.baseDistanceKm);
        if (Number(activeZone.perKmFee) > 0) perKmRate = Number(activeZone.perKmFee);
      }
    } catch (_) {}

    const extraKm = Math.max(0, distanceKm - baseKm);
    const deliveryFee = Math.round(baseDeliveryFee + extraKm * perKmRate);

    // Packaging fee from restaurant (0 if not set, no hardcoded fallback)
    const packagingFee = Number(restaurant?.packagingFee) || 0;

    // Govt taxes (5% GST for restaurants)
    const tax = Math.round(subtotal * 0.05);

    // Coupon discount logic
    let discount = 0;
    if (couponCode) {
      const code = String(couponCode).toUpperCase().trim();
      try {
        const coupons = await ServerDb.getAllCoupons();
        const foundCoupon = coupons.find((c) => c.code.toUpperCase() === code && c.isActive);
        if (foundCoupon && subtotal >= Number(foundCoupon.minOrderAmount || 0)) {
          if (foundCoupon.discountType === 'PERCENTAGE') {
            const calculated = Math.round((subtotal * Number(foundCoupon.discountValue)) / 100);
            discount = foundCoupon.maxDiscountAmount
              ? Math.min(Number(foundCoupon.maxDiscountAmount), calculated)
              : calculated;
          } else {
            discount = Number(foundCoupon.discountValue) || 0;
          }
        }
      } catch (_) {}

      // Fallback standard promotions if not in DB
      if (discount === 0) {
        if (code === 'AAJORI50' && subtotal >= 200) discount = 50;
        else if (code === 'BIHU20' && subtotal >= 250) discount = Math.min(100, Math.round(subtotal * 0.2));
        else if (code === 'FIRSTMEAL' && subtotal >= 150) discount = 75;
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
