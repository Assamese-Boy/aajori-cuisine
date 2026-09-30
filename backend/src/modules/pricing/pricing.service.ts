import { db } from '../../data/mock-db';
import { calculateHaversineDistanceKm } from '../../common/geo';
import { GeoLocation, OrderPricingBreakdown, MenuItem } from '../../common/types';
import { BadRequestError, NotFoundError } from '../../common/errors';

export interface PricingCalculationItemInput {
  menuItemId: string;
  quantity: number;
  variantId?: string;
  addonIds?: string[];
}

export interface PricingCalculationInput {
  restaurantId: string;
  customerLocation: GeoLocation;
  items: PricingCalculationItemInput[];
  couponCode?: string;
}

export interface AuthoritativePricingResult {
  pricing: OrderPricingBreakdown;
  validatedItems: Array<{
    menuItem: MenuItem;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  isServiceable: boolean;
  distanceKm: number;
}

export class PricingEngineService {
  /**
   * Calculates the authoritative price breakdown.
   * NEVER trust client prices.
   */
  public calculateOrderPricing(input: PricingCalculationInput): AuthoritativePricingResult {
    const restaurant = db.restaurants.get(input.restaurantId);
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }

    if (!restaurant.isActive || !restaurant.isAcceptingOrders) {
      throw new BadRequestError('This restaurant is currently not accepting orders');
    }

    if (!input.items || input.items.length === 0) {
      throw new BadRequestError('Cannot calculate pricing for an empty cart');
    }

    // 1. Calculate and validate items subtotal from authoritative DB prices
    let subtotal = 0;
    const validatedItems: Array<{
      menuItem: MenuItem;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }> = [];

    for (const cartItem of input.items) {
      const item = db.menuItems.get(cartItem.menuItemId);
      if (!item) {
        throw new NotFoundError(`Menu item ${cartItem.menuItemId} does not exist`);
      }
      if (item.restaurantId !== restaurant.id) {
        throw new BadRequestError(`Item ${item.name} does not belong to restaurant ${restaurant.name}`);
      }
      if (!item.isAvailable) {
        throw new BadRequestError(`Item ${item.name} is currently sold out`);
      }
      if (cartItem.quantity <= 0) {
        throw new BadRequestError(`Invalid quantity for item ${item.name}`);
      }

      const itemUnitPrice = Number(item.price);
      const itemSubtotal = Math.round(itemUnitPrice * cartItem.quantity * 100) / 100;
      subtotal += itemSubtotal;

      validatedItems.push({
        menuItem: item,
        quantity: cartItem.quantity,
        unitPrice: itemUnitPrice,
        subtotal: itemSubtotal,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;

    // Minimum order check
    if (subtotal < restaurant.minOrderAmount) {
      throw new BadRequestError(
        `Minimum order amount for ${restaurant.name} is ₹${restaurant.minOrderAmount}. Current subtotal is ₹${subtotal}.`
      );
    }

    // 2. Geospatial distance and delivery fee calculation
    const distanceKm = calculateHaversineDistanceKm(restaurant.location, input.customerLocation);

    // Find applicable delivery zone or use default zone
    const zone = Array.from(db.deliveryZones.values())[0];
    const maxRadius = zone ? zone.maxDeliveryDistanceKm : 10.0;

    if (distanceKm > maxRadius) {
      throw new BadRequestError(
        `Delivery location is ${distanceKm} km away, which exceeds maximum delivery radius of ${maxRadius} km.`
      );
    }

    // Tiered delivery fee formula
    let deliveryFee = 20.0; // Base 0 - 3 km
    if (distanceKm > 3 && distanceKm <= 5) {
      deliveryFee = 20.0 + (distanceKm - 3) * 7.5; // Up to ₹35
    } else if (distanceKm > 5) {
      deliveryFee = 35.0 + (distanceKm - 5) * 5.0; // Up to ₹50+
    }
    deliveryFee = Math.round(deliveryFee * 100) / 100;

    // 3. Packaging & Platform Fee
    const packagingFee = Number(restaurant.packagingFee || 15.0);
    const platformFee = 5.0; // Standard district platform fee

    // 4. Taxes (5% GST on food services in India)
    const taxAmount = Math.round(subtotal * 0.05 * 100) / 100;

    // 5. Coupon / Promotion Engine
    let discountAmount = 0;
    let appliedCouponCode: string | undefined = undefined;

    if (input.couponCode) {
      const codeUpper = input.couponCode.trim().toUpperCase();
      const coupon = db.coupons.get(codeUpper);

      if (!coupon || !coupon.isActive) {
        throw new BadRequestError(`Coupon code '${input.couponCode}' is invalid or expired`);
      }

      const now = new Date();
      if (now < new Date(coupon.validFrom) || now > new Date(coupon.validUntil)) {
        throw new BadRequestError(`Coupon code '${input.couponCode}' is not currently active`);
      }

      if (subtotal < coupon.minOrderAmount) {
        throw new BadRequestError(
          `Coupon '${coupon.code}' requires a minimum order subtotal of ₹${coupon.minOrderAmount}`
        );
      }

      if (coupon.discountType === 'FLAT') {
        discountAmount = coupon.discountValue;
      } else if (coupon.discountType === 'PERCENTAGE') {
        let calcDiscount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount && calcDiscount > coupon.maxDiscountAmount) {
          calcDiscount = coupon.maxDiscountAmount;
        }
        discountAmount = calcDiscount;
      }

      discountAmount = Math.round(discountAmount * 100) / 100;
      appliedCouponCode = coupon.code;
    }

    // 6. Authoritative Total Customer Price
    // Formula: Subtotal + Packaging + Delivery + Platform + Taxes - Discount
    const rawTotal = subtotal + packagingFee + deliveryFee + platformFee + taxAmount - discountAmount;
    const totalCustomerPrice = Math.max(0, Math.round(rawTotal * 100) / 100);

    // 7. Restaurant Commission and Rider Payout
    const commissionRate = restaurant.commissionRate || 12.0;
    const restaurantCommissionAmount = Math.round(((subtotal * commissionRate) / 100) * 100) / 100;

    // Rider Payout = Base (₹25) + Distance incentive
    const riderPayoutAmount = Math.round((25.0 + Math.max(0, distanceKm - 2) * 5.0) * 100) / 100;

    const pricing: OrderPricingBreakdown = {
      subtotal,
      packagingFee,
      deliveryDistanceKm: distanceKm,
      deliveryFee,
      platformFee,
      taxAmount,
      discountAmount,
      couponCode: appliedCouponCode,
      totalCustomerPrice,
      restaurantCommissionAmount,
      riderPayoutAmount,
    };

    return {
      pricing,
      validatedItems,
      isServiceable: true,
      distanceKm,
    };
  }
}

export const pricingEngineService = new PricingEngineService();
