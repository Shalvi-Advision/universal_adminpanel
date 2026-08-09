import type { ApiResponse, PaginatedResponse } from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// Delivery address as stored on the order (models/Order.js deliveryInfoSchema).
export interface OrderDeliveryAddress {
    full_name?: string;
    mobile_number?: string;
    email_id?: string;
    line_1?: string;
    line_2?: string;
    city?: string;
    pincode?: string;
    latitude?: string;
    longitude?: string;
    area_id?: string;
}

// Order type matching backend model
export interface Order {
    _id: string;
    order_number: string;
    mobile_no: string;
    user_id?: string;
    store_code: string;
    customer_info: {
        name: string;
        email?: string;
        phone?: string;
    };
    order_items: OrderItem[];
    order_summary: {
        total_items: number;
        total_quantity?: number;
        subtotal: number;
        delivery_charges?: number;
        tax_amount?: number;
        discount_amount?: number;
        total_amount: number;
    };
    order_status: OrderStatus;
    payment_info: {
        payment_mode_id?: number;
        payment_mode_name?: string;
        payment_status: PaymentStatus;
        transaction_id?: string;
    };
    delivery_info?: {
        delivery_date?: string;
        delivery_slot_id?: number;
        delivery_slot_from?: string;
        delivery_slot_to?: string;
        delivery_address?: OrderDeliveryAddress;
    };
    order_notes?: string;
    cancel_reason?: string;
    cancelled_at?: string;
    estimated_delivery_date?: string;
    order_placed_at: string;
    last_updated_at: string;
    status_history?: {
        status: string;
        timestamp: string;
        note?: string;
    }[];
}

export interface OrderItem {
    p_code: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_image?: string;
}

// The eight buckets the Orders page exposes as tabs, in workflow order.
// Mirrors constants/orderStatus.js in the API.
export const ORDER_STATUSES = [
    'pending',
    'accepted',
    'accepted_by_store',
    'in_packaging',
    'out_for_delivery',
    'delivered',
    'payment_processing',
    'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    accepted_by_store: 'Accepted By Store',
    in_packaging: 'In Packaging',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    payment_processing: 'Payment Processing',
    cancelled: 'Cancelled',
};

// Pre-rename values still present on documents the migration has not touched.
const LEGACY_STATUS_MAP: Record<string, OrderStatus> = {
    placed: 'pending',
    confirmed: 'accepted',
    processing: 'accepted_by_store',
    packed: 'in_packaging',
    shipped: 'out_for_delivery',
    refunded: 'cancelled',
};

// Reads a raw order_status off an order, folding legacy spellings.
export function normalizeOrderStatus(raw?: string): OrderStatus {
    if (!raw) return 'pending';
    return LEGACY_STATUS_MAP[raw] ?? (raw as OrderStatus);
}

export function orderStatusLabel(raw?: string): string {
    const status = normalizeOrderStatus(raw);
    return ORDER_STATUS_LABELS[status] ?? status;
}
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface OrdersQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: OrderStatus | '';
    paymentStatus?: PaymentStatus | '';
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// Get all orders with filtering and pagination
export async function getOrders(
    params: OrdersQueryParams = {}
): Promise<PaginatedResponse<Order>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const url = `/api/admin/orders${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<PaginatedResponse<Order>>(url);
}

// Get single order by ID
export async function getOrderById(id: string): Promise<ApiResponse<Order>> {
    return apiClient.get<ApiResponse<Order>>(`/api/admin/orders/${id}`);
}

// Update order status
export async function updateOrderStatus(
    id: string,
    status: OrderStatus
): Promise<ApiResponse<Order>> {
    return apiClient.patch<ApiResponse<Order>>(`/api/admin/orders/${id}/status`, { status });
}

// Update payment status
export async function updatePaymentStatus(
    id: string,
    paymentStatus: PaymentStatus,
    transactionId?: string
): Promise<ApiResponse<Order>> {
    return apiClient.patch<ApiResponse<Order>>(`/api/admin/orders/${id}/payment-status`, {
        paymentStatus,
        transactionId,
    });
}

// Update order details
export async function updateOrder(
    id: string,
    data: Partial<Order>
): Promise<ApiResponse<Order>> {
    return apiClient.put<ApiResponse<Order>>(`/api/admin/orders/${id}`, data);
}

// Delete order (only if placed or cancelled)
export async function deleteOrder(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`/api/admin/orders/${id}`);
}

// Count orders per status tab. Counts honour search/date filters but not the
// status filter, so the tab badges do not change as tabs are switched.
export async function getOrderStatusCounts(params: {
    search?: string;
    startDate?: string;
    endDate?: string;
} = {}): Promise<ApiResponse<{ total: number; counts: Record<OrderStatus, number> }>> {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    return apiClient.get<ApiResponse<{ total: number; counts: Record<OrderStatus, number> }>>(
        `/api/admin/orders/stats/status-counts${queryString ? `?${queryString}` : ''}`
    );
}

// Bulk update order status
export async function bulkUpdateOrderStatus(
    orderIds: string[],
    status: OrderStatus
): Promise<ApiResponse<{ matched: number; modified: number }>> {
    return apiClient.post<ApiResponse<{ matched: number; modified: number }>>(
        '/api/admin/orders/bulk-update-status',
        { orderIds, status }
    );
}
