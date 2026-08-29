// API Type Definitions

// User type matching API response structure
export interface User {
  _id?: string; // MongoDB ID (from users list)
  id?: string; // ID from auth response
  name?: string;
  email?: string;
  mobile?: string;
  role?: 'user' | 'admin';
  isVerified?: boolean;
  isSuperAdmin?: boolean;
  // Block state. Only a super admin can change it; a blocked user cannot sign
  // in and any token they already hold is rejected.
  isBlocked?: boolean;
  blockedAt?: string | null;
  blockedReason?: string | null;
  allowed_project_codes?: string[];
  permissions?: import('./permissions').UserPermissions;
  addresses?: any[];
  favorites?: any[];
  createdAt?: string;
  updatedAt?: string;
  // Notification insight fields
  lastActiveAt?: string;
  fcmToken?: string;
  pushEnabled?: boolean;
  platform?: string | null;
  notificationCount?: number;
  unreadNotificationCount?: number;
}

// Order summary row within a user's drill-down order history
export interface UserOrderSummary {
  _id: string;
  order_number: string;
  store_code: string;
  order_status: string;
  order_placed_at: string;
  order_summary: {
    total_amount: number;
    total_items: number;
    total_quantity: number;
  };
}

// Monthly spend trend point within a user's drill-down
export interface UserSpendTrendPoint {
  _id: string; // 'YYYY-MM'
  totalSpent: number;
  orderCount: number;
}

// Saved address within a user's drill-down (AddressBook document)
export interface UserAddress {
  _id: string;
  idaddress_book: string;
  full_name: string;
  mobile_number: string;
  email_id?: string;
  delivery_addr_line_1: string;
  delivery_addr_line_2?: string;
  delivery_addr_city: string;
  delivery_addr_pincode: string;
  is_default: 'Yes' | 'No';
}

// Favorited product within a user's drill-down (Favorite document, enriched)
export interface UserFavorite {
  _id: string;
  p_code: string;
  store_code: string;
  createdAt?: string;
  product: {
    name: string;
    image: string | null;
    mrp: number | null;
    sellingPrice: number | null;
  } | null;
}

// A line item within a user's current cart
export interface UserCartItem {
  p_code: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  package_size?: number;
  package_unit?: string;
  brand_name?: string;
  pcode_img?: string;
  store_code: string;
}

// The user's current (in-progress, not yet checked out) cart
export interface UserCart {
  store_code: string;
  items: UserCartItem[];
  subtotal: number;
  total_items: number;
  total_quantity: number;
  last_updated: string;
}

// Notification within a user's drill-down
export interface UserNotification {
  _id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

// Aggregate order stats within a user's drill-down
export interface UserOrderStats {
  totalOrders: number;
  totalSpent: number;
  completedOrders: number;
  cancelledOrders: number;
  lastOrderAt: string | null;
  avgOrderValue: number;
}

// Full response shape for GET /api/admin/users/:id
export interface UserDetail {
  user: User;
  stats: UserOrderStats;
  orders: UserOrderSummary[];
  spendTrend: UserSpendTrendPoint[];
  addresses: UserAddress[];
  favorites: UserFavorite[];
  cart: UserCart | null;
  notifications: UserNotification[];
  notificationStats: { totalCount: number; unreadCount: number };
}

// Pagination metadata
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages?: number; // Used by some endpoints
  pages?: number; // Used by some endpoints (backend returns this)
}

// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Paginated API response
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

// Auth response after OTP verification
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

// OTP send response
export interface OtpResponse {
  success: boolean;
  message: string;
}

// Users query parameters
export interface UsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'user' | 'admin';
  sort?: string;
}

// Best Seller Product (nested in BestSeller)
export interface BestSellerProduct {
  p_code: string;
  position: number;
  metadata?: {
    badge?: string;
    tagline?: string;
    highlight?: boolean;
    [key: string]: any;
  };
  redirect_url?: string;
}

// Best Seller type matching backend model
export interface BestSeller {
  _id: string;
  store_code?: string;
  store_codes?: string[];
  banner_urls: {
    desktop: string;
    mobile: string;
  };
  background_color: string;
  title: string;
  description?: string;
  redirect_url?: string;
  products?: BestSellerProduct[];
  is_active: boolean;
  sequence: number;
  createdAt: string;
  updatedAt: string;
}

// Best Sellers query parameters
export interface BestSellersQueryParams {
  page?: number;
  limit?: number;
  store_code?: string;
  is_active?: boolean;
  sort?: string;
}

