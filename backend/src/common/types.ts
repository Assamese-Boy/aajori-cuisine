export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'RESTAURANT_OWNER'
  | 'RESTAURANT_MANAGER'
  | 'DELIVERY_PARTNER'
  | 'CUSTOMER';

export type AccountStatus =
  | 'PENDING_VERIFICATION'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DEACTIVATED';

export type OrderStatus =
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_FAILED'
  | 'RESTAURANT_ACCEPTED'
  | 'REJECTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'RIDER_ASSIGNED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'DELIVERY_FAILED'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export type PaymentStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type PaymentMethod =
  | 'UPI'
  | 'CARD'
  | 'NETBANKING'
  | 'CASH_ON_DELIVERY';

export type RiderShiftStatus =
  | 'OFFLINE'
  | 'ONLINE_IDLE'
  | 'ORDER_ASSIGNED'
  | 'IN_TRANSIT_TO_RESTAURANT'
  | 'IN_TRANSIT_TO_CUSTOMER';

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface User {
  id: string;
  phone: string;
  email?: string;
  fullName: string;
  role: UserRole;
  status: AccountStatus;
  password?: string;
  avatarUrl?: string;
  fcmToken?: string;
  createdAt: string;
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  district: string;
  postalCode: string;
  location: GeoLocation;
  deliveryInstructions?: string;
  isDefault: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  phone: string;
  email?: string;
  ownerId?: string;
  ownerName?: string;
  commissionRate: number;
  isActive: boolean;
  isAcceptingOrders: boolean;
  addressLine: string;
  city: string;
  district: string;
  postalCode: string;
  location: GeoLocation;
  avgPrepTimeMinutes: number;
  minOrderAmount: number;
  packagingFee: number;
  cuisineTypes: string[];
  logoUrl?: string;
  coverUrl?: string;
  rating?: number;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  spicinessLevel: number; // 0: Mild, 1: Medium, 2: Hot, 3: Ghost Pepper / Bhut Jolokia
  imageUrl?: string;
  prepTimeMinutes: number;
}

export interface MenuItemVariant {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface MenuItemAddon {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface DeliveryZone {
  id: string;
  name: string;
  district: string;
  centerPoint: GeoLocation;
  baseFee: number;
  baseDistanceKm: number;
  perKmFee: number;
  maxDeliveryDistanceKm: number;
  isActive: boolean;
}

export interface DeliveryPartner {
  id: string;
  user: User;
  vehicleType: string;
  vehicleNumber: string;
  drivingLicenseNumber: string;
  shiftStatus: RiderShiftStatus;
  currentLocation?: GeoLocation;
  lastLocationTime?: string;
  batteryPercentage?: number;
  rating: number;
  totalCompletedOrders: number;
}

export interface OrderPricingBreakdown {
  subtotal: number;
  packagingFee: number;
  deliveryDistanceKm: number;
  deliveryFee: number;
  platformFee: number;
  taxAmount: number;
  discountAmount: number;
  couponCode?: string;
  totalCustomerPrice: number;
  restaurantCommissionAmount: number;
  riderPayoutAmount: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  variantSnapshot?: { id: string; name: string; price: number };
  addonsSnapshot?: Array<{ id: string; name: string; price: number }>;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  restaurantId: string;
  deliveryPartnerId?: string;
  deliveryAddress: CustomerAddress;
  deliveryDistanceKm: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  pricing: OrderPricingBreakdown;
  items: OrderItem[];
  customerInstructions?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  estimatedPrepTimeMinutes: number;
  estimatedDeliveryTime?: string;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStatusHistoryItem {
  id: string;
  orderId: string;
  fromStatus?: OrderStatus;
  toStatus: OrderStatus;
  actorId?: string;
  actorRole: string;
  reason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'FLAT' | 'PERCENTAGE';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
}

export interface AuditLogEntry {
  id: string;
  actorId?: string;
  actorEmail?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
