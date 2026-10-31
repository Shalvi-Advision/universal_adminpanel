import type { Order, OrderItem, OrderStatus } from 'src/services/orders';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import GlobalStyles from '@mui/material/GlobalStyles';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';

import { orderStatusLabel, getNextOrderStatus, normalizeOrderStatus } from 'src/services/orders';

import { Iconify } from 'src/components/iconify';

import {
    formatDate,
    formatAmount,
    STATUS_COLORS,
    formatPackSize,
    formatDateTime,
    getOrderTotals,
    getLineAmounts,
    getPaymentStatusColor,
    getFulfillmentTypeLabel,
    getFulfillmentTypeColor,
} from './order-format';

// ----------------------------------------------------------------------

// Printing relies on visibility rather than display so the dialog keeps its
// layout: everything is hidden, then the pick list alone is switched back on
// and pulled to the top of the printed page.
const printStyles = (
    <GlobalStyles
        styles={{
            '@media print': {
                'body *': { visibility: 'hidden' },
                '.order-print-area, .order-print-area *': { visibility: 'visible' },
                '.order-print-area': {
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    padding: 0,
                    boxShadow: 'none',
                },
                '.no-print': { display: 'none !important' },
                // On screen the table scrolls sideways at a 900px minimum, and
                // the dialog body scrolls too. A printed page is narrower, so
                // both would clip the right-hand columns (amounts, delivery
                // charges, final amount): let everything shrink to the page.
                '.order-print-area, .order-print-table': {
                    overflow: 'visible !important',
                    maxHeight: 'none !important',
                },
                '.order-print-table .MuiTable-root': { minWidth: '0 !important', width: '100%' },
                '.order-print-table .MuiTableCell-root': { padding: '4px 6px', fontSize: 11 },
            },
        }}
    />
);

const labelledValue = (label: string, value: React.ReactNode) => (
    <Stack direction="row" spacing={1} alignItems="baseline">
        <Typography variant="body2" fontWeight={700} sx={{ whiteSpace: 'nowrap' }}>
            {label} :
        </Typography>
        <Typography variant="body2" component="div">
            {value}
        </Typography>
    </Stack>
);

// Picker's proof_of_delivery stores lat/long as strings (GPS reads come
// straight off the rider's device) — validate before doing any map math.
const parseCoord = (value?: string): number | null => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

