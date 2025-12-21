import type { ApiResponse, PaginatedResponse } from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

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
    delivery_address?: {
        address_line1: string;
        address_line2?: string;
        city: string;
        state: string;
        pincode: string;
        landmark?: string;
    };
    order_items: OrderItem[];
    order_summary: {
        total_items: number;
        total_quantity: number;
        subtotal: number;
        delivery_charge: number;
        discount: number;
        total_amount: number;
    };
    order_status: OrderStatus;
    payment_info: {
        payment_mode: string;
        payment_mode_name?: string;
        payment_status: PaymentStatus;
        transaction_id?: string;
    };
    delivery_info?: {
        delivery_type: 'home_delivery' | 'self_pickup';
        delivery_slot?: string;
        expected_delivery_date?: string;
    };
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

export type OrderStatus = 'placed' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
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
