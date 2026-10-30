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
    fulfillment_type?: 'delivery' | 'pickup';
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
    order_confirmed_at?: string;
    order_completed_at?: string;
    actual_delivery_date?: string;
    last_updated_at: string;
    store_name?: string;
    project_code?: string;
    status_history?: OrderStatusHistoryEntry[];
    // Only present for tenants with picker_integration_enabled, and only once
    // the matching Picker event has actually arrived — absence means "no
    // delivery data to show yet", not an error.
    delivery_tracking?: OrderDeliveryTracking;
}

export interface OrderDeliveryTracking {
    picker?: {
        id?: string;
        name?: string;
        phone?: string;
    };
    picking_assigned_at?: string;
    picking_completed_at?: string;
    rider?: {
        id?: string;
        name?: string;
        phone?: string;
    };
    assigned_at?: string;
    started_at?: string;
    delivered_at?: string;
    failed_reason?: string;
    proof_of_delivery?: {
        photo_urls?: string[];
        signature_url?: string;
        recipient_name?: string;
        notes?: string;
        latitude?: string;
        longitude?: string;
        distance_to_customer_m?: number;
        out_of_geofence?: boolean;
        captured_at?: string;
    };
}

// One step of the order's status timeline (API: utils/orderStatusHistory.js).
export interface OrderStatusHistoryEntry {
    status: string;
    from_status?: string;
    changed_at: string;
    changed_by_role?: 'admin' | 'customer' | 'system';
    changed_by_id?: string;
    changed_by_name?: string;
    note?: string;
    // Set when the entry was reconstructed from the order's timestamps rather
    // than recorded at the moment the status changed.
    derived?: boolean;
}

export interface OrderHistory {
    order_number: string;
    current_status: OrderStatus;
    // True when the whole timeline had to be inferred from timestamps.
    derived: boolean;
    timeline: OrderStatusHistoryEntry[];
}

export interface OrderItem {
    p_code: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    // Catalogue MRP captured at placement time. Absent on older orders, which
    // is why the pick list shows a dash rather than a fabricated discount.
    mrp?: number;
    package_size?: number;
    package_unit?: string;
    brand_name?: string;
    pcode_img?: string;
    product_image?: string;
    // Set by the API the first time an admin edits this line (models/Order.js)
    // — the quantity the customer actually ordered, kept even after further
    // edits so the pick list can always show the true original struck through.
    original_quantity?: number;
    // Soft-removed: still rendered (struck through), excluded from totals.
    removed?: boolean;
    edited_at?: string;
    edited_by_name?: string;
    // Set from Picker's 'picking_completed' webhook event, matched onto this
    // line by p_code. Absent for non-picker tenants or before picking is done.
    picker_status?: 'pending' | 'picked' | 'not_available' | 'expired' | 'damaged';
    picked_quantity?: number;
    picker_remark?: string;
    picker_photo_url?: string;
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
    'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Only meaningful for a tenant whose fulfillment is managed by an external
// ERP/SAP system (Project.config.erp_integrated) — a tenant that runs
// fulfillment entirely through this panel has no "store accepted it" / "it's
// being packed" signal of its own. Mirrors constants/orderStatus.js#ERP_ONLY_STATUSES.
export const ERP_ONLY_STATUSES: OrderStatus[] = ['accepted_by_store', 'in_packaging'];

// The tab/dropdown vocabulary for one tenant. ORDER_STATUSES itself stays the
// full list — orders written while a tenant was integrated must stay
// resolvable even after the flag is later turned off (see orderStatusLabel,
// the status-colour map, etc., none of which should ever not recognise a
// status an order might actually carry).
export function getOrderStatusesFor(isErpIntegrated: boolean): OrderStatus[] {
    if (isErpIntegrated) return [...ORDER_STATUSES];
    return ORDER_STATUSES.filter((status) => !ERP_ONLY_STATUSES.includes(status));
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    accepted_by_store: 'Accepted By Store',
    in_packaging: 'In Packaging',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
};

// Pre-rename values still present on documents the migration has not touched,
// plus payment_processing, a tab that was retired: an order that still carries
// it reads as Pending here exactly as it does on the API side.
const LEGACY_STATUS_MAP: Record<string, OrderStatus> = {
    placed: 'pending',
    confirmed: 'accepted',
    processing: 'accepted_by_store',
    packed: 'in_packaging',
    shipped: 'out_for_delivery',
    refunded: 'cancelled',
    payment_processing: 'pending',
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

// The forward path an admin walks an order down, one step per click, keyed by
// the status the order is in now. A status absent from this map is terminal
// (delivered, cancelled) and offers no next step.
//
// `label` names the destination, so the button always says which tab the order
// is about to land in. The first step is the exception: "Accept" is the wording
// this panel and the legacy one have always used there, and it reads as an
// action rather than as a state.
//
// The backend does not enforce a transition graph beyond the ERP-only gate
// added alongside this map (see routes/admin/orders.js) — so this map is the
// only thing defining the happy path. Deliberately forward-only: correcting a
// mistake means going through the status dialog on the chip, which still
// allows any status this tenant's vocabulary includes.
//
// Two variants: a tenant whose fulfillment is ERP-integrated gets the full
// 5-hop path; everyone else skips straight from Accepted to Out for Delivery,
// since Accepted By Store / In Packaging don't mean anything for them.
const NEXT_ORDER_STATUS_ERP: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
    pending: { status: 'accepted', label: 'Accept' },
    accepted: { status: 'accepted_by_store', label: 'Accepted By Store' },
    accepted_by_store: { status: 'in_packaging', label: 'In Packaging' },
    in_packaging: { status: 'out_for_delivery', label: 'Out for Delivery' },
    out_for_delivery: { status: 'delivered', label: 'Delivered' },
};

const NEXT_ORDER_STATUS_BASIC: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
    pending: { status: 'accepted', label: 'Accept' },
    accepted: { status: 'out_for_delivery', label: 'Out for Delivery' },
    out_for_delivery: { status: 'delivered', label: 'Delivered' },
};

