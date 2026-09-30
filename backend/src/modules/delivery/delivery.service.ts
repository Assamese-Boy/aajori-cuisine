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
}

export const deliveryService = new DeliveryService();
