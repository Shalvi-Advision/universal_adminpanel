import type { Order, OrderStatus, PaymentStatus, OrdersQueryParams } from 'src/services/orders';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/config-global';
import { usePermissions } from 'src/contexts/permissions-context';
import {
    getOrders,
    ORDER_STATUSES,
    updateOrderStatus,
    updatePaymentStatus,
    ORDER_STATUS_LABELS,
    normalizeOrderStatus,
    getOrderStatusCounts,
} from 'src/services/orders';

import { Scrollbar } from 'src/components/scrollbar';

import { OrderDetailsDialog } from 'src/sections/orders/order-details-dialog';
import { OrderHistoryDialog } from 'src/sections/orders/order-history-dialog';
import {
    formatDate,
    STATUS_COLORS,
    formatDateTime,
    formatCurrency,
    getPaymentStatusColor,
} from 'src/sections/orders/order-format';

// ----------------------------------------------------------------------

const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'processing', 'completed', 'failed', 'cancelled'];

type StatusCounts = Record<OrderStatus, number>;

const EMPTY_COUNTS = ORDER_STATUSES.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
}, {} as StatusCounts);

export default function OrdersPage() {
    const { hasPermission } = usePermissions();
    const canEditOrders = hasPermission('orders', 'edit');

    const [orders, setOrders] = useState<Order[]>([]);
    const [counts, setCounts] = useState<StatusCounts>(EMPTY_COUNTS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [totalCount, setTotalCount] = useState(0);

    // Filters — the active tab IS the status filter, so every order shows up
    // under exactly one tab.
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus>('pending');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | ''>('');

    // Dialogs
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [newStatus, setNewStatus] = useState<OrderStatus>('pending');
    const [newPaymentStatus, setNewPaymentStatus] = useState<PaymentStatus>('pending');
    const [updating, setUpdating] = useState(false);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const params: OrdersQueryParams = {
                page: page + 1,
                limit: rowsPerPage,
                search: search || undefined,
                status: statusFilter,
                paymentStatus: paymentStatusFilter || undefined,
                sortBy: 'order_placed_at',
                sortOrder: 'desc',
            };

            const response = await getOrders(params);
            if (response.success) {
                setOrders(response.data);
                setTotalCount(response.pagination.total);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, search, statusFilter, paymentStatusFilter]);

    const fetchCounts = useCallback(async () => {
        try {
            const response = await getOrderStatusCounts({ search: search || undefined });
            if (response.success) {
                setCounts({ ...EMPTY_COUNTS, ...response.data.counts });
            }
        } catch {
            // A failed badge count must not blank out the table.
            setCounts(EMPTY_COUNTS);
        }
    }, [search]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        fetchCounts();
    }, [fetchCounts]);

    const refresh = useCallback(() => {
        fetchOrders();
        fetchCounts();
    }, [fetchOrders, fetchCounts]);

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(event.target.value);
        setPage(0);
    };

    const handleTabChange = (_event: React.SyntheticEvent, value: OrderStatus) => {
        setStatusFilter(value);
        setPage(0);
    };

    // Only wired to the Payment Status filter dropdown, which is commented
    // out below for now — kept, not deleted, so restoring it is one uncomment.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handlePaymentStatusFilterChange = (event: any) => {
        setPaymentStatusFilter(event.target.value);
        setPage(0);
    };

    const openStatusDialog = (order: Order) => {
        setSelectedOrder(order);
        setNewStatus(normalizeOrderStatus(order.order_status));
        setStatusDialogOpen(true);
    };

    const openPaymentDialog = (order: Order) => {
        setSelectedOrder(order);
        setNewPaymentStatus(order.payment_info?.payment_status ?? 'pending');
        setPaymentDialogOpen(true);
    };

    const openDetailDialog = (order: Order) => {
        setSelectedOrder(order);
        setDetailDialogOpen(true);
    };

    // Quick actions from the status column — Accept and Cancel Order, as in the
    // legacy panel. Both move the order into another tab, so the list and the
    // badges are refetched.
    const applyStatus = useCallback(
        async (order: Order, status: OrderStatus) => {
            try {
                setUpdating(true);
                setError('');
                await updateOrderStatus(order._id, status);
                setSuccessMessage(
                    `Order ${order.order_number} moved to ${ORDER_STATUS_LABELS[status]}`
                );
                refresh();
            } catch (err: any) {
                setError(err.message || 'Failed to update order status');
            } finally {
                setUpdating(false);
            }
        },
        [refresh]
    );

    // Accept / Cancel from inside the details view. The order object held in
    // state is the one the dialog renders, so it is updated in place rather
    // than waiting for the refetched list.
    const handleDetailStatusChange = useCallback(
        async (order: Order, status: OrderStatus) => {
            await applyStatus(order, status);
            setSelectedOrder((current) =>
                current && current._id === order._id
                    ? { ...current, order_status: status }
                    : current
            );
        },
        [applyStatus]
    );

    const handleUpdateStatus = async () => {
        if (!selectedOrder) return;
        await applyStatus(selectedOrder, newStatus);
        setStatusDialogOpen(false);
    };

    const handleUpdatePaymentStatus = async () => {
        if (!selectedOrder) return;

        try {
            setUpdating(true);
            await updatePaymentStatus(selectedOrder._id, newPaymentStatus);
            setSuccessMessage(`Payment status updated to ${newPaymentStatus}`);
            setPaymentDialogOpen(false);
            refresh();
        } catch (err: any) {
            setError(err.message || 'Failed to update payment status');
        } finally {
            setUpdating(false);
        }
    };

    const activeColor = useMemo(() => STATUS_COLORS[statusFilter], [statusFilter]);

    const renderStatusCell = (order: Order) => {
        const status = normalizeOrderStatus(order.order_status);
        const isOpen = status !== 'delivered' && status !== 'cancelled';

        return (
            <Stack spacing={1} alignItems="flex-start">
                <Chip
                    size="small"
                    label={ORDER_STATUS_LABELS[status]}
                    onClick={canEditOrders ? () => openStatusDialog(order) : undefined}
                    sx={{
                        cursor: canEditOrders ? 'pointer' : 'default',
                        fontWeight: 600,
                        color: '#fff',
                        bgcolor: STATUS_COLORS[status],
                    }}
                />

                {canEditOrders && isOpen && (
                    <Stack spacing={0.75} alignItems="flex-start">
                        {status === 'pending' || status === 'payment_processing' ? (
                            <Button
                                size="small"
                                variant="contained"
                                color="success"
                                disabled={updating}
                                onClick={() => applyStatus(order, 'accepted')}
                            >
                                Accept
                            </Button>
                        ) : null}

                        <Button
                            size="small"
                            variant="contained"
                            color="error"
                            disabled={updating}
                            onClick={() => applyStatus(order, 'cancelled')}
                        >
                            Cancel Order
                        </Button>
                    </Stack>
                )}
            </Stack>
        );
    };

    return (
        <>
            <title>{`Orders - ${CONFIG.appName}`}</title>

            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Stack spacing={3}>
                    <Typography variant="h4">Orders</Typography>

                    {error && (
                        <Alert severity="error" onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    {successMessage && (
                        <Alert severity="success" onClose={() => setSuccessMessage('')}>
                            {successMessage}
                        </Alert>
                    )}

                    {/* Status tabs — one per bucket, with live counts */}
                    <Card>
                        <Tabs
                            value={statusFilter}
                            onChange={handleTabChange}
                            variant="scrollable"
                            scrollButtons="auto"
                            allowScrollButtonsMobile
                            sx={{
                                px: 2,
                                minHeight: 64,
                                '& .MuiTabs-indicator': { backgroundColor: activeColor, height: 3 },
                            }}
                        >
                            {ORDER_STATUSES.map((status) => (
                                <Tab
                                    key={status}
                                    value={status}
                                    disableRipple
                                    sx={{
                                        minHeight: 64,
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        '&.Mui-selected': { color: STATUS_COLORS[status] },
                                    }}
                                    label={
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <span>{ORDER_STATUS_LABELS[status]}</span>
                                            <Box
                                                component="span"
                                                sx={{
                                                    px: 1,
                                                    minWidth: 24,
                                                    borderRadius: 1,
                                                    fontSize: 12,
                                                    lineHeight: '20px',
                                                    textAlign: 'center',
                                                    color: '#fff',
                                                    bgcolor: STATUS_COLORS[status],
                                                }}
                                            >
                                                {counts[status] ?? 0}
                                            </Box>
                                        </Stack>
                                    }
                                />
                            ))}
                        </Tabs>

                        <Divider />

                        {/* Secondary filters */}
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                            sx={{ p: 2 }}
                            alignItems={{ sm: 'center' }}
                        >
                            <TextField
                                size="small"
                                placeholder="Search by order #, phone, name..."
                                value={search}
                                onChange={handleSearch}
                                sx={{ minWidth: 280 }}
                            />

                            {/* Payment Status filter — commented out for now, not removed.
                                paymentStatusFilter/handlePaymentStatusFilterChange/PAYMENT_STATUSES
                                stay wired up below (Clear Filters still resets the state) so this
                                drops back in with a one-line uncomment. */}
                            {/* <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel>Payment Status</InputLabel>
                                <Select
                                    value={paymentStatusFilter}
                                    label="Payment Status"
                                    onChange={handlePaymentStatusFilterChange}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {PAYMENT_STATUSES.map((status) => (
                                        <MenuItem key={status} value={status} sx={{ textTransform: 'capitalize' }}>
                                            {status}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl> */}

                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setSearch('');
                                    setPaymentStatusFilter('');
                                    setPage(0);
                                }}
                            >
                                Clear Filters
                            </Button>

                            <Box sx={{ flexGrow: 1 }} />

                            <Typography variant="body2" color="text.secondary">
                                {totalCount} order{totalCount === 1 ? '' : 's'} in{' '}
                                {ORDER_STATUS_LABELS[statusFilter]}
                            </Typography>
                        </Stack>
                    </Card>

                    {/* Orders table */}
                    <Card>
                        <Scrollbar>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Sr No</TableCell>
                                            <TableCell>Order No</TableCell>
                                            <TableCell>Order Details</TableCell>
                                            <TableCell>Customer Details</TableCell>
                                            <TableCell>Order Amount</TableCell>
                                            <TableCell>Payment Status</TableCell>
                                            <TableCell>Payment Mode</TableCell>
                                            <TableCell>Order Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                                                    <CircularProgress />
                                                </TableCell>
                                            </TableRow>
                                        ) : orders.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        No {ORDER_STATUS_LABELS[statusFilter].toLowerCase()} orders
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            orders.map((order, index) => {
                                                const address = order.delivery_info?.delivery_address;

                                                return (
                                                    <TableRow key={order._id} hover sx={{ verticalAlign: 'top' }}>
                                                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>

                                                        <TableCell>
                                                            <Typography variant="subtitle2">
                                                                {order.order_number}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {order.store_code}
                                                            </Typography>
                                                        </TableCell>

                                                        <TableCell sx={{ minWidth: 260 }}>
                                                            <Stack spacing={0.5} alignItems="flex-start">
                                                                <Typography variant="body2">
                                                                    <strong>Order Date:</strong>{' '}
                                                                    {formatDateTime(order.order_placed_at)}
                                                                </Typography>
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <Typography variant="body2">
                                                                        <strong>Delivery Date:</strong>
                                                                    </Typography>
                                                                    <Chip
                                                                        size="small"
                                                                        color="info"
                                                                        label={formatDate(
                                                                            order.delivery_info?.delivery_date
                                                                        )}
                                                                    />
                                                                </Stack>
                                                                {order.delivery_info?.delivery_slot_from && (
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        Slot: {order.delivery_info.delivery_slot_from} -{' '}
                                                                        {order.delivery_info.delivery_slot_to}
                                                                    </Typography>
                                                                )}
                                                                <Button
                                                                    size="small"
                                                                    variant="contained"
                                                                    color="success"
                                                                    onClick={() => openDetailDialog(order)}
                                                                >
                                                                    Order Details &gt;&gt;
                                                                </Button>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Note: {order.order_notes || ''}
                                                                </Typography>
                                                            </Stack>
                                                        </TableCell>

                                                        <TableCell sx={{ minWidth: 220 }}>
                                                            <Typography variant="body2" fontWeight={500}>
                                                                {order.customer_info?.name ||
                                                                    address?.full_name ||
                                                                    'N/A'}
                                                            </Typography>
                                                            {address && (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {[address.line_1, address.line_2, address.city, address.pincode]
                                                                        .filter(Boolean)
                                                                        .join(' ')}
                                                                </Typography>
                                                            )}
                                                            <Typography variant="body2" color="text.secondary">
                                                                {order.mobile_no}
                                                            </Typography>
                                                        </TableCell>

                                                        <TableCell>
                                                            <Typography variant="subtitle2">
                                                                {formatCurrency(order.order_summary?.total_amount)}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {order.order_summary?.total_items ?? 0} items
                                                            </Typography>
                                                        </TableCell>

                                                        <TableCell>
                                                            <Chip
                                                                size="small"
                                                                variant="outlined"
                                                                label={order.payment_info?.payment_status || 'N/A'}
                                                                color={getPaymentStatusColor(
                                                                    order.payment_info?.payment_status
                                                                )}
                                                                onClick={
                                                                    canEditOrders
                                                                        ? () => openPaymentDialog(order)
                                                                        : undefined
                                                                }
                                                                sx={{
                                                                    textTransform: 'capitalize',
                                                                    cursor: canEditOrders ? 'pointer' : 'default',
                                                                }}
                                                            />
                                                        </TableCell>

                                                        <TableCell>
                                                            {order.payment_info?.payment_mode_name || '—'}
                                                        </TableCell>

                                                        <TableCell sx={{ minWidth: 170 }}>
                                                            {renderStatusCell(order)}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Scrollbar>

                        <TablePagination
                            component="div"
                            count={totalCount}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            rowsPerPageOptions={[10, 20, 50, 100]}
                        />
                    </Card>
                </Stack>
            </Container>

            {/* Update Status Dialog */}
            <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Update Order Status</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={newStatus}
                            label="Status"
                            onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                        >
                            {ORDER_STATUSES.map((status) => (
                                <MenuItem key={status} value={status}>
                                    {ORDER_STATUS_LABELS[status]}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdateStatus} disabled={updating}>
                        Update
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Update Payment Status Dialog */}
            <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Update Payment Status</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Payment Status</InputLabel>
                        <Select
                            value={newPaymentStatus}
                            label="Payment Status"
                            onChange={(e) => setNewPaymentStatus(e.target.value as PaymentStatus)}
                        >
                            {PAYMENT_STATUSES.map((status) => (
                                <MenuItem key={status} value={status} sx={{ textTransform: 'capitalize' }}>
                                    {status}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdatePaymentStatus} disabled={updating}>
                        Update
                    </Button>
                </DialogActions>
            </Dialog>

            <OrderDetailsDialog
                open={detailDialogOpen}
                order={selectedOrder}
                canEdit={canEditOrders}
                busy={updating}
                onClose={() => setDetailDialogOpen(false)}
                onOpenHistory={() => setHistoryDialogOpen(true)}
                onChangeStatus={handleDetailStatusChange}
            />

            <OrderHistoryDialog
                open={historyDialogOpen}
                orderId={selectedOrder?._id ?? null}
                orderNumber={selectedOrder?.order_number}
                onClose={() => setHistoryDialogOpen(false)}
            />
        </>
    );
}
