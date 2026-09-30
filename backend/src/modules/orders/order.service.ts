import { v4 as uuidv4 } from 'uuid';
import { db } from '../../data/mock-db';
import { pricingEngineService } from '../pricing/pricing.service';
import { OrderStateMachine } from './order-state-machine';
import {
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  User,
  CustomerAddress,
} from '../../common/types';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../common/errors';

export interface CreateOrderInput {
  restaurantId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    variantId?: string;
    addonIds?: string[];
  }>;
  deliveryAddressId: string;
  paymentMethod: PaymentMethod;
  customerInstructions?: string;
  couponCode?: string;
  idempotencyKey?: string;
}

export class OrderService {
  /**
   * Authoritative order creation with idempotency and pricing snapshot.
   */
  public async createOrder(customer: User, input: CreateOrderInput): Promise<Order> {
    // 1. Idempotency check
    if (input.idempotencyKey) {
      const existingOrderId = db.idempotencyKeys.get(input.idempotencyKey);
      if (existingOrderId) {
        const existingOrder = db.orders.get(existingOrderId);
        if (existingOrder) {
          return existingOrder;
        }
      }
    }

    // 2. Fetch delivery address
    const address = db.customerAddresses.get(input.deliveryAddressId);
    if (!address) {
      throw new NotFoundError('Delivery address not found');
    }
    if (address.customerId !== customer.id) {
      throw new ForbiddenError('You can only use your own delivery address');
    }

    // 3. Authoritative pricing calculation
    const pricingResult = pricingEngineService.calculateOrderPricing({
      restaurantId: input.restaurantId,
      customerLocation: address.location,
      items: input.items,
      couponCode: input.couponCode,
    });

    const orderId = uuidv4();
    const orderNumber = `AJR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(
      db.orders.size + 1
    ).padStart(4, '0')}`;

    // 4. Create immutable order item snapshots
    const orderItems: OrderItem[] = pricingResult.validatedItems.map((v) => ({
      id: uuidv4(),
      orderId,
      menuItemId: v.menuItem.id,
      name: v.menuItem.name,
      unitPrice: v.unitPrice,
      quantity: v.quantity,
      subtotal: v.subtotal,
    }));

    // 5. Initial status: COD goes to PAYMENT_CONFIRMED (ready for restaurant), online goes to PAYMENT_PENDING
    const initialStatus: OrderStatus =
      input.paymentMethod === 'CASH_ON_DELIVERY' ? 'PAYMENT_CONFIRMED' : 'PAYMENT_PENDING';

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerId: customer.id,
      restaurantId: input.restaurantId,
      deliveryAddress: { ...address },
      deliveryDistanceKm: pricingResult.distanceKm,
      status: initialStatus,
      paymentStatus: input.paymentMethod === 'CASH_ON_DELIVERY' ? 'PENDING' : 'PENDING',
      paymentMethod: input.paymentMethod,
      pricing: pricingResult.pricing,
      items: orderItems,
      customerInstructions: input.customerInstructions,
      estimatedPrepTimeMinutes: 25,
      idempotencyKey: input.idempotencyKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.orders.set(orderId, newOrder);

    if (input.idempotencyKey) {
      db.idempotencyKeys.set(input.idempotencyKey, orderId);
    }

    // 6. Record status history
    db.orderStatusHistory.push({
      id: uuidv4(),
      orderId,
      toStatus: initialStatus,
      actorId: customer.id,
      actorRole: customer.role,
      reason: 'Order created by customer',
      createdAt: new Date().toISOString(),
    });

    return newOrder;
  }

  /**
   * Transitions an order from its current status to a new status with validation.
   */
  public async transitionOrderStatus(
    orderId: string,
    toStatus: OrderStatus,
    actor: User,
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<Order> {
    const order = db.orders.get(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Role-specific ownership checks
    if (actor.role === 'CUSTOMER' && order.customerId !== actor.id) {
      throw new ForbiddenError('You can only update your own order');
    }
    if (
      (actor.role === 'RESTAURANT_OWNER' || actor.role === 'RESTAURANT_MANAGER') &&
      order.restaurantId !== actor.id // In production, checked via restaurant_staff table
    ) {
      // allow for demo if actor is restaurant role
    }

    // Validate transition via state machine
    OrderStateMachine.validateTransition(order.status, toStatus, actor.role);

    const fromStatus = order.status;
    order.status = toStatus;
    order.updatedAt = new Date().toISOString();

    if (toStatus === 'DELIVERED') {
      order.paymentStatus = 'SUCCESS';
    }

    // Record audit trail in order_status_history
    db.orderStatusHistory.push({
      id: uuidv4(),
      orderId,
      fromStatus,
      toStatus,
      actorId: actor.id,
      actorRole: actor.role,
      reason,
      metadata,
      createdAt: new Date().toISOString(),
    });

    return order;
  }

  /**
   * Retrieves order by ID with authorization verification.
   */
  public async getOrderById(orderId: string, requestingUser?: User): Promise<{ order: Order; history: any[] }> {
    const order = db.orders.get(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (requestingUser) {
      if (requestingUser.role === 'CUSTOMER' && order.customerId !== requestingUser.id) {
        throw new ForbiddenError('Unauthorized to view this order');
      }
      if (
        requestingUser.role === 'DELIVERY_PARTNER' &&
        order.deliveryPartnerId &&
        order.deliveryPartnerId !== requestingUser.id
      ) {
        throw new ForbiddenError('Unauthorized to view this order');
      }
    }

    const history = db.orderStatusHistory
      .filter((h) => h.orderId === orderId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return { order, history };
  }

  /**
   * Lists orders filtered by role/parameters.
   */
  public async listOrders(filters: {
    customerId?: string;
    restaurantId?: string;
    status?: OrderStatus;
    limit?: number;
  }): Promise<Order[]> {
    let list = Array.from(db.orders.values());

    if (filters.customerId) {
      list = list.filter((o) => o.customerId === filters.customerId);
    }
    if (filters.restaurantId) {
      list = list.filter((o) => o.restaurantId === filters.restaurantId);
    }
    if (filters.status) {
      list = list.filter((o) => o.status === filters.status);
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filters.limit) {
      list = list.slice(0, filters.limit);
    }

    return list;
  }
}

export const orderService = new OrderService();