// No Google Maps API key needed for a static embed — OpenStreetMap's own
// embed endpoint takes a bounding box + marker and needs no key or billing.
const buildOsmEmbedUrl = (lat: number, lon: number) => {
    const delta = 0.002; // ~200m box around the point
    const bbox = [lon - delta, lat - delta, lon + delta, lat + delta].join(',');
    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lon}`;
};

// The pick list is a printed grid, so every cell is boxed — including the
// empty ones in the totals rows, which keep the column edges unbroken all the
// way down.
const cellSx = { py: 1, border: '1px solid', borderColor: 'divider' };
const headCellSx = { ...cellSx, fontWeight: 700, whiteSpace: 'nowrap' };

// The five middle columns a totals row leaves blank, as individual boxed cells
// rather than one colSpan, so the vertical rules line up with the rows above.
const spacerCells = ['size', 'qty', 'mrp', 'selling', 'discount'].map((column) => (
    <TableCell key={column} sx={cellSx} />
));

// A totals row: label (with an optional second line saying which offer /
// voucher it was) and the amount in the last column.
function SummaryRow({
    label,
    detail,
    amount,
    color,
    trailingCells,
}: {
    label: string;
    detail?: string | false;
    amount: string;
    color?: string;
    trailingCells: React.ReactNode;
}) {
    return (
        <TableRow>
            <TableCell sx={cellSx} />
            <TableCell sx={headCellSx}>
                {label}
                {detail && (
                    <Typography
                        variant="caption"
                        component="div"
                        sx={{ color: 'text.secondary', fontWeight: 400, whiteSpace: 'normal' }}
                    >
                        {detail}
                    </Typography>
                )}
            </TableCell>
            {spacerCells}
            <TableCell sx={{ ...headCellSx, ...(color && { color }) }}>{amount}</TableCell>
            {trailingCells}
        </TableRow>
    );
}

// What reduced (or added to) the bill below the item total, in the order the
// server applies them: offer, loyalty voucher, then delivery and packing.
const getSummaryAdjustments = (order: Order) => {
    const summary = order.order_summary ?? ({} as Order['order_summary']);
    const offer = summary.applied_offer;
    const loyalty = summary.applied_loyalty_redemption;
    const offerDiscount = offer?.discount_amount ?? 0;
    const loyaltyDiscount = loyalty?.discount_amount ?? 0;
    // Orders placed before the breakdown was stored only carry the total.
    const otherDiscount = Math.max(
        0,
        Math.round(((summary.discount_amount ?? 0) - offerDiscount - loyaltyDiscount) * 100) / 100
    );
    return {
        offer: offerDiscount > 0 ? offer : undefined,
        offerDiscount,
        loyalty: loyaltyDiscount > 0 ? loyalty : undefined,
        loyaltyDiscount,
        otherDiscount,
        freeDelivery: (summary.free_delivery_offer?.waived_amount ?? 0) > 0 ? summary.free_delivery_offer : undefined,
        packingFee: summary.packing_fee ?? 0,
        dealSavings: summary.deal_savings ?? 0,
    };
};

type Props = {
    open: boolean;
    order: Order | null;
    canEdit: boolean;
    // Whether this tenant's fulfillment is ERP/SAP-integrated — threaded
    // through to getNextOrderStatus below. Doesn't change what shows here
    // today (only the Accept step appears in this dialog, and that step is
    // identical either way), but keeps this call site correct if the dialog
    // ever grows more steps.
    isErpIntegrated: boolean;
    busy?: boolean;
    onClose: () => void;
    onOpenHistory: () => void;
    onChangeStatus: (order: Order, status: OrderStatus) => void;
    onUpdateItemQuantity?: (order: Order, pCode: string, quantity: number) => Promise<void>;
    onRemoveItem?: (order: Order, pCode: string) => Promise<void>;
};

export function OrderDetailsDialog({
    open,
    order,
    canEdit,
    isErpIntegrated,
    busy = false,
    onClose,
    onOpenHistory,
    onChangeStatus,
    onUpdateItemQuantity,
    onRemoveItem,
}: Props) {
    // Inline quantity edit — which p_code (if any) is mid-edit, and the
    // textfield's own draft value while editing it.
    const [editingPcode, setEditingPcode] = useState<string | null>(null);
    const [editQuantity, setEditQuantity] = useState('');
    const [itemBusyPcode, setItemBusyPcode] = useState<string | null>(null);
    const [removeTarget, setRemoveTarget] = useState<OrderItem | null>(null);
    const [itemError, setItemError] = useState('');

    if (!order) return null;

    const status = normalizeOrderStatus(order.order_status);
    const address = order.delivery_info?.delivery_address;
    const items = order.order_items ?? [];
    const totals = getOrderTotals(items);
    const deliveryCharges = order.order_summary?.delivery_charges ?? 0;
    const adjustments = getSummaryAdjustments(order);

    // Only the very first step (Accept) shows here — once an order is
    // accepted, the rest of the workflow (Accepted By Store, In Packaging,
    // Out for Delivery, Delivered) is walked from the list's own Actions
    // column, not from inside this dialog. Showing every subsequent stage's
    // button here too just meant clicking one instantly relabelled itself
    // to the next stage, with no way to tell the two apart.
    const nextStep = canEdit && status === 'pending' ? getNextOrderStatus(status, isErpIntegrated) : null;
    const canCancel = canEdit && status !== 'cancelled' && status !== 'delivered';

    // Editing individual lines only makes sense while the order is still
    // being worked — once delivered or cancelled, what shipped is history.
    const canEditItems =
        canEdit && !!onUpdateItemQuantity && !!onRemoveItem && status !== 'delivered' && status !== 'cancelled';
    const activeItemCount = items.filter((item) => !item.removed).length;

    // Only present once Picker's 'picking_completed' event has landed for
    // this order — absent entirely for non-picker tenants and for orders
    // still being picked, so the column doesn't appear with nothing in it.
    const hasPickerStatus = items.some((item) => !!item.picker_status);
    const itemColumnCount = 8 + (hasPickerStatus ? 1 : 0) + (canEditItems ? 1 : 0);
    const trailingCells = (
        <>
            {hasPickerStatus && <TableCell sx={cellSx} />}
            {canEditItems && <TableCell sx={cellSx} className="no-print" />}
        </>
    );

    const PICKER_STATUS_COLOR: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
        picked: 'success',
        pending: 'default',
        not_available: 'warning',
        expired: 'error',
        damaged: 'error',
    };

    const storeName = order.store_name || order.store_code;

    const startEdit = (item: OrderItem) => {
        setItemError('');
        setEditingPcode(item.p_code);
        setEditQuantity(String(item.quantity));
    };

    const cancelEdit = () => {
        setEditingPcode(null);
        setEditQuantity('');
    };

    const saveEdit = async (item: OrderItem) => {
        if (!onUpdateItemQuantity) return;
        const quantity = parseInt(editQuantity, 10);
        if (!Number.isInteger(quantity) || quantity < 1) {
            setItemError('Enter a whole number of at least 1');
            return;
        }
        if (quantity === item.quantity) {
            cancelEdit();
            return;
        }
        try {
            setItemError('');
            setItemBusyPcode(item.p_code);
            await onUpdateItemQuantity(order, item.p_code, quantity);
            cancelEdit();
        } catch (err: any) {
            setItemError(err.message || 'Failed to update quantity');
        } finally {
            setItemBusyPcode(null);
        }
    };

    const confirmRemove = async () => {
        if (!removeTarget || !onRemoveItem) return;
        try {
            setItemError('');
            setItemBusyPcode(removeTarget.p_code);
            await onRemoveItem(order, removeTarget.p_code);
            setRemoveTarget(null);
        } catch (err: any) {
            setItemError(err.message || 'Failed to remove item');
        } finally {
            setItemBusyPcode(null);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
            {printStyles}

            <DialogContent dividers className="order-print-area">
                <Typography variant="h5" align="center" gutterBottom>
                    Order Details
                </Typography>

                <Typography variant="subtitle1" fontWeight={700}>
                    Pick List {storeName}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Box
                    sx={{
                        display: 'grid',
                        gap: 3,
                        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    }}
                >
                    <Stack spacing={0.75}>
                        <Typography variant="subtitle2" fontWeight={700}>
                            {storeName}
                        </Typography>
                        <Typography variant="body2">
                            {storeName} <strong>({order.store_code})</strong>
                        </Typography>

                        {labelledValue('Order No', order.order_number)}
                        {labelledValue('Order Date', formatDateTime(order.order_placed_at))}

                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" fontWeight={700}>
                                Payment Status :
                            </Typography>
                            <Chip
                                size="small"
                                label={order.payment_info?.payment_status || 'N/A'}
                                color={getPaymentStatusColor(order.payment_info?.payment_status)}
                                sx={{ textTransform: 'capitalize' }}
                            />
                        </Stack>

                        {labelledValue('Payment Mode', order.payment_info?.payment_mode_name || '—')}

                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" fontWeight={700}>
                                Fulfillment :
                            </Typography>
                            <Chip
                                size="small"
                                label={getFulfillmentTypeLabel(order.fulfillment_type)}
                                color={getFulfillmentTypeColor(order.fulfillment_type)}
                            />
                        </Stack>

                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" fontWeight={700}>
                                Order Status :
                            </Typography>
                            <Chip
                                size="small"
                                label={orderStatusLabel(order.order_status)}
                                sx={{ color: '#fff', fontWeight: 600, bgcolor: STATUS_COLORS[status] }}
                            />
                        </Stack>

                        <Box>
                            <Button
                                className="no-print"
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => window.print()}
                                sx={{ mt: 1 }}
                            >
                                Print
                            </Button>
                        </Box>
                    </Stack>

                    <Stack spacing={0.75}>
                        {labelledValue(
                            'Delivery Date',
                            formatDate(order.delivery_info?.delivery_date)
                        )}
                        {labelledValue(
                            'Delivery Slot',
                            order.delivery_info?.delivery_slot_from
                                ? `${order.delivery_info.delivery_slot_from} to ${order.delivery_info.delivery_slot_to}`
                                : '—'
                        )}
                        {labelledValue('Special Note', order.order_notes || '')}

                        <Box sx={{ pt: 1 }}>
                            <Typography variant="body2" fontWeight={700} gutterBottom>
                                Delivered To:
                            </Typography>
                            <Typography variant="body2">
                                {address?.full_name || order.customer_info?.name || '—'}
                            </Typography>
                            {(address?.line_1 || address?.line_2 || address?.city) && (
                                <Typography variant="body2">
                                    {[address?.line_1, address?.line_2, address?.city]
                                        .filter(Boolean)
                                        .join(' ')}
                                </Typography>
                            )}
                            {address?.pincode && (
                                <Typography variant="body2">{address.pincode}</Typography>
                            )}
                            <Typography variant="body2">
                                {address?.mobile_number || order.mobile_no}
                            </Typography>
                        </Box>
                    </Stack>
                </Box>

                {order.delivery_tracking && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Box
                            className="no-print"
                            sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                        >
                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                Delivery Tracking
                            </Typography>
                            <Box
                                sx={{
                                    display: 'grid',
                                    gap: 1,
                                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                                }}
                            >
                                <Stack spacing={0.75}>
                                    <Typography variant="body2" fontWeight={700}>
                                        Picker
                                    </Typography>
                                    {labelledValue(
                                        'Picked By',
                                        order.delivery_tracking.picker?.name
                                            ? `${order.delivery_tracking.picker.name}${
                                                  order.delivery_tracking.picker.phone
                                                      ? ` · ${order.delivery_tracking.picker.phone}`
                                                      : ''
                                              }`
                                            : '—'
                                    )}
                                    {labelledValue(
                                        'Assigned',
                                        formatDateTime(order.delivery_tracking.picking_assigned_at)
                                    )}
                                    {labelledValue(
                                        'Completed',
                                        formatDateTime(order.delivery_tracking.picking_completed_at)
                                    )}
                                </Stack>

                                <Stack spacing={0.75}>
                                    <Typography variant="body2" fontWeight={700}>
                                        Rider
                                    </Typography>
                                    {labelledValue(
                                        'Rider',
                                        order.delivery_tracking.rider?.name
                                            ? `${order.delivery_tracking.rider.name}${
                                                  order.delivery_tracking.rider.phone
                                                      ? ` · ${order.delivery_tracking.rider.phone}`
                                                      : ''
                                              }`
                                            : '—'
                                    )}
                                    {labelledValue('Assigned', formatDateTime(order.delivery_tracking.assigned_at))}
                                    {labelledValue('Started', formatDateTime(order.delivery_tracking.started_at))}
                                    {labelledValue('Delivered', formatDateTime(order.delivery_tracking.delivered_at))}
                                    {order.delivery_tracking.failed_reason &&
                                        labelledValue('Failed Reason', order.delivery_tracking.failed_reason)}
                                </Stack>
                            </Box>

                            <Divider sx={{ my: 1.5 }} />

                            <Box
                                sx={{
                                    display: 'grid',
                                    gap: 1,
                                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                                }}
                            >
                                <Stack spacing={0.75}>
                                    <Typography variant="body2" fontWeight={700}>
                                        Proof of Delivery
                                    </Typography>
                                    {order.delivery_tracking.proof_of_delivery ? (
                                        <>
                                            {order.delivery_tracking.proof_of_delivery.recipient_name &&
                                                labelledValue(
                                                    'Received By',
                                                    order.delivery_tracking.proof_of_delivery.recipient_name
                                                )}
                                            {order.delivery_tracking.proof_of_delivery.notes &&
                                                labelledValue(
                                                    'Notes',
                                                    order.delivery_tracking.proof_of_delivery.notes
                                                )}
                                            {!!order.delivery_tracking.proof_of_delivery.photo_urls?.length && (
                                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                                    {order.delivery_tracking.proof_of_delivery.photo_urls.map(
                                                        (url, index) => (
                                                            <Button
                                                                key={url}
                                                                size="small"
                                                                variant="outlined"
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener"
                                                            >
                                                                Photo {index + 1}
                                                            </Button>
                                                        )
                                                    )}
                                                </Stack>
                                            )}
                                        </>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            Not yet available
                                        </Typography>
                                    )}
                                </Stack>

                                {(() => {
                                    const pod = order.delivery_tracking?.proof_of_delivery;
                                    const lat = parseCoord(pod?.latitude);
                                    const lon = parseCoord(pod?.longitude);
                                    if (lat === null || lon === null) return null;

                                    return (
                                        <Stack spacing={0.75}>
                                            <Typography variant="body2" fontWeight={700}>
                                                Delivery Location
                                            </Typography>
                                            <Box
                                                sx={{
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    borderRadius: 1,
                                                    overflow: 'hidden',
                                                    height: 180,
                                                }}
                                            >
                                                <iframe
                                                    title="Delivery location map"
                                                    width="100%"
                                                    height="100%"
                                                    style={{ border: 0 }}
                                                    loading="lazy"
                                                    src={buildOsmEmbedUrl(lat, lon)}
                                                />
                                            </Box>
                                            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                                                <Button
                                                    size="small"
                                                    variant="text"
                                                    href={`https://www.google.com/maps?q=${lat},${lon}`}
                                                    target="_blank"
                                                    rel="noopener"
                                                >
                                                    Open in Google Maps
                                                </Button>
                                                {pod?.distance_to_customer_m != null && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {Math.round(pod.distance_to_customer_m)}m from saved address
                                                    </Typography>
                                                )}
                                                {pod?.out_of_geofence && (
                                                    <Chip size="small" color="warning" label="Outside geofence" />
                                                )}
                                            </Stack>
                                        </Stack>
                                    );
                                })()}
                            </Box>
                        </Box>
                    </>
                )}

                {itemError && (
                    <Alert severity="error" className="no-print" sx={{ mt: 2 }} onClose={() => setItemError('')}>
                        {itemError}
                    </Alert>
                )}

                <Box className="order-print-table" sx={{ mt: 3, overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 900 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={headCellSx}>Sr.no</TableCell>
                                <TableCell sx={headCellSx}>Description</TableCell>
                                <TableCell sx={headCellSx}>Size / Unit</TableCell>
                                <TableCell sx={headCellSx}>Qty</TableCell>
                                <TableCell sx={headCellSx}>MRP</TableCell>
                                <TableCell sx={headCellSx}>Selling Price</TableCell>
                                <TableCell sx={headCellSx}>Discount</TableCell>
                                <TableCell sx={headCellSx}>Discounted Rate</TableCell>
                                {hasPickerStatus && <TableCell sx={headCellSx}>Picker Status</TableCell>}
                                {canEditItems && (
                                    <TableCell sx={{ ...headCellSx }} className="no-print">
                                        Actions
                                    </TableCell>
                                )}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {items.map((item, index) => {
                                const line = getLineAmounts(item);
                                const isEditingThis = editingPcode === item.p_code;
                                const isBusyThis = itemBusyPcode === item.p_code;
                                const wasEdited = item.original_quantity !== undefined;
                                const strike = item.removed
                                    ? { textDecoration: 'line-through', color: 'text.disabled' }
                                    : undefined;

                                return (
                                    <TableRow key={`${item.p_code}-${index}`} hover>
                                        <TableCell sx={{ ...cellSx, ...strike }}>{index + 1}</TableCell>
                                        <TableCell sx={{ ...cellSx, ...strike }}>
                                            {item.product_name} ({item.p_code})
                                            {item.removed && (
                                                <Chip
                                                    label="Removed"
                                                    size="small"
                                                    color="error"
                                                    variant="outlined"
                                                    sx={{ ml: 1, textDecoration: 'none' }}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ ...cellSx, ...strike }}>
                                            {formatPackSize(item)}
                                        </TableCell>
                                        <TableCell sx={cellSx}>
                                            {isEditingThis ? (
                                                <TextField
                                                    className="no-print"
                                                    size="small"
                                                    type="number"
                                                    value={editQuantity}
                                                    onChange={(e) => setEditQuantity(e.target.value)}
                                                    slotProps={{ htmlInput: { min: 1, style: { width: 56 } } }}
                                                    autoFocus
                                                />
                                            ) : item.removed ? (
                                                <Box component="span" sx={strike}>
                                                    {item.original_quantity ?? line.quantity}
                                                </Box>
                                            ) : wasEdited ? (
                                                <Stack direction="row" spacing={0.5} alignItems="baseline">
                                                    <Box
                                                        component="span"
                                                        sx={{ textDecoration: 'line-through', color: 'text.disabled' }}
                                                    >
                                                        {item.original_quantity}
                                                    </Box>
                                                    <Typography component="span" variant="body2">
                                                        → {line.quantity}
                                                    </Typography>
                                                </Stack>
                                            ) : (
                                                line.quantity
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ ...cellSx, ...strike }}>
                                            {line.hasMrp ? formatAmount(line.mrp as number) : '—'}
                                        </TableCell>
                                        <TableCell sx={{ ...cellSx, ...strike }}>
                                            {formatAmount(line.sellingPrice)}
                                        </TableCell>
                                        <TableCell sx={{ ...cellSx, ...strike }}>
                                            {formatAmount(line.discount)}
                                        </TableCell>
                                        <TableCell sx={{ ...cellSx, ...strike }}>
                                            {formatAmount(line.net)}
                                        </TableCell>
                                        {hasPickerStatus && (
                                            <TableCell sx={cellSx}>
                                                {item.picker_status ? (
                                                    <Stack spacing={0.25}>
                                                        <Chip
                                                            size="small"
                                                            label={item.picker_status.replace('_', ' ')}
                                                            color={PICKER_STATUS_COLOR[item.picker_status] ?? 'default'}
                                                            sx={{ textTransform: 'capitalize', width: 'fit-content' }}
                                                        />
                                                        {item.picked_quantity !== undefined && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                Picked: {item.picked_quantity}
                                                            </Typography>
                                                        )}
                                                        {item.picker_remark && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {item.picker_remark}
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                ) : (
                                                    '—'
                                                )}
                                            </TableCell>
                                        )}
                                        {canEditItems && (
                                            <TableCell sx={cellSx} className="no-print">
                                                {item.removed ? null : isEditingThis ? (
                                                    <Stack direction="row" spacing={0.5}>
                                                        <IconButton
                                                            size="small"
                                                            color="success"
                                                            disabled={isBusyThis}
                                                            onClick={() => saveEdit(item)}
                                                        >
                                                            {isBusyThis ? (
                                                                <CircularProgress size={16} />
                                                            ) : (
                                                                <Iconify icon="eva:checkmark-fill" width={18} />
                                                            )}
                                                        </IconButton>
                                                        <IconButton size="small" disabled={isBusyThis} onClick={cancelEdit}>
                                                            <Iconify icon="mingcute:close-line" width={18} />
                                                        </IconButton>
                                                    </Stack>
                                                ) : (
                                                    <Stack direction="row" spacing={0.5}>
                                                        <IconButton
                                                            size="small"
                                                            disabled={busy || isBusyThis}
                                                            onClick={() => startEdit(item)}
                                                        >
                                                            <Iconify icon="solar:pen-bold" width={18} />
                                                        </IconButton>
                                                        <Tooltip
                                                            title={
                                                                activeItemCount <= 1
                                                                    ? "Can't remove the last item — cancel the order instead"
                                                                    : 'Remove from order'
                                                            }
                                                        >
                                                            <span>
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    disabled={busy || isBusyThis || activeItemCount <= 1}
                                                                    onClick={() => setRemoveTarget(item)}
                                                                >
                                                                    <Iconify
                                                                        icon="solar:trash-bin-trash-bold"
                                                                        width={18}
                                                                    />
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    </Stack>
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}

                            {items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={itemColumnCount} align="center" sx={cellSx}>
                                        No items on this order
                                    </TableCell>
                                </TableRow>
                            )}

                            <TableRow>
                                <TableCell sx={cellSx} />
                                <TableCell sx={headCellSx}>Total</TableCell>
                                <TableCell sx={cellSx} />
                                <TableCell sx={headCellSx}>{totals.quantity}</TableCell>
                                <TableCell sx={headCellSx}>{formatAmount(totals.mrp)}</TableCell>
                                <TableCell sx={headCellSx}>{formatAmount(totals.net)}</TableCell>
                                <TableCell sx={headCellSx}>{formatAmount(totals.discount)}</TableCell>
                                <TableCell sx={headCellSx}>{formatAmount(totals.net)}</TableCell>
                                {hasPickerStatus && <TableCell sx={cellSx} />}
                                {canEditItems && <TableCell sx={cellSx} className="no-print" />}
                            </TableRow>

                            {adjustments.dealSavings > 0 && (
                                <SummaryRow
                                    label="Deal Savings"
                                    detail="Already included in the item prices above"
                                    amount={formatAmount(adjustments.dealSavings)}
                                    trailingCells={trailingCells}
                                />
                            )}

                            {adjustments.offer && (
                                <SummaryRow
                                    label="Offer Discount −"
                                    detail={[
                                        adjustments.offer.title,
                                        adjustments.offer.coupon_code && `Code: ${adjustments.offer.coupon_code}`,
                                    ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                    amount={`− ${formatAmount(adjustments.offerDiscount)}`}
                                    color="success.main"
                                    trailingCells={trailingCells}
                                />
                            )}

                            {adjustments.loyalty && (
                                <SummaryRow
                                    label="Loyalty Voucher −"
                                    detail={adjustments.loyalty.reward_name}
                                    amount={`− ${formatAmount(adjustments.loyaltyDiscount)}`}
                                    color="success.main"
                                    trailingCells={trailingCells}
                                />
                            )}

                            {adjustments.otherDiscount > 0 && (
                                <SummaryRow
                                    label="Discount −"
                                    amount={`− ${formatAmount(adjustments.otherDiscount)}`}
                                    color="success.main"
                                    trailingCells={trailingCells}
                                />
                            )}

                            <SummaryRow
                                label="Delivery Charges +"
                                detail={
                                    adjustments.freeDelivery &&
                                    `${formatAmount(adjustments.freeDelivery.waived_amount ?? 0)} waived · ${[
                                        adjustments.freeDelivery.title,
                                        adjustments.freeDelivery.coupon_code &&
                                            `Code: ${adjustments.freeDelivery.coupon_code}`,
                                    ]
                                        .filter(Boolean)
                                        .join(' · ')}`
                                }
                                amount={formatAmount(deliveryCharges)}
                                trailingCells={trailingCells}
                            />

                            {adjustments.packingFee > 0 && (
                                <SummaryRow
                                    label="Packing Fee +"
                                    amount={formatAmount(adjustments.packingFee)}
                                    trailingCells={trailingCells}
                                />
                            )}

                            <TableRow>
                                <TableCell sx={cellSx} />
                                <TableCell sx={headCellSx}>Final Receivable Amount</TableCell>
                                {spacerCells}
                                <TableCell sx={headCellSx}>
                                    {formatAmount(order.order_summary?.total_amount ?? 0)}
                                </TableCell>
                                {hasPickerStatus && <TableCell sx={cellSx} />}
                                {canEditItems && <TableCell sx={cellSx} className="no-print" />}
                            </TableRow>
                        </TableBody>
                    </Table>
                </Box>
            </DialogContent>

            <DialogActions className="no-print" sx={{ justifyContent: 'flex-start', gap: 1, px: 3 }}>
                <Button variant="contained" color="success" onClick={onClose}>
                    &lt;&lt; Back
                </Button>

                {nextStep && (
                    <Button
                        variant="contained"
                        color="success"
                        disabled={busy}
                        onClick={() => onChangeStatus(order, nextStep.status)}
                    >
                        {nextStep.label}
                    </Button>
                )}

                <Button variant="contained" color="error" onClick={onOpenHistory}>
                    Order History
                </Button>

                {canCancel && (
                    <Button
                        variant="contained"
                        color="error"
                        disabled={busy}
                        onClick={() => onChangeStatus(order, 'cancelled')}
                    >
                        Cancel
                    </Button>
                )}
            </DialogActions>

            <Dialog open={!!removeTarget} onClose={() => setRemoveTarget(null)}>
                <DialogTitle>Remove item from order?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {removeTarget?.product_name} will be removed from order #{order.order_number}
                        and the customer will be notified. This can&apos;t be undone from here.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRemoveTarget(null)} disabled={!!itemBusyPcode}>
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmRemove}
                        color="error"
                        variant="contained"
                        disabled={!!itemBusyPcode}
                        startIcon={itemBusyPcode ? <CircularProgress size={16} /> : undefined}
                    >
                        Remove
                    </Button>
                </DialogActions>
            </Dialog>
        </Dialog>
    );
}
