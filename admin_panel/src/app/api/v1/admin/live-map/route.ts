import { ServerDb } from '@/lib/server-db';
import { apiSuccess, apiError, handleOptions } from '@/lib/api-helper';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  try {
    const [restaurants, partners, zones, allOrders] = await Promise.all([
      ServerDb.getAllRestaurants(),
      ServerDb.getAllDeliveryPartners(),
      ServerDb.getAllDeliveryZones(),
      ServerDb.getAllOrders(),
    ]);

    const activePartners = partners.map((p) => ({
      id: p.id,
      name: p.fullName,
      phone: p.phone,
      vehicleType: p.vehicleType,
      isOnline: p.isOnline,
      status: p.status,
      shiftStatus: p.shiftStatus || (p.isOnline ? 'ONLINE_IDLE' : 'OFFLINE'),
      lat: p.currentLat,
      lng: p.currentLng,
      currentLocation: p.currentLocation,
      rating: p.rating,
      completedOrders: p.completedOrders,
    }));

    const restaurantNodes = restaurants.map((r) => ({
      id: r.id,
      name: r.name,
      address: r.address,
      city: r.city,
      isOpen: r.isOpen,
      rating: r.rating,
      lat: r.latitude,
      lng: r.longitude,
      location: r.location,
    }));

    const activeOrders = allOrders
      .filter((o) =>
        ['CREATED', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(
          o.status
        )
      )
      .map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        restaurantName: o.restaurantName,
        pricing: { totalCustomerPrice: o.total },
        deliveryAddress: o.deliveryAddress,
      }));

    return apiSuccess({
      riders: activePartners,
      restaurants: restaurantNodes,
      zones,
      activeOrders,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return apiError(err?.message || 'Failed to retrieve live map data', 500);
  }
}