// Best Seller create/update payload
export interface BestSellerPayload {
  store_code?: string;
  store_codes?: string[];
  banner_urls: {
    desktop: string;
    mobile: string;
  };
  background_color: string;
  title: string;
  description?: string;
  redirect_url?: string;
  products?: BestSellerProduct[];
  is_active: boolean;
  sequence: number;
}

// Top Seller Product (nested in TopSeller) - same structure as BestSellerProduct
export interface TopSellerProduct {
  p_code: string;
  position: number;
  metadata?: {
    badge?: string;
    tagline?: string;
    highlight?: boolean;
    [key: string]: any;
  };
  redirect_url?: string;
  store_code?: string;
}

// Top Seller type matching backend model
export interface TopSeller {
  _id: string;
  store_code?: string;
  store_codes?: string[];
  bg_color: string;
  title: string;
  products?: TopSellerProduct[];
  is_active: boolean;
  sequence: number;
  createdAt: string;
  updatedAt: string;
}

// Top Sellers query parameters
export interface TopSellersQueryParams {
  page?: number;
  limit?: number;
  store_code?: string;
  is_active?: boolean;
  sort?: string;
}

// Top Seller create/update payload
export interface TopSellerPayload {
  store_code?: string;
  store_codes?: string[];
  bg_color: string;
  title: string;
  products?: TopSellerProduct[];
  is_active: boolean;
  sequence: number;
}

// Advertisement Product (nested in Advertisement)
export interface AdvertisementProduct {
  p_code: string;
  position: number;
  redirect_url?: string;
}

// Banner URLs for desktop and mobile
export interface BannerUrls {
  desktop: string;
  mobile: string;
}

// Advertisement type matching backend model
export interface Advertisement {
  _id: string;
  title: string;
  description?: string;
  store_code?: string;
  store_codes?: string[];
  banner_url: string;
  banner_urls?: BannerUrls;
  redirect_url?: string;
  category: string;
  is_active: boolean;
  start_date: string;
  end_date?: string;
  sequence: number;
  metadata?: {
    [key: string]: any;
  };
  products: AdvertisementProduct[];
  createdAt: string;
  updatedAt: string;
}

// Advertisements query parameters
export interface AdvertisementsQueryParams {
  page?: number;
  limit?: number;
  store_code?: string;
  category?: string;
  is_active?: boolean;
  sort?: string;
}

// Advertisement create/update payload
export interface AdvertisementPayload {
  title: string;
  description?: string;
  store_code?: string;
  store_codes?: string[];
  banner_url: string;
  banner_urls?: BannerUrls;
  redirect_url?: string;
  category: string;
  is_active: boolean;
  start_date: string;
  end_date?: string;
  sequence: number;
  metadata?: {
    [key: string]: any;
  };
  products: AdvertisementProduct[];
}

// Popular Category Subcategory Item (nested in PopularCategory)
export interface PopularCategoryItem {
  sub_category_id: string;
  store_code?: string;
  position: number;
  metadata?: {
    badge?: string;
    highlight?: boolean;
    [key: string]: any;
  };
  redirect_url?: string;
}

// Popular Category type matching backend model
export interface PopularCategory {
  _id: string;
  store_code?: string;
  store_codes?: string[];
  banner_urls: {
    desktop: string;
    mobile: string;
  };
  background_color: string;
  title: string;
  description?: string;
  redirect_url?: string;
  subcategories: PopularCategoryItem[];
  is_active: boolean;
  sequence: number;
  createdAt: string;
  updatedAt: string;
}

// Popular Categories query parameters
export interface PopularCategoriesQueryParams {
  page?: number;
  limit?: number;
  store_code?: string;
  is_active?: boolean;
  sort?: string;
}

// Popular Category create/update payload
export interface PopularCategoryPayload {
  store_code?: string;
  store_codes?: string[];
  banner_urls: {
    desktop: string;
    mobile: string;
  };
  background_color: string;
  title: string;
  description?: string;
  redirect_url?: string;
  subcategories: PopularCategoryItem[];
  is_active: boolean;
  sequence: number;
}

