export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'RESTAURANT_OWNER'
  | 'RESTAURANT_MANAGER'
  | 'DELIVERY_PARTNER'
  | 'CUSTOMER';

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
  status: 'ACTIVE' | 'SUSPENDED';
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
  spiceLevel?: 'MILD' | 'MEDIUM' | 'SPICY' | 'VERY_SPICY';
  isAvailable?: boolean;
  imageUrl?: string;
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  displayOrder: number;
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type OrderStatus =
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_CONFIRMED'
  | 'RESTAURANT_ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'RIDER_ASSIGNED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REJECTED';

export type PaymentMethod = 'UPI' | 'CARD' | 'NETBANKING' | 'CASH_ON_DELIVERY';

export interface OrderPricing {
  subtotal: number;
  deliveryFee: number;
  packagingFee: number;
  tax: number;
  discount: number;
  total: number;
  distanceKm: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  restaurantId: string;
  restaurantName?: string;
  deliveryAddress: CustomerAddress;
  deliveryDistanceKm: number;
  status: OrderStatus;
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED';
  paymentMethod: PaymentMethod;
  pricing: OrderPricing;
  items: Array<{
    id: string;
    orderId: string;
    menuItemId: string;
    name: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }>;
  assignedDeliveryPartnerId?: string;
  deliveryPartner?: {
    id: string;
    name: string;
    phone: string;
    vehicleNumber: string;
    rating: number;
    currentLocation?: GeoLocation;
  };
  customerInstructions?: string;
  createdAt: string;
  estimatedDeliveryTime?: string;
}
