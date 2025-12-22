// User Types
export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  email: string;
  phone?: string;
  name?: string;
  role: UserRole;
  country_preference?: 'germany' | 'denmark';
  created_at: string;
}

// Product Types
export type ProductCategory = 'fresh' | 'frozen';

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: ProductCategory;
  price_germany: number;
  price_denmark: number;
  original_price_germany?: number; // Original price before discount
  original_price_denmark?: number; // Original price before discount
  discount_percentage?: number; // Discount percentage (0-100)
  stock: number;
  image_url?: string;
  active: boolean;
  created_at: string;
  rating?: number; // Average rating (0-5)
  review_count?: number; // Number of reviews
}

// Order Types
export type OrderStatus = 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentMethod = 'online' | 'cod';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Order {
  id: string;
  user_id: string;
  order_date: string;
  status: OrderStatus;
  total_amount: number;
  country: 'germany' | 'denmark';
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  pickup_point_id?: string;
  delivery_address?: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  subtotal: number;
  created_at: string;
}

// Pickup Point Types
export interface PickupPoint {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  country: 'germany' | 'denmark';
  delivery_fee: number;
  active: boolean;
  created_at: string;
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
  selectedCountry: 'germany' | 'denmark';
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Products: undefined;
  ProductDetails: { productId: string };
  Cart: undefined;
  Checkout: undefined;
  OrderConfirmation: { orderId: string };
  Orders: undefined;
  OrderDetails: { orderId: string };
  Profile: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Settings: undefined;
  AdminDashboard: undefined;
  AdminProducts: undefined;
  AddProduct: undefined;
  EditProduct: { productId: string };
  AdminOrders: undefined;
  AdminPickupPoints: undefined;
  AddPickupPoint: undefined;
  EditPickupPoint: { pickupPointId: string };
  Notifications: undefined;
  NotificationSettings: undefined;
  NotificationHistory: undefined;
  NotificationTemplates: undefined;
  Onboarding: undefined;
  Welcome: undefined;
  CountrySelection: undefined;
};

// Re-export notification types
export * from './notifications';