// Pincode type matching backend model
export interface Pincode {
  _id: string;
  idpincode_master: number;
  pincode: string;
  is_enabled: 'Enabled' | 'Disabled';
  // Which store serves this pincode. One store maps to many pincodes; null
  // means enabled but not yet assigned to a store (see models/Pincode.js).
  store_code?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Pincodes query parameters
export interface PincodesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  storeCode?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Pincode create/update payload
export interface PincodePayload {
  idpincode_master: number;
  pincode: string;
  is_enabled: 'Enabled' | 'Disabled';
  store_code?: string | null;
}

// Distance slab for per-km delivery pricing
export interface DeliveryDistanceSlab {
  from_km: number;
  to_km: number | null;
  per_km_charge: number;
}

// Store type matching backend model
export interface Store {
  _id: string;
  pincode: string;
  mobile_outlet_name: string;
  store_code: string;
  is_enabled: 'Enabled' | 'Disabled';
  store_address: string;
  min_order_amount: number;
  store_open_time: string;
  store_delivery_time: string;
  // How many days from today delivery slots start being offered - 0 =
  // same-day, 1 = next-day only, 2 = day after tomorrow, etc. Distinct from
  // store_delivery_time above, which is just free-text display copy.
  delivery_start_offset_days?: number;
  store_offer_name?: string;
  latitude?: string;
  longitude?: string;
  home_delivery: 'yes' | 'no';
  self_pickup: 'yes' | 'no';
  store_message?: string;
  contact_number: string;
  email: string;
  whatsappnumber?: string;
  free_delivery_threshold?: number;
  free_delivery_radius_km?: number;
  max_delivery_radius_km?: number;
  delivery_base_charge?: number;
  delivery_base_distance_km?: number;
  delivery_per_km_charge?: number;
  delivery_distance_slabs?: DeliveryDistanceSlab[];
  handling_fee?: number;
  package_fee?: number;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

// Stores query parameters
export interface StoresQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Store create/update payload
export interface StorePayload {
  // Legacy — which pincodes a store serves is assigned on Pincode.store_code
  // instead (Outlet > Pincodes). No longer required to create/save a store.
  pincode?: string;
  mobile_outlet_name: string;
  store_code: string;
  is_enabled: 'Enabled' | 'Disabled';
  store_address: string;
  min_order_amount: number;
  store_open_time: string;
  store_delivery_time: string;
  delivery_start_offset_days?: number;
  store_offer_name?: string;
  latitude?: string;
  longitude?: string;
  home_delivery: 'yes' | 'no';
  self_pickup: 'yes' | 'no';
  store_message?: string;
  contact_number: string;
  email: string;
  whatsappnumber?: string;
  free_delivery_threshold?: number;
  free_delivery_radius_km?: number;
  max_delivery_radius_km?: number;
  delivery_base_charge?: number;
  delivery_base_distance_km?: number;
  delivery_per_km_charge?: number;
  delivery_distance_slabs?: DeliveryDistanceSlab[];
  handling_fee?: number;
  package_fee?: number;
}

// Delivery Slot type matching backend model
export interface DeliverySlot {
  _id: string;
  iddelivery_slot: number;
  delivery_slot_from: string;
  delivery_slot_to: string;
  store_code: string;
  is_active: 'yes' | 'no';
  createdAt?: string;
  updatedAt?: string;
}

// Delivery Slots query parameters
export interface DeliverySlotsQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Delivery Slot create/update payload
export interface DeliverySlotPayload {
  iddelivery_slot: number;
  delivery_slot_from: string;
  delivery_slot_to: string;
  store_code: string;
  is_active: 'yes' | 'no';
}

// Payment Mode type matching backend model
export interface PaymentMode {
  _id: string;
  idpayment_mode: number;
  payment_mode_name: string;
  is_enabled: 'Yes' | 'No';
  createdAt?: string;
  updatedAt?: string;
}

// Payment Modes query parameters
export interface PaymentModesQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Payment Mode create/update payload
export interface PaymentModePayload {
  idpayment_mode: number;
  payment_mode_name: string;
  is_enabled: 'Yes' | 'No';
}

// Store Code type for store code selector
export interface StoreCode {
  store_code: string;
  store_name: string;
}

// Product type matching backend ProductMaster model
export interface Product {
  id: string;
  p_code: string;
  barcode: string;
  product_name: string;
  product_description: string;
  package_size: number;
  package_unit: string;
  product_mrp: number;
  our_price: number;
  brand_name: string;
  store_code: string;
  pcode_status: string;
  dept_id: string;
  category_id: string;
  sub_category_id: string;
  // Extra subcategories this product is cross-listed under, beyond its
  // primary sub_category_id above. Absent/empty when there are none.
  additional_sub_category_ids?: string[];
  store_quantity: number;
  max_quantity_allowed: number;
  pcode_img: string;
}

// Products query parameters for POST endpoint
export interface ProductsQueryParams {
  store_code: string;
  search?: string;
  page?: number;
  limit?: number;
  dept_id?: string;
  category_id?: string;
  sub_category_id?: string;
}

// ProductMaster payload for create/update
export interface ProductMasterPayload {
  p_code: string;
  product_name: string;
  package_size: number;
  package_unit: string;
  product_mrp: number;
  our_price: number;
  store_code: string;
  dept_id: string;
  category_id: string;
  sub_category_id: string;
  barcode?: string;
  product_description?: string;
  brand_name?: string;
  pcode_status?: 'Y' | 'N';
  store_quantity?: number;
  max_quantity_allowed?: number;
  pcode_img?: string;
  search_keyword?: string;
  additional_sub_category_ids?: string[];
}

// Category type matching backend model
export interface Category {
  _id: string;
  idcategory_master: string;
  category_name: string;
  dept_id: string;
  department_name?: string;
  sequence_id: number;
  store_code: string;
  no_of_col: string;
  image_link: string;
  category_bg_color: string;
  // Whether this category shows on the customer mobile app. Defaults true;
  // absent on documents created before this field existed.
  is_visible?: boolean;
  __v?: number;
}

// Category payload for create/update
export interface CategoryPayload {
  idcategory_master: string;
  category_name: string;
  dept_id: string;
  sequence_id: number;
  store_code: string;
  no_of_col?: string;
  image_link?: string;
  category_bg_color?: string;
  is_visible?: boolean;
}

// Categories query parameters for POST endpoint
export interface CategoriesQueryParams {
  store_code: string;
  page?: number;
  limit?: number;
  search?: string;
  deptId?: string;
}

// Department type matching backend model
export interface Department {
  _id: string;
  department_id: string;
  department_name: string;
  dept_type_id: string;
  dept_no_of_col: number;
  store_code: string | null;
  image_link: string;
  sequence_id: number;
  __v?: number;
}

// Department payload for create/update
export interface DepartmentPayload {
  department_id: string;
  department_name: string;
  dept_type_id: string;
  sequence_id: number;
  dept_no_of_col?: number;
  store_code?: string;
  image_link?: string;
}

// Departments query parameters for GET endpoint
export interface DepartmentsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  storeCode?: string;
  deptTypeId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Subcategory type matching backend model
export interface Subcategory {
  _id: string;
  idsub_category_master: string;
  sub_category_name: string;
  category_id: string;
  main_category_name: string;
  image_link?: string;
  department_name?: string;
  // Whether this subcategory shows on the customer mobile app. Defaults
  // true; absent on documents created before this field existed.
  is_visible?: boolean;
  // Extra categories this subcategory is cross-listed under, beyond its
  // primary category_id above. Absent/empty when there are none.
  additional_category_ids?: string[];
  __v?: number;
}

// Subcategory payload for create/update
export interface SubcategoryPayload {
  idsub_category_master: string;
  sub_category_name: string;
  category_id: string;
  main_category_name: string;
  image_link?: string;
  is_visible?: boolean;
  additional_category_ids?: string[];
}

// Subcategories query parameters for POST endpoint
export interface SubcategoriesQueryParams {
  store_code: string;
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
}

// ========================================
// Dashboard Types
// ========================================

// Dashboard Overview
export interface DashboardOverview {
  users: {
    total: number;
    newToday: number;
    newThisMonth: number;
    newLastMonth: number;
    growth: number;
  };
  products: {
    total: number;
    active: number;
    outOfStock: number;
    lowStock: number;
  };
  orders: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
    pending: number;
    delivered: number;
    refunded: number;
    growth: number;
  };
  revenue: {
    total: number;
    today: number;
    thisMonth: number;
    lastMonth: number;
    averageOrderValue: number;
    growth: number | null;
  };
}

// Sales Trend Data
export interface SalesTrendData {
  _id: string; // Date string (YYYY-MM-DD)
  orders: number;
  revenue: number;
  items: number;
}

// Top Products
export interface TopProduct {
  _id: string; // Product code
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

// Top Categories
export interface TopCategory {
  _id: string; // Category ID
  categoryName: string;
  productCount: number;
  totalStock: number;
}

// Recent Orders
export interface RecentOrder {
  _id: string;
  order_number: string;
  mobile_no: string;
  order_status: string;
  order_placed_at: string;
  customer_info: {
    name: string;
    email: string;
  };
  order_summary: {
    total_amount: number;
  };
}

// Status Distribution (for orders and payments)
export interface StatusDistribution {
  _id: string; // Status name
  count: number;
  totalValue: number;
}

// User Activity
export interface UserActivity {
  activeLastHour: number;
  activeLastDay: number;
  activeLastWeek: number;
}

// ========================================
// Banners Types
// ========================================

// Banner Action type
export interface BannerAction {
  type: 'category' | 'product' | 'url' | 'none';
  value?: string;
}

// Banner Asset (for multiple banners per section)
export interface BannerAsset {
  key?: string; // Optional, defaults to bannerUrl1, bannerUrl2, etc.
  desktop?: string; // At least one of desktop or mobile required
  mobile?: string; // At least one of desktop or mobile required
}

// Banner type matching backend model
export interface Banner {
  _id: string;
  title: string;
  section_name: string;
  image_url?: string; // Optional, auto-populated from first banner asset
  banner_assets?: BannerAsset[]; // Array of up to 10 banner variants
  banner_urls?: { [key: string]: { desktop?: string; mobile?: string } }; // Object format (bannerUrl1, bannerUrl2, etc.)
  action: BannerAction;
  store_code?: string;
  store_codes?: string[];
  is_active: boolean;
  sequence: number;
  start_date?: string;
  end_date?: string;
  metadata?: {
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

// Banners query parameters
export interface BannersQueryParams {
  page?: number;
  limit?: number;
  section_name?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Banner create/update payload
export interface BannerPayload {
  title: string;
  section_name: string;
  image_url?: string; // Optional, auto-populated from first banner asset
  banner_assets?: BannerAsset[]; // Submit as array format (preferred)
  action: BannerAction;
  store_code?: string;
  store_codes?: string[];
  is_active: boolean;
  sequence: number;
  start_date?: string;
  end_date?: string;
  metadata?: {
    [key: string]: any;
  };
}

// ========================================
// Seasonal Categories Types
// ========================================

// Seasonal Category Subcategory Item
export interface SeasonalCategoryItem {
  sub_category_id: string;
  store_code?: string;
  position: number;
  redirect_url?: string;
  metadata?: {
    badge?: string;
    [key: string]: any;
  };
}

// Seasonal Category type matching backend model
export interface SeasonalCategory {
  _id: string;
  title: string;
  description?: string;
  banner_urls: {
    desktop: string;
    mobile: string;
  };
  background_color: string;
  redirect_url?: string;
  store_code?: string;
  store_codes?: string[];
  season?: 'spring' | 'summer' | 'autumn' | 'fall' | 'winter' | 'holiday' | 'festive' | 'all';
  subcategories: SeasonalCategoryItem[];
  is_active: boolean;
  sequence: number;
  start_date?: string;
  end_date?: string;
  createdAt: string;
  updatedAt: string;
}

// Seasonal Categories query parameters
export interface SeasonalCategoriesQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Seasonal Category create/update payload
export interface SeasonalCategoryPayload {
  title: string;
  description?: string;
  banner_urls: {
    desktop: string;
    mobile: string;
  };
  background_color: string;
  redirect_url?: string;
  store_code?: string;
  store_codes?: string[];
  season?: 'spring' | 'summer' | 'autumn' | 'fall' | 'winter' | 'holiday' | 'festive' | 'all';
  subcategories: SeasonalCategoryItem[];
  is_active: boolean;
  sequence: number;
  start_date?: string;
  end_date?: string;
}

// Store Code type for admin dropdown
export interface StoreCode {
  store_code: string;
  store_name: string;
}

// ========================================
// Offer Types
// ========================================

export interface DealProduct {
  p_code: string;
  product_name: string;
  deal_price: number;
  original_price: number;
  pcode_img?: string;
  max_quantity: number;
}

export interface Offer {
  _id: string;
  offer_type?: 'cart_discount' | 'product_deal';
  title: string;
  discount_amount: number;
  discount_type: 'flat' | 'percentage';
  min_cart_value: number;
  max_discount?: number;
  deal_products?: DealProduct[];
  store_codes?: string[];
  is_active: boolean;
  valid_from: string;
  valid_until?: string;
  priority: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OfferPayload {
  offer_type?: 'cart_discount' | 'product_deal';
  title: string;
  discount_amount?: number;
  discount_type?: 'flat' | 'percentage';
  min_cart_value: number;
  max_discount?: number;
  deal_products?: DealProduct[];
  store_codes?: string[];
  is_active?: boolean;
  valid_from?: string;
  valid_until?: string;
  priority?: number;
  description?: string;
}

export interface OffersQueryParams {
  page?: number;
  limit?: number;
  store_code?: string;
  is_active?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
