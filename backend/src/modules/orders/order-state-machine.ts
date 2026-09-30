import { OrderStatus, UserRole } from '../../common/types';
import { BadRequestError, ForbiddenError } from '../../common/errors';

export interface TransitionRule {
  allowedNextStatuses: OrderStatus[];
  allowedRoles: (UserRole | 'SYSTEM')[];
}

export const ORDER_STATE_MACHINE_RULES: Record<OrderStatus, TransitionRule> = {
  CREATED: {
    allowedNextStatuses: ['PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'CANCELLED'],
    allowedRoles: ['CUSTOMER', 'SYSTEM', 'SUPER_ADMIN', 'ADMIN'],
  },
  PAYMENT_PENDING: {
    allowedNextStatuses: ['PAYMENT_CONFIRMED', 'PAYMENT_FAILED', 'CANCELLED'],
    allowedRoles: ['SYSTEM', 'SUPER_ADMIN', 'ADMIN'],
  },
  PAYMENT_CONFIRMED: {
    allowedNextStatuses: ['RESTAURANT_ACCEPTED', 'REJECTED', 'CANCELLED'],
    allowedRoles: ['RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'SUPER_ADMIN', 'ADMIN', 'SYSTEM'],
  },
  RESTAURANT_ACCEPTED: {
    allowedNextStatuses: ['PREPARING', 'CANCELLED'],
    allowedRoles: ['RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
  },
  PREPARING: {
    allowedNextStatuses: ['READY_FOR_PICKUP', 'CANCELLED'],
    allowedRoles: ['RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
  },
  READY_FOR_PICKUP: {
    allowedNextStatuses: ['RIDER_ASSIGNED', 'CANCELLED'],
    allowedRoles: ['DELIVERY_PARTNER', 'SUPER_ADMIN', 'ADMIN', 'SYSTEM'],
  },
  RIDER_ASSIGNED: {
    allowedNextStatuses: ['PICKED_UP', 'READY_FOR_PICKUP', 'CANCELLED'],
    allowedRoles: ['DELIVERY_PARTNER', 'SUPER_ADMIN', 'ADMIN'],
  },
  PICKED_UP: {
    allowedNextStatuses: ['OUT_FOR_DELIVERY', 'DELIVERY_FAILED'],
    allowedRoles: ['DELIVERY_PARTNER', 'SUPER_ADMIN', 'ADMIN'],
  },
  OUT_FOR_DELIVERY: {
    allowedNextStatuses: ['DELIVERED', 'DELIVERY_FAILED'],
    allowedRoles: ['DELIVERY_PARTNER', 'SUPER_ADMIN', 'ADMIN'],
  },
  REJECTED: {
    allowedNextStatuses: ['REFUND_PENDING', 'CANCELLED'],
    allowedRoles: ['SYSTEM', 'SUPER_ADMIN', 'ADMIN'],
  },
  DELIVERY_FAILED: {
    allowedNextStatuses: ['REFUND_PENDING', 'CANCELLED'],
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'SYSTEM'],
  },
  REFUND_PENDING: {
    allowedNextStatuses: ['REFUNDED'],
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'SYSTEM'],
  },
  DELIVERED: {
    allowedNextStatuses: [],
    allowedRoles: [],
  },
  CANCELLED: {
    allowedNextStatuses: ['REFUND_PENDING'],
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'SYSTEM'],
  },
  PAYMENT_FAILED: {
    allowedNextStatuses: ['CANCELLED'],
    allowedRoles: ['SYSTEM', 'SUPER_ADMIN', 'ADMIN'],
  },
  REFUNDED: {
    allowedNextStatuses: [],
    allowedRoles: [],
  },
};

export class OrderStateMachine {
  /**
   * Validates if a transition from currentStatus to toStatus is permitted by the given role.
   */
  public static validateTransition(
    currentStatus: OrderStatus,
    toStatus: OrderStatus,
    actorRole: UserRole | 'SYSTEM'
  ): void {
    const rule = ORDER_STATE_MACHINE_RULES[currentStatus];
    if (!rule) {
      throw new BadRequestError(`Unknown current order status: ${currentStatus}`);
    }

    // Super admin can override any state for operational support
    if (actorRole === 'SUPER_ADMIN') {
      return;
    }

    if (!rule.allowedNextStatuses.includes(toStatus)) {
      throw new BadRequestError(
        `Invalid status transition: Cannot move order from '${currentStatus}' to '${toStatus}'. Allowed: [${rule.allowedNextStatuses.join(
          ', '
        )}]`
      );
    }

    if (!rule.allowedRoles.includes(actorRole)) {
      throw new ForbiddenError(
        `Role '${actorRole}' is not authorized to transition order from '${currentStatus}' to '${toStatus}'`
      );
    }
  }
}
