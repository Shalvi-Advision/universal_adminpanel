import type { Order, OrderStatus } from 'src/services/orders';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import GlobalStyles from '@mui/material/GlobalStyles';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { orderStatusLabel, getNextOrderStatus, normalizeOrderStatus } from 'src/services/orders';

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
};

export function OrderDetailsDialog({
    open,
    order,
    canEdit,
    busy = false,
    onClose,
    onOpenHistory,
    onChangeStatus,
}: Props) {
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

    const storeName = order.store_name || order.store_code;

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
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {items.map((item, index) => {
                                const line = getLineAmounts(item);
                                return (
                                    <TableRow key={`${item.p_code}-${index}`} hover>
                                        <TableCell sx={cellSx}>{index + 1}</TableCell>
                                        <TableCell sx={cellSx}>
                                            {item.product_name} ({item.p_code})
                                        </TableCell>
                                        <TableCell sx={cellSx}>{formatPackSize(item)}</TableCell>
                                        <TableCell sx={cellSx}>{line.quantity}</TableCell>
                                        <TableCell sx={cellSx}>
                                            {line.hasMrp ? formatAmount(line.mrp as number) : '—'}
                                        </TableCell>
                                        <TableCell sx={cellSx}>
                                            {formatAmount(line.sellingPrice)}
                                        </TableCell>
                                        <TableCell sx={cellSx}>{formatAmount(line.discount)}</TableCell>
                                        <TableCell sx={cellSx}>{formatAmount(line.net)}</TableCell>
                                    </TableRow>
                                );
                            })}

                            {items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={cellSx}>
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
                            </TableRow>

                            <TableRow>
                                <TableCell sx={cellSx} />
                                <TableCell sx={headCellSx}>Delivery Charges +</TableCell>
                                {spacerCells}
                                <TableCell sx={headCellSx}>{formatAmount(deliveryCharges)}</TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell sx={cellSx} />
                                <TableCell sx={headCellSx}>Final Receivable Amount</TableCell>
                                {spacerCells}
                                <TableCell sx={headCellSx}>
                                    {formatAmount(order.order_summary?.total_amount ?? 0)}
                                </TableCell>
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
        </Dialog>
    );
}
