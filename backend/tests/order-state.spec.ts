import { describe, it, expect } from 'vitest';
import { OrderStateMachine } from '../src/modules/orders/order-state-machine';

describe('Order State Machine', () => {
  it('allows valid progression from CREATED to PAYMENT_CONFIRMED to PREPARING to READY', () => {
    expect(() => {
      OrderStateMachine.validateTransition('CREATED', 'PAYMENT_CONFIRMED', 'SYSTEM');
    }).not.toThrow();

    expect(() => {
      OrderStateMachine.validateTransition('PAYMENT_CONFIRMED', 'RESTAURANT_ACCEPTED', 'RESTAURANT_OWNER');
    }).not.toThrow();

    expect(() => {
      OrderStateMachine.validateTransition('RESTAURANT_ACCEPTED', 'PREPARING', 'RESTAURANT_OWNER');
    }).not.toThrow();

    expect(() => {
      OrderStateMachine.validateTransition('PREPARING', 'READY_FOR_PICKUP', 'RESTAURANT_OWNER');
    }).not.toThrow();
  });

  it('rejects invalid jumps like CREATED directly to DELIVERED', () => {
    expect(() => {
      OrderStateMachine.validateTransition('CREATED', 'DELIVERED', 'CUSTOMER');
    }).toThrow(/Invalid status transition/);
  });

  it('rejects unauthorized role attempting state change', () => {
    // Customer cannot transition order from PREPARING to READY_FOR_PICKUP
    expect(() => {
      OrderStateMachine.validateTransition('PREPARING', 'READY_FOR_PICKUP', 'CUSTOMER');
    }).toThrow(/not authorized/);
  });

  it('allows Super Admin to override transitions for operational recovery', () => {
    expect(() => {
      OrderStateMachine.validateTransition('PREPARING', 'CANCELLED', 'SUPER_ADMIN');
    }).not.toThrow();
  });
});
