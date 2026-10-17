import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  try {
    const [restaurants, partners] = await Promise.all([
      ServerDb.getAllRestaurants(),
      ServerDb.getAllDeliveryPartners(),
    ]);

    const activePartners = partners.map((p, idx) => ({
      id: p.id,
      name: p.fullName,
      phone: p.phone,
      vehicleType: p.vehicleType,
      isOnline: p.isOnline,
      status: p.status,
      lat: p.currentLat || 26.1550 + (idx * 0.015),
      lng: p.currentLng || 91.7690 + (idx * 0.012),
      rating: p.rating,
      completedOrders: p.completedOrders,
    }));

    const restaurantNodes = restaurants.map((r, idx) => ({
      id: r.id,
      name: r.name,
      address: r.address,
      city: r.city,
      isOpen: r.isOpen,
      rating: r.rating,
      lat: 26.1800 + (idx * 0.012),
      lng: 91.7500 + (idx * 0.015),
    }));

    return apiSuccess({
      riders: activePartners,
      restaurants: restaurantNodes,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return apiError(err?.message || 'Failed to retrieve live map data', 500);
  }
}
