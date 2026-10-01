import { db } from '../../data/mock-db';
import { DeliveryPartner, GeoLocation, Order, RiderShiftStatus } from '../../common/types';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../common/errors';
import { orderService } from '../orders/order.service';

export class DeliveryService {
  public getRiderProfile(riderId: string): DeliveryPartner {
    const rider = db.deliveryPartners.get(riderId);
    if (!rider) {
      throw new NotFoundError('Delivery partner profile not found');
    }
    return rider;
  }

  /**
   * Toggles rider shift status (ONLINE_IDLE vs OFFLINE).
   * Does NOT track location when offline.
   */
  public updateShiftStatus(riderId: string, status: RiderShiftStatus): DeliveryPartner {
    const rider = this.getRiderProfile(riderId);
    rider.shiftStatus = status;
    return rider;
  }

  /**
   * Pushes rider location. Ignored or rejected if rider is OFFLINE to respect battery & privacy.
   */
  public updateLocation(
    riderId: string,
    location: GeoLocation,
    batteryPercentage?: number
  ): DeliveryPartner {
    const rider = this.getRiderProfile(riderId);
    if (rider.shiftStatus === 'OFFLINE') {
      throw new BadRequestError('Cannot update location while offline');
    }

    rider.currentLocation = location;
    rider.lastLocationTime = new Date().toISOString();
    if (batteryPercentage !== undefined) {
      rider.batteryPercentage = batteryPercentage;
    }

    return rider;
  }

  /**
   * Retrieves orders available for delivery broadcast (READY_FOR_PICKUP).
   */
  public getAvailableBroadcasts(): Order[] {
    return Array.from(db.orders.values()).filter(
      (o) => o.status === 'READY_FOR_PICKUP' && !o.deliveryPartnerId
    );
  }

