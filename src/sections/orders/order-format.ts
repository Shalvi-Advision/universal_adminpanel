import type { OrderItem, OrderStatus, PaymentStatus } from 'src/services/orders';

// ----------------------------------------------------------------------

// Tab colours mirror the legacy admin panel's status pills.
export const STATUS_COLORS: Record<OrderStatus, string> = {
    pending: '#F0C040',
    accepted: '#2E7D32',
    accepted_by_store: '#1B6B6B',
    in_packaging: '#17696A',
    out_for_delivery: '#1565C0',
    delivered: '#78909C',
    payment_processing: '#00695C',
    cancelled: '#D32F2F',
};

export const getPaymentStatusColor = (
    status?: PaymentStatus
): 'default' | 'primary' | 'warning' | 'error' | 'success' => {
    const colors: Record<PaymentStatus, 'default' | 'primary' | 'warning' | 'error' | 'success'> = {
        pending: 'warning',
        processing: 'primary',
        completed: 'success',
        failed: 'error',
        cancelled: 'default',
    };
    return (status && colors[status]) || 'default';
};

export const formatDateTime = (value?: string) => {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatDate = (value?: string) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

export const formatCurrency = (amount = 0) =>
    `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Plain number for the pick list's price columns, which print without symbols.
export const formatAmount = (amount = 0) =>
    amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// "1 LT", "100 ML" — the pack the customer actually ordered.
export const formatPackSize = (item: OrderItem) => {
    const size = item.package_size;
    const unit = item.package_unit;
    if (!size && !unit) return '—';
    return [size, unit].filter(Boolean).join(' ');
};

/**
 * Per-line money for the pick list.
 *
 * MRP is only present on orders placed after the API started capturing it, so
 * `hasMrp` tells the table whether to show a real list price and discount or a
 * dash. Without an MRP there is nothing to discount against, and inventing one
 * from the current catalogue would misstate what the customer was charged.
 */
export const getLineAmounts = (item: OrderItem) => {
    const quantity = item.quantity ?? 0;
    const sellingPrice = item.unit_price ?? 0;
    const net = item.total_price ?? sellingPrice * quantity;
    const hasMrp = typeof item.mrp === 'number' && item.mrp > 0;
    const gross = hasMrp ? (item.mrp as number) * quantity : net;

    return {
        quantity,
        sellingPrice,
        hasMrp,
        mrp: hasMrp ? (item.mrp as number) : null,
        discount: Math.max(0, gross - net),
        net,
    };
};

export const getOrderTotals = (items: OrderItem[] = []) =>
    items.reduce(
        (acc, item) => {
            const line = getLineAmounts(item);
            return {
                quantity: acc.quantity + line.quantity,
                discount: acc.discount + line.discount,
                net: acc.net + line.net,
            };
        },
        { quantity: 0, discount: 0, net: 0 }
    );