// Kept for any caller that genuinely wants the full-workflow map regardless
// of tenant (e.g. displaying "what would the next step be if this tenant were
// integrated"); normal callers should use getNextOrderStatus below.
export const NEXT_ORDER_STATUS = NEXT_ORDER_STATUS_ERP;

// The step an order can be advanced to, or null once it has reached the end of
// the workflow (or there is no next step in this tenant's vocabulary). Folds
// legacy spellings on the way in.
export function getNextOrderStatus(
    raw: string | undefined,
    isErpIntegrated: boolean
): { status: OrderStatus; label: string } | null {
    const map = isErpIntegrated ? NEXT_ORDER_STATUS_ERP : NEXT_ORDER_STATUS_BASIC;
    return map[normalizeOrderStatus(raw)] ?? null;
}
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Tenant-level flags the Orders page needs that aren't per-order — piggybacked
// onto the two endpoints the page already calls (see routes/admin/orders.js),
// rather than a second request to /api/admin/project-settings, which needs a
// different permission (dynamicSection:view vs. this page's orders:view).
export interface OrderStatusMeta {
    erp_integrated: boolean;
}

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
): Promise<PaginatedResponse<Order> & { meta: OrderStatusMeta }> {
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

    return apiClient.get<PaginatedResponse<Order> & { meta: OrderStatusMeta }>(url);
}

// Get single order by ID
export async function getOrderById(id: string): Promise<ApiResponse<Order>> {
    return apiClient.get<ApiResponse<Order>>(`/api/admin/orders/${id}`);
}

// Status change timeline for one order
export async function getOrderHistory(id: string): Promise<ApiResponse<OrderHistory>> {
    return apiClient.get<ApiResponse<OrderHistory>>(`/api/admin/orders/${id}/history`);
}

// Update order status
export async function updateOrderStatus(
    id: string,
    status: OrderStatus,
    note?: string
): Promise<ApiResponse<Order>> {
    return apiClient.patch<ApiResponse<Order>>(`/api/admin/orders/${id}/status`, { status, note });
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

// Change one line's quantity on an already-placed order. Notifies the
// customer (in-app + push) and recomputes order_summary server-side.
export async function updateOrderItemQuantity(
    id: string,
    pCode: string,
    quantity: number
): Promise<ApiResponse<Order>> {
    return apiClient.patch<ApiResponse<Order>>(
        `/api/admin/orders/${id}/items/${encodeURIComponent(pCode)}/quantity`,
        { quantity }
    );
}

// Soft-removes one line from an already-placed order — kept on the order,
// marked removed, never deleted. Notifies the customer and recomputes
// order_summary server-side. Rejected if it's the last active line.
export async function removeOrderItem(id: string, pCode: string): Promise<ApiResponse<Order>> {
    return apiClient.patch<ApiResponse<Order>>(
        `/api/admin/orders/${id}/items/${encodeURIComponent(pCode)}/remove`,
        {}
    );
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
} = {}): Promise<
    ApiResponse<{ total: number; counts: Record<OrderStatus, number> }> & { meta: OrderStatusMeta }
> {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    return apiClient.get<
        ApiResponse<{ total: number; counts: Record<OrderStatus, number> }> & { meta: OrderStatusMeta }
    >(`/api/admin/orders/stats/status-counts${queryString ? `?${queryString}` : ''}`);
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
