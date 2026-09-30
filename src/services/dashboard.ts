import type {
  TopProduct,
  ApiResponse,
  RecentOrder,
  TopCategory,
  UserActivity,
  SalesTrendData,
  DashboardOverview,
  StatusDistribution,
} from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// store_code is optional everywhere here: omitted, the backend shows
// full-tenant totals (or a store-restricted admin's own branch(es),
// applied server-side regardless of what's sent) — passed, it drills into
// one branch, same as the store switcher used across the rest of the panel.
function storeQuery(storeCode?: string | null, extra: Record<string, string | number> = {}) {
  const params = new URLSearchParams();
  if (storeCode) params.set('store_code', storeCode);
  for (const [key, value] of Object.entries(extra)) params.set(key, String(value));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// Get dashboard overview statistics
export async function getDashboardOverview(
  storeCode?: string | null
): Promise<ApiResponse<DashboardOverview>> {
  return apiClient.get<ApiResponse<DashboardOverview>>(
    `/api/admin/dashboard/overview${storeQuery(storeCode)}`
  );
}

// Get sales trend data
export async function getSalesTrend(
  days: number = 30,
  storeCode?: string | null
): Promise<ApiResponse<SalesTrendData[]>> {
  return apiClient.get<ApiResponse<SalesTrendData[]>>(
    `/api/admin/dashboard/sales-trend${storeQuery(storeCode, { days })}`
  );
}

// Get top products
export async function getTopProducts(
  limit: number = 10,
  storeCode?: string | null
): Promise<ApiResponse<TopProduct[]>> {
  return apiClient.get<ApiResponse<TopProduct[]>>(
    `/api/admin/dashboard/top-products${storeQuery(storeCode, { limit })}`
  );
}

// Get top categories
export async function getTopCategories(limit: number = 10): Promise<ApiResponse<TopCategory[]>> {
  return apiClient.get<ApiResponse<TopCategory[]>>(
    `/api/admin/dashboard/top-categories?limit=${limit}`
  );
}

// Get recent orders
export async function getRecentOrders(
  limit: number = 10,
  storeCode?: string | null
): Promise<ApiResponse<RecentOrder[]>> {
  return apiClient.get<ApiResponse<RecentOrder[]>>(
    `/api/admin/dashboard/recent-orders${storeQuery(storeCode, { limit })}`
  );
}

// Get order status distribution
export async function getOrderStatusDistribution(
  storeCode?: string | null
): Promise<ApiResponse<StatusDistribution[]>> {
  return apiClient.get<ApiResponse<StatusDistribution[]>>(
    `/api/admin/dashboard/order-status-distribution${storeQuery(storeCode)}`
  );
}

// Get payment status distribution
export async function getPaymentStatusDistribution(
  storeCode?: string | null
): Promise<ApiResponse<StatusDistribution[]>> {
  return apiClient.get<ApiResponse<StatusDistribution[]>>(
    `/api/admin/dashboard/payment-status-distribution${storeQuery(storeCode)}`
  );
}

// Get user activity stats
export async function getUserActivity(
  storeCode?: string | null
): Promise<ApiResponse<UserActivity>> {
  return apiClient.get<ApiResponse<UserActivity>>(
    `/api/admin/dashboard/user-activity${storeQuery(storeCode)}`
  );
}
