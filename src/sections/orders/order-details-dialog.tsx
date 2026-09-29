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

type Props = {
    open: boolean;
    order: Order | null;
    canEdit: boolean;
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

    // The same one-step-forward action the list's Actions column offers, so an
    // admin working inside the details view can walk the order through the
    // whole workflow without going back to the table.
    const nextStep = canEdit ? getNextOrderStatus(status) : null;
    const canCancel = canEdit && status !== 'cancelled' && status !== 'delivered';

    // Editing individual lines only makes sense while the order is still
    // being worked — once delivered or cancelled, what shipped is history.
    const canEditItems =
        canEdit && !!onUpdateItemQuantity && !!onRemoveItem && status !== 'delivered' && status !== 'cancelled';
    const activeItemCount = items.filter((item) => !item.removed).length;

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

                {itemError && (
                    <Alert severity="error" className="no-print" sx={{ mt: 2 }} onClose={() => setItemError('')}>
                        {itemError}
                    </Alert>
                )}

                <Box sx={{ mt: 3, overflowX: 'auto' }}>
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
                                    <TableCell colSpan={canEditItems ? 9 : 8} align="center" sx={cellSx}>
                                        No items on this order
                                    </TableCell>
                                </TableRow>
                            )}

                            <TableRow>
                                <TableCell sx={cellSx} />
                                <TableCell sx={headCellSx}>Total</TableCell>
                                <TableCell sx={cellSx} />
                                <TableCell sx={headCellSx}>{totals.quantity}</TableCell>
                                <TableCell sx={cellSx} />
                                <TableCell sx={headCellSx}>{formatAmount(totals.net)}</TableCell>
                                <TableCell sx={headCellSx}>{formatAmount(totals.discount)}</TableCell>
                                <TableCell sx={headCellSx}>{formatAmount(totals.net)}</TableCell>
                                {canEditItems && <TableCell sx={cellSx} className="no-print" />}
                            </TableRow>

                            <TableRow>
                                <TableCell sx={cellSx} />
                                <TableCell sx={headCellSx}>Delivery Charges +</TableCell>
                                {spacerCells}
                                <TableCell sx={headCellSx}>{formatAmount(deliveryCharges)}</TableCell>
                                {canEditItems && <TableCell sx={cellSx} className="no-print" />}
                            </TableRow>

                            <TableRow>
                                <TableCell sx={cellSx} />
                                <TableCell sx={headCellSx}>Final Receivable Amount</TableCell>
                                {spacerCells}
                                <TableCell sx={headCellSx}>
                                    {formatAmount(order.order_summary?.total_amount ?? 0)}
                                </TableCell>
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
