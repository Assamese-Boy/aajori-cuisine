import { db } from '../../data/mock-db';
import { AuditLogEntry, Order, Restaurant, DeliveryPartner, DeliveryZone } from '../../common/types';

export interface AdminDashboardMetrics {
  totalCustomers: number;
  totalRestaurants: number;
  activeRestaurants: number;
  totalDeliveryPartners: number;
  onlineDeliveryPartners: number;
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  activeOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
}

export interface LiveMapData {
  restaurants: Array<Restaurant & { activeOrderCount: number }>;
  riders: DeliveryPartner[];
  activeOrders: Order[];
  zones: DeliveryZone[];
}

export class AdminOperationsService {
  /**
   * Aggregates real platform operational metrics.
   */
  public getDashboardMetrics(): AdminDashboardMetrics {
    const orders = Array.from(db.orders.values());
    const restaurants = Array.from(db.restaurants.values());
    const riders = Array.from(db.deliveryPartners.values());
    const users = Array.from(db.users.values());

    const totalCustomers = users.filter((u) => u.role === 'CUSTOMER').length;
    const totalRestaurants = restaurants.length;
    const activeRestaurants = restaurants.filter((r) => r.isActive && r.isAcceptingOrders).length;
    const totalDeliveryPartners = riders.length;
    const onlineDeliveryPartners = riders.filter((r) => r.shiftStatus !== 'OFFLINE').length;

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const ordersTodayList = orders.filter((o) => new Date(o.createdAt) >= oneDayAgo);
    const ordersWeekList = orders.filter((o) => new Date(o.createdAt) >= oneWeekAgo);
    const ordersMonthList = orders.filter((o) => new Date(o.createdAt) >= oneMonthAgo);

    const revenueToday = ordersTodayList.reduce((acc, o) => acc + o.pricing.totalCustomerPrice, 0);
    const revenueThisWeek = ordersWeekList.reduce((acc, o) => acc + o.pricing.totalCustomerPrice, 0);
    const revenueThisMonth = ordersMonthList.reduce((acc, o) => acc + o.pricing.totalCustomerPrice, 0);

    const activeOrders = orders.filter((o) =>
      ['RESTAURANT_ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(
        o.status
      )
    ).length;

    const pendingOrders = orders.filter((o) => ['CREATED', 'PAYMENT_PENDING'].includes(o.status)).length;
    const cancelledOrders = orders.filter((o) => ['CANCELLED', 'REJECTED', 'DELIVERY_FAILED'].includes(o.status)).length;

    return {
      totalCustomers,
      totalRestaurants,
      activeRestaurants,
      totalDeliveryPartners,
      onlineDeliveryPartners,
      ordersToday: ordersTodayList.length,
      ordersThisWeek: ordersWeekList.length,
      ordersThisMonth: ordersMonthList.length,
      revenueToday: Math.round(revenueToday * 100) / 100,
      revenueThisWeek: Math.round(revenueThisWeek * 100) / 100,
      revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
      activeOrders,
      pendingOrders,
      cancelledOrders,
    };
  }

  /**
   * Supplies GIS data for MapLibre / Leaflet Live Map display.
   */
  public getLiveMapData(): LiveMapData {
    const activeOrders = Array.from(db.orders.values()).filter((o) =>
      ['PREPARING', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)
    );

    const restaurantsWithCounts = Array.from(db.restaurants.values()).map((r) => ({
      ...r,
      activeOrderCount: activeOrders.filter((o) => o.restaurantId === r.id).length,
    }));

    const riders = Array.from(db.deliveryPartners.values());
    const zones = Array.from(db.deliveryZones.values());

    return {
      restaurants: restaurantsWithCounts,
      riders,
      activeOrders,
      zones,
    };
  }

  /**
   * Retrieves platform audit logs.
   */
  public getAuditLogs(): AuditLogEntry[] {
    return [...db.auditLogs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

export const adminOperationsService = new AdminOperationsService();