  /**
   * Retrieves orders assigned to the specific rider.
   */
  public getAssignedOrders(riderId: string): Order[] {
    return Array.from(db.orders.values()).filter(
      (o) =>
        o.deliveryPartnerId === riderId &&
        ['RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)
    );
  }

  /**
   * Rider accepts broadcast order.
   */
  public async acceptDeliveryOrder(riderId: string, orderId: string): Promise<Order> {
    const rider = this.getRiderProfile(riderId);
    const order = db.orders.get(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.status !== 'READY_FOR_PICKUP') {
      throw new BadRequestError(`Cannot accept order with status '${order.status}'`);
    }

    if (order.deliveryPartnerId && order.deliveryPartnerId !== riderId) {
      throw new BadRequestError('This order has already been accepted by another delivery partner');
    }

    order.deliveryPartnerId = riderId;
    rider.shiftStatus = 'ORDER_ASSIGNED';

    const updated = await orderService.transitionOrderStatus(
      orderId,
      'RIDER_ASSIGNED',
      rider.user,
      `Accepted by rider ${rider.user.fullName}`
    );

    return updated;
  }

  /**
   * Rider confirms pickup from restaurant counter.
   */
  public async confirmPickup(riderId: string, orderId: string): Promise<Order> {
    const rider = this.getRiderProfile(riderId);
    const order = db.orders.get(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.deliveryPartnerId !== riderId) {
      throw new ForbiddenError('You are not the assigned delivery partner for this order');
    }

    rider.shiftStatus = 'IN_TRANSIT_TO_CUSTOMER';

    const updated = await orderService.transitionOrderStatus(
      orderId,
      'PICKED_UP',
      rider.user,
      'Order picked up from restaurant'
    );

    return updated;
  }

  /**
   * Rider confirms delivery to customer doorstep.
   */
  public async confirmDelivery(riderId: string, orderId: string): Promise<Order> {
    const rider = this.getRiderProfile(riderId);
    const order = db.orders.get(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.deliveryPartnerId !== riderId) {
      throw new ForbiddenError('You are not the assigned delivery partner for this order');
    }

    // Move to out for delivery if was picked up, then to delivered
    if (order.status === 'PICKED_UP') {
      await orderService.transitionOrderStatus(orderId, 'OUT_FOR_DELIVERY', rider.user);
    }

    const updated = await orderService.transitionOrderStatus(
      orderId,
      'DELIVERED',
      rider.user,
      'Handed over to customer'
    );

    rider.shiftStatus = 'ONLINE_IDLE';
    rider.totalCompletedOrders += 1;

    return updated;
  }

  /**
   * Rider earnings ledger calculation.
   */
  public getEarnings(riderId: string): {
    todayEarnings: number;
    weekEarnings: number;
    completedOrdersToday: number;
    totalOrders: number;
  } {
    const rider = this.getRiderProfile(riderId);
    const completed = Array.from(db.orders.values()).filter(
      (o) => o.deliveryPartnerId === riderId && o.status === 'DELIVERED'
    );

    const now = new Date();
    const isToday = (dateStr: string) => {
      const d = new Date(dateStr);
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    };

    const todayOrders = completed.filter((o) => isToday(o.updatedAt));
    const todayEarnings = todayOrders.reduce((acc, o) => acc + (o.pricing.riderPayoutAmount || 30), 0);
    const weekEarnings = completed.reduce((acc, o) => acc + (o.pricing.riderPayoutAmount || 30), 0);

    return {
      todayEarnings: Math.round(todayEarnings * 100) / 100,
      weekEarnings: Math.round(weekEarnings * 100) / 100,
      completedOrdersToday: todayOrders.length,
      totalOrders: rider.totalCompletedOrders,
    };
  }

  public listDeliveryPartners(): DeliveryPartner[] {
    return Array.from(db.deliveryPartners.values());
  }

  public createDeliveryPartner(data: {
    fullName: string;
    phone: string;
    email?: string;
    vehicleType: string;
    vehicleNumber: string;
    drivingLicenseNumber: string;
    zoneId?: string;
  }): DeliveryPartner {
    if (!data.fullName || !data.phone || !data.vehicleNumber) {
      throw new BadRequestError('Full name, phone number, and vehicle number are required');
    }

    // 1. Create User account with role DELIVERY_PARTNER
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const user = {
      id: userId,
      phone: data.phone.trim(),
      email: data.email?.trim().toLowerCase() || undefined,
      fullName: data.fullName.trim(),
      role: 'DELIVERY_PARTNER' as const,
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString(),
    };
    db.users.set(userId, user);

    // 2. Create DeliveryPartner profile
    const riderId = `rider_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newRider: DeliveryPartner = {
      id: riderId,
      user,
      vehicleType: data.vehicleType || 'Two Wheeler (Motorcycle)',
      vehicleNumber: data.vehicleNumber.trim().toUpperCase(),
      drivingLicenseNumber: data.drivingLicenseNumber || 'DL-AS01-PENDING',
      shiftStatus: 'ONLINE_IDLE',
      currentLocation: { latitude: 26.1445, longitude: 91.7362 }, // Guwahati default
      lastLocationTime: new Date().toISOString(),
      batteryPercentage: 95,
      totalCompletedOrders: 0,
      rating: 5.0,
    };

    db.deliveryPartners.set(riderId, newRider);
    return newRider;
  }

  public updateDeliveryPartner(id: string, updates: Partial<DeliveryPartner>): DeliveryPartner {
    const rider = db.deliveryPartners.get(id);
    if (!rider) {
      throw new NotFoundError('Delivery partner not found');
    }
    const updated: DeliveryPartner = {
      ...rider,
      ...updates,
      id: rider.id,
      user: updates.user ? { ...rider.user, ...updates.user } : rider.user,
    };
    if (updates.user) {
      db.users.set(rider.user.id, updated.user);
    }
    db.deliveryPartners.set(id, updated);
    return updated;
  }

  public deleteDeliveryPartner(id: string): boolean {
    const rider = db.deliveryPartners.get(id);
    if (!rider) {
      throw new NotFoundError('Delivery partner not found');
    }
    db.users.delete(rider.user.id);
    return db.deliveryPartners.delete(id);
  }
}

export const deliveryService = new DeliveryService();
