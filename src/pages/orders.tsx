import type { Order, OrderStatus, PaymentStatus, OrdersQueryParams } from 'src/services/orders';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
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
import { getOrders, updateOrderStatus, updatePaymentStatus } from 'src/services/orders';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const ORDER_STATUSES: OrderStatus[] = ['placed', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'];
const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'processing', 'completed', 'failed', 'cancelled'];

const getStatusColor = (status: OrderStatus): 'default' | 'primary' | 'secondary' | 'warning' | 'error' | 'success' | 'info' => {
    const colors: Record<OrderStatus, 'default' | 'primary' | 'secondary' | 'warning' | 'error' | 'success' | 'info'> = {
        placed: 'info',
        confirmed: 'primary',
        processing: 'warning',
        packed: 'secondary',
        shipped: 'info',
        delivered: 'success',
        cancelled: 'error',
        refunded: 'default',
    };
    return colors[status] || 'default';
};

const getPaymentStatusColor = (status: PaymentStatus): 'default' | 'primary' | 'warning' | 'error' | 'success' => {
    const colors: Record<PaymentStatus, 'default' | 'primary' | 'warning' | 'error' | 'success'> = {
        pending: 'warning',
        processing: 'primary',
        completed: 'success',
        failed: 'error',
        cancelled: 'default',
    };
    return colors[status] || 'default';
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [totalCount, setTotalCount] = useState(0);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | ''>('');

    // Dialogs
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [newStatus, setNewStatus] = useState<OrderStatus>('placed');
    const [newPaymentStatus, setNewPaymentStatus] = useState<PaymentStatus>('pending');

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const params: OrdersQueryParams = {
                page: page + 1,
                limit: rowsPerPage,
                search: search || undefined,
                status: statusFilter || undefined,
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

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

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

    const handleStatusFilterChange = (event: any) => {
        setStatusFilter(event.target.value);
        setPage(0);
    };

    const handlePaymentStatusFilterChange = (event: any) => {
        setPaymentStatusFilter(event.target.value);
        setPage(0);
    };

    const openStatusDialog = (order: Order) => {
        setSelectedOrder(order);
        setNewStatus(order.order_status);
        setStatusDialogOpen(true);
    };

    const openPaymentDialog = (order: Order) => {
        setSelectedOrder(order);
        setNewPaymentStatus(order.payment_info.payment_status as PaymentStatus);
        setPaymentDialogOpen(true);
    };

    const openDetailDialog = (order: Order) => {
        setSelectedOrder(order);
        setDetailDialogOpen(true);
    };

    const handleUpdateStatus = async () => {
        if (!selectedOrder) return;

        try {
            await updateOrderStatus(selectedOrder._id, newStatus);
            setSuccessMessage(`Order status updated to ${newStatus}`);
            setStatusDialogOpen(false);
            fetchOrders();
        } catch (err: any) {
            setError(err.message || 'Failed to update order status');
        }
    };

    const handleUpdatePaymentStatus = async () => {
        if (!selectedOrder) return;

        try {
            await updatePaymentStatus(selectedOrder._id, newPaymentStatus);
            setSuccessMessage(`Payment status updated to ${newPaymentStatus}`);
            setPaymentDialogOpen(false);
            fetchOrders();
        } catch (err: any) {
            setError(err.message || 'Failed to update payment status');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

    return (
        <>
            <title>{`Orders - ${CONFIG.appName}`}</title>

            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Stack spacing={3}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="h4">Orders</Typography>
                    </Stack>

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

                    {/* Filters */}
                    <Card sx={{ p: 2 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                size="small"
                                placeholder="Search by order #, phone, name..."
                                value={search}
                                onChange={handleSearch}
                                sx={{ minWidth: 280 }}
                            />

                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Order Status</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Order Status"
                                    onChange={handleStatusFilterChange}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {ORDER_STATUSES.map((status) => (
                                        <MenuItem key={status} value={status}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Payment Status</InputLabel>
                                <Select
                                    value={paymentStatusFilter}
                                    label="Payment Status"
                                    onChange={handlePaymentStatusFilterChange}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {PAYMENT_STATUSES.map((status) => (
                                        <MenuItem key={status} value={status}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setSearch('');
                                    setStatusFilter('');
                                    setPaymentStatusFilter('');
                                    setPage(0);
                                }}
                            >
                                Clear Filters
                            </Button>
                        </Stack>
                    </Card>

                    {/* Orders Table */}
                    <Card>
                        <Scrollbar>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Order #</TableCell>
                                            <TableCell>Customer</TableCell>
                                            <TableCell>Items</TableCell>
                                            <TableCell>Amount</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Payment</TableCell>
                                            <TableCell>Date</TableCell>
                                            <TableCell align="right">Actions</TableCell>
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
                                                        No orders found
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            orders.map((order) => (
                                                <TableRow key={order._id} hover>
                                                    <TableCell>
                                                        <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
                                                            {order.order_number}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={500}>
                                                                {order.customer_info?.name || 'N/A'}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {order.mobile_no}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        {order.order_summary?.total_items || 0} items
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="subtitle2" color="primary">
                                                            {formatCurrency(order.order_summary?.total_amount || 0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={order.order_status}
                                                            color={getStatusColor(order.order_status)}
                                                            size="small"
                                                            onClick={() => openStatusDialog(order)}
                                                            sx={{ cursor: 'pointer', textTransform: 'capitalize' }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={order.payment_info?.payment_status || 'N/A'}
                                                            color={getPaymentStatusColor(order.payment_info?.payment_status as PaymentStatus)}
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => openPaymentDialog(order)}
                                                            sx={{ cursor: 'pointer', textTransform: 'capitalize' }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="caption">
                                                            {formatDate(order.order_placed_at)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => openDetailDialog(order)}
                                                            title="View Details"
                                                        >
                                                            <Iconify icon="solar:eye-bold" width={20} />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))
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
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdateStatus}>
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
                                <MenuItem key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdatePaymentStatus}>
                        Update
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Order Details Dialog */}
            <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Order Details - {selectedOrder?.order_number}
                </DialogTitle>
                <DialogContent dividers>
                    {selectedOrder && (
                        <Stack spacing={3}>
                            {/* Customer Info */}
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Customer Information
                                </Typography>
                                <Typography>Name: {selectedOrder.customer_info?.name || 'N/A'}</Typography>
                                <Typography>Phone: {selectedOrder.mobile_no}</Typography>
                                {selectedOrder.customer_info?.email && (
                                    <Typography>Email: {selectedOrder.customer_info.email}</Typography>
                                )}
                            </Box>

                            {/* Delivery Address */}
                            {selectedOrder.delivery_address && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Delivery Address
                                    </Typography>
                                    <Typography>
                                        {selectedOrder.delivery_address.address_line1}
                                        {selectedOrder.delivery_address.address_line2 && `, ${selectedOrder.delivery_address.address_line2}`}
                                    </Typography>
                                    <Typography>
                                        {selectedOrder.delivery_address.city}, {selectedOrder.delivery_address.state} - {selectedOrder.delivery_address.pincode}
                                    </Typography>
                                </Box>
                            )}

                            {/* Order Items */}
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Order Items
                                </Typography>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Product</TableCell>
                                            <TableCell align="right">Qty</TableCell>
                                            <TableCell align="right">Price</TableCell>
                                            <TableCell align="right">Total</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedOrder.order_items?.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{item.product_name}</TableCell>
                                                <TableCell align="right">{item.quantity}</TableCell>
                                                <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                                                <TableCell align="right">{formatCurrency(item.total_price)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>

                            {/* Order Summary */}
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Order Summary
                                </Typography>
                                <Stack spacing={1}>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography>Subtotal:</Typography>
                                        <Typography>{formatCurrency(selectedOrder.order_summary?.subtotal || 0)}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography>Delivery:</Typography>
                                        <Typography>{formatCurrency(selectedOrder.order_summary?.delivery_charge || 0)}</Typography>
                                    </Stack>
                                    {selectedOrder.order_summary?.discount > 0 && (
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography>Discount:</Typography>
                                            <Typography color="success.main">-{formatCurrency(selectedOrder.order_summary.discount)}</Typography>
                                        </Stack>
                                    )}
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="subtitle1" fontWeight={600}>Total:</Typography>
                                        <Typography variant="subtitle1" fontWeight={600} color="primary">
                                            {formatCurrency(selectedOrder.order_summary?.total_amount || 0)}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Box>

                            {/* Payment Info */}
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Payment Information
                                </Typography>
                                <Typography>Mode: {selectedOrder.payment_info?.payment_mode_name || 'N/A'}</Typography>
                                <Typography>
                                    Status: <Chip
                                        label={selectedOrder.payment_info?.payment_status}
                                        color={getPaymentStatusColor(selectedOrder.payment_info?.payment_status as PaymentStatus)}
                                        size="small"
                                        sx={{ ml: 1, textTransform: 'capitalize' }}
                                    />
                                </Typography>
                                {selectedOrder.payment_info?.transaction_id && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Transaction ID: {selectedOrder.payment_info.transaction_id}
                                    </Typography>
                                )}
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog >
        </>
    );
}
