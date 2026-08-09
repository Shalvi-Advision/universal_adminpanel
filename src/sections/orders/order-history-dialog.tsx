import type { OrderHistory, OrderStatusHistoryEntry } from 'src/services/orders';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { getOrderHistory, orderStatusLabel, normalizeOrderStatus } from 'src/services/orders';

import { STATUS_COLORS, formatDateTime } from './order-format';

// ----------------------------------------------------------------------

// Elapsed time between two steps, so the timeline reads as a duration and not
// just a list of clock times. Only rendered between consecutive entries.
const formatElapsed = (from: string, to: string) => {
    const ms = new Date(to).getTime() - new Date(from).getTime();
    if (!Number.isFinite(ms) || ms < 0) return null;

    const minutes = Math.round(ms / 60000);
    if (minutes < 1) return 'less than a minute later';
    if (minutes < 60) return `${minutes} min later`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        const rest = minutes % 60;
        return rest ? `${hours} hr ${rest} min later` : `${hours} hr later`;
    }

    const days = Math.floor(hours / 24);
    const restHours = hours % 24;
    return restHours ? `${days} d ${restHours} hr later` : `${days} d later`;
};

const describeActor = (entry: OrderStatusHistoryEntry) => {
    if (entry.changed_by_name) {
        return entry.changed_by_role === 'customer'
            ? `by ${entry.changed_by_name} (customer)`
            : `by ${entry.changed_by_name}`;
    }
    if (entry.changed_by_role === 'customer') return 'by the customer';
    if (entry.changed_by_role === 'admin') return 'by an admin';
    return null;
};

type Props = {
    open: boolean;
    orderId: string | null;
    orderNumber?: string;
    onClose: () => void;
};

export function OrderHistoryDialog({ open, orderId, orderNumber, onClose }: Props) {
    const [history, setHistory] = useState<OrderHistory | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        if (!orderId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await getOrderHistory(orderId);
            setHistory(response.data);
        } catch (err: any) {
            setError(err?.message || 'Failed to load order history');
            setHistory(null);
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        if (open) {
            fetchHistory();
        } else {
            // Drop the previous order's timeline so reopening never flashes it.
            setHistory(null);
        }
    }, [open, fetchHistory]);

    const timeline = history?.timeline ?? [];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Order History {orderNumber ? `- ${orderNumber}` : ''}</DialogTitle>

            <DialogContent dividers>
                {loading && (
                    <Stack alignItems="center" sx={{ py: 4 }}>
                        <CircularProgress />
                    </Stack>
                )}

                {!loading && error && <Alert severity="error">{error}</Alert>}

                {!loading && !error && timeline.length === 0 && (
                    <Typography color="text.secondary">
                        No status changes recorded for this order.
                    </Typography>
                )}

                {!loading && !error && history?.derived && timeline.length > 0 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        This order was placed before status changes were tracked. The timeline below
                        is reconstructed from the order&apos;s own timestamps, so intermediate steps
                        may be missing.
                    </Alert>
                )}

                {!loading && !error && timeline.length > 0 && (
                    <Stack>
                        {timeline.map((entry, index) => {
                            const status = normalizeOrderStatus(entry.status);
                            const color = STATUS_COLORS[status] ?? '#9E9E9E';
                            const isLast = index === timeline.length - 1;
                            const previous = timeline[index - 1];
                            const elapsed = previous
                                ? formatElapsed(previous.changed_at, entry.changed_at)
                                : null;
                            const actor = describeActor(entry);

                            return (
                                <Stack
                                    key={`${entry.status}-${entry.changed_at}-${index}`}
                                    direction="row"
                                    spacing={2}
                                >
                                    {/* Dot and the connector down to the next step. */}
                                    <Stack alignItems="center" sx={{ pt: 0.5 }}>
                                        <Box
                                            sx={{
                                                width: 14,
                                                height: 14,
                                                borderRadius: '50%',
                                                bgcolor: color,
                                                flexShrink: 0,
                                            }}
                                        />
                                        {!isLast && (
                                            <Box
                                                sx={{
                                                    width: '2px',
                                                    flexGrow: 1,
                                                    minHeight: 28,
                                                    bgcolor: 'divider',
                                                    my: 0.5,
                                                }}
                                            />
                                        )}
                                    </Stack>

                                    <Box sx={{ pb: isLast ? 0 : 2.5, flexGrow: 1 }}>
                                        <Typography variant="subtitle2" sx={{ color }}>
                                            {orderStatusLabel(entry.status)}
                                        </Typography>

                                        <Typography variant="body2">
                                            {formatDateTime(entry.changed_at)}
                                        </Typography>

                                        <Typography variant="caption" color="text.secondary">
                                            {[
                                                entry.from_status
                                                    ? `from ${orderStatusLabel(entry.from_status)}`
                                                    : null,
                                                actor,
                                                elapsed,
                                            ]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </Typography>

                                        {entry.note && (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ mt: 0.5, fontStyle: 'italic' }}
                                            >
                                                {entry.note}
                                            </Typography>
                                        )}
                                    </Box>
                                </Stack>
                            );
                        })}
                    </Stack>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
