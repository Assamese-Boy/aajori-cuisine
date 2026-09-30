import { v4 as uuidv4 } from 'uuid';
import { db } from '../../data/mock-db';
import { PaymentMethod, PaymentStatus, Order } from '../../common/types';
import { BadRequestError, NotFoundError } from '../../common/errors';
import { orderService } from '../orders/order.service';

export interface InitiatePaymentInput {
  orderId: string;
  paymentMethod: PaymentMethod;
  idempotencyKey?: string;
}

export interface PaymentTransactionRecord {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  gatewayTransactionId?: string;
  gatewaySignature?: string;
  createdAt: string;
  updatedAt: string;
}

export class PaymentService {
  private transactions: Map<string, PaymentTransactionRecord> = new Map();
  private processedWebhookIds: Set<string> = new Set();

  /**
   * Initiates payment order with gateway abstraction.
   */
  public async initiatePayment(input: InitiatePaymentInput): Promise<{
    paymentId: string;
    orderId: string;
    amount: number;
    currency: string;
    gatewayOptions: any;
  }> {
    const order = db.orders.get(input.orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.status !== 'CREATED' && order.status !== 'PAYMENT_PENDING') {
      throw new BadRequestError(`Cannot initiate payment for order in '${order.status}' state`);
    }

    const paymentId = uuidv4();
    const transaction: PaymentTransactionRecord = {
      id: paymentId,
      orderId: order.id,
      amount: order.pricing.totalCustomerPrice,
      currency: 'INR',
      paymentMethod: input.paymentMethod,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.transactions.set(paymentId, transaction);

    return {
      paymentId,
      orderId: order.id,
      amount: order.pricing.totalCustomerPrice,
      currency: 'INR',
      gatewayOptions: {
        provider: 'MOCK_RAZORPAY_UPI',
        keyId: 'rzp_test_aajori2026',
        amountInPaise: Math.round(order.pricing.totalCustomerPrice * 100),
        orderNumber: order.orderNumber,
        notes: {
          district: 'Kamrup Metropolitan',
        },
      },
    };
  }

  /**
   * Idempotent server-side webhook processor for payment gateways.
   */
  public async processGatewayWebhook(payload: {
    eventId: string;
    paymentId: string;
    orderId: string;
    status: 'SUCCESS' | 'FAILED';
    signature?: string;
  }): Promise<{ handled: boolean; message: string }> {
    // 1. Webhook idempotency guard
    if (this.processedWebhookIds.has(payload.eventId)) {
      return { handled: true, message: 'Webhook already processed (idempotent)' };
    }

    const order = db.orders.get(payload.orderId);
    if (!order) {
      throw new NotFoundError('Order from webhook not found');
    }

    if (payload.status === 'SUCCESS') {
      order.paymentStatus = 'SUCCESS';
      // Transition order to PAYMENT_CONFIRMED if it was pending
      if (order.status === 'PAYMENT_PENDING' || order.status === 'CREATED') {
        order.status = 'PAYMENT_CONFIRMED';
        db.orderStatusHistory.push({
          id: uuidv4(),
          orderId: order.id,
          fromStatus: 'PAYMENT_PENDING',
          toStatus: 'PAYMENT_CONFIRMED',
          actorRole: 'SYSTEM',
          reason: 'Webhook verified payment success',
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      order.paymentStatus = 'FAILED';
      if (order.status === 'PAYMENT_PENDING') {
        order.status = 'PAYMENT_FAILED';
        db.orderStatusHistory.push({
          id: uuidv4(),
          orderId: order.id,
          fromStatus: 'PAYMENT_PENDING',
          toStatus: 'PAYMENT_FAILED',
          actorRole: 'SYSTEM',
          reason: 'Webhook reported payment failure',
          createdAt: new Date().toISOString(),
        });
      }
    }

    this.processedWebhookIds.add(payload.eventId);
    return { handled: true, message: `Payment webhook processed: ${payload.status}` };
  }

  /**
   * Admin or system triggered refund.
   */
  public async processRefund(orderId: string, reason: string): Promise<Order> {
    const order = db.orders.get(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.paymentStatus !== 'SUCCESS') {
      throw new BadRequestError('Cannot refund order without successful payment');
    }

    order.paymentStatus = 'REFUNDED';
    order.status = 'REFUNDED';
    order.updatedAt = new Date().toISOString();

    db.orderStatusHistory.push({
      id: uuidv4(),
      orderId: order.id,
      toStatus: 'REFUNDED',
      actorRole: 'SYSTEM',
      reason,
      createdAt: new Date().toISOString(),
    });

    return order;
  }
}

export const paymentService = new PaymentService();
