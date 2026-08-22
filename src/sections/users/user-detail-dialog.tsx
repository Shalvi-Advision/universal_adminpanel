import type { UserDetail } from 'src/types/api';
import type { ChartOptions } from 'src/components/chart';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import { useTheme } from '@mui/material/styles';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { getUserDetail } from 'src/services/users';
import { orderStatusLabel, normalizeOrderStatus } from 'src/services/orders';

import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';

import { formatDate, STATUS_COLORS, formatDateTime, formatCurrency } from 'src/sections/orders/order-format';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  userId: string | null;
  onClose: () => void;
};

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const monthLabel = (ym: string) => {
  const [year, month] = ym.split('-');
  return `${MONTH_LABELS[Number(month) - 1] || month} ${year.slice(2)}`;
};

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <Card sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Avatar sx={{ bgcolor: `${color}.lighter`, color: `${color}.dark`, width: 44, height: 44 }}>
        <Iconify icon={icon as any} width={22} />
      </Avatar>
      <Box>
        <Typography variant="h6">{value}</Typography>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </Box>
    </Card>
  );
}

export function UserDetailDialog({ open, userId, onClose }: Props) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<UserDetail | null>(null);

  useEffect(() => {
    if (!open || !userId) return undefined;

    let cancelled = false;
    setLoading(true);
    setError('');
    setDetail(null);

    getUserDetail(userId)
      .then((res) => {
        if (!cancelled && res.success) setDetail(res.data);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err.message || 'Failed to load user details');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  const chartOptions = useChart({
    colors: [theme.palette.primary.main],
    xaxis: { categories: (detail?.spendTrend || []).map((p) => monthLabel(p._id)) },
    stroke: { width: 3, curve: 'smooth' },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0 } },
    tooltip: { y: { formatter: (value: number) => formatCurrency(value) } },
  }) as ChartOptions;

  const user = detail?.user;
  const stats = detail?.stats;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ width: 48, height: 48 }}>{(user?.name || 'U')[0].toUpperCase()}</Avatar>
          <Box>
            <Typography variant="h6">{user?.name || 'Unnamed Customer'}</Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.mobile} {user?.email ? `· ${user.email}` : ''}
            </Typography>
          </Box>
          {user?.role && (
            <Chip
              size="small"
              label={user.role.toUpperCase()}
              color={user.role === 'admin' ? 'primary' : 'default'}
            />
          )}
        </Stack>
        <IconButton onClick={onClose}>
          <Iconify icon={'solar:close-circle-bold-duotone' as any} width={26} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Stack alignItems="center" sx={{ py: 8 }}>
            <CircularProgress />
          </Stack>
        )}

        {!loading && detail && (
          <Stack spacing={3}>
            {/* Stat cards */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                <StatCard
                  label="Total Orders"
                  value={String(stats?.totalOrders ?? 0)}
                  icon="solar:bag-check-bold-duotone"
                  color="primary"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                <StatCard
                  label="Lifetime Spend"
                  value={formatCurrency(stats?.totalSpent ?? 0)}
                  icon="solar:wallet-money-bold-duotone"
                  color="success"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                <StatCard
                  label="Avg Order Value"
                  value={formatCurrency(stats?.avgOrderValue ?? 0)}
                  icon="solar:chart-2-bold-duotone"
                  color="info"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                <StatCard
                  label="Delivered"
                  value={String(stats?.completedOrders ?? 0)}
                  icon="solar:check-circle-bold-duotone"
                  color="success"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                <StatCard
                  label="Cancelled"
                  value={String(stats?.cancelledOrders ?? 0)}
                  icon="solar:close-circle-bold-duotone"
                  color="error"
                />
              </Grid>
            </Grid>

            {/* Spend trend */}
            <Card sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Spend Trend (last 12 months)
              </Typography>
              {detail.spendTrend.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No orders in the last 12 months
                </Typography>
              ) : (
                <Chart
                  type="area"
                  series={[{ name: 'Spend', data: detail.spendTrend.map((p) => p.totalSpent) }]}
                  options={chartOptions}
                  sx={{ height: 240 }}
                />
              )}
            </Card>

            {/* Order history */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Order History
                {stats?.lastOrderAt && (
                  <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    (last order {formatDate(stats.lastOrderAt)})
                  </Typography>
                )}
              </Typography>
              <Card>
                <TableContainer sx={{ maxHeight: 320 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Order #</TableCell>
                        <TableCell>Store</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="center">Items</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Placed</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detail.orders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              No orders yet
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        detail.orders.map((order) => {
                          const status = normalizeOrderStatus(order.order_status);
                          return (
                            <TableRow key={order._id} hover>
                              <TableCell>{order.order_number}</TableCell>
                              <TableCell>{order.store_code}</TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={orderStatusLabel(order.order_status)}
                                  sx={{ color: '#fff', fontWeight: 600, bgcolor: STATUS_COLORS[status] }}
                                />
                              </TableCell>
                              <TableCell align="center">{order.order_summary?.total_items ?? '—'}</TableCell>
                              <TableCell align="right">
                                {formatCurrency(order.order_summary?.total_amount ?? 0)}
                              </TableCell>
                              <TableCell>{formatDateTime(order.order_placed_at)}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Box>

            <Grid container spacing={3}>
              {/* Addresses */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Addresses ({detail.addresses.length})
                </Typography>
                <Card sx={{ p: 2, maxHeight: 280, overflow: 'auto' }}>
                  {detail.addresses.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No saved addresses
                    </Typography>
                  ) : (
                    <Stack divider={<Divider flexItem />} spacing={1.5}>
                      {detail.addresses.map((addr) => (
                        <Box key={addr._id}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="subtitle2">{addr.full_name}</Typography>
                            {addr.is_default === 'Yes' && (
                              <Chip size="small" label="Default" color="primary" variant="outlined" />
                            )}
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            {[addr.delivery_addr_line_1, addr.delivery_addr_line_2, addr.delivery_addr_city]
                              .filter(Boolean)
                              .join(', ')}{' '}
                            - {addr.delivery_addr_pincode}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Card>
              </Grid>

              {/* Notifications */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Recent Notifications ({detail.notificationStats.totalCount}, {detail.notificationStats.unreadCount}{' '}
                  unread)
                </Typography>
                <Card sx={{ p: 2, maxHeight: 280, overflow: 'auto' }}>
                  {detail.notifications.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No notifications sent
                    </Typography>
                  ) : (
                    <Stack divider={<Divider flexItem />} spacing={1.5}>
                      {detail.notifications.map((n) => (
                        <Box key={n._id}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="subtitle2">{n.title}</Typography>
                            {!n.isRead && <Chip size="small" label="Unread" color="error" />}
                          </Stack>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {n.body}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(n.createdAt)}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Card>
              </Grid>
            </Grid>

            {/* Favorites */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Favorites ({detail.favorites.length})
              </Typography>
              {detail.favorites.length === 0 ? (
                <Card sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No favorited products
                  </Typography>
                </Card>
              ) : (
                <Grid container spacing={1.5}>
                  {detail.favorites.map((fav) => (
                    <Grid key={fav._id} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                      <Card sx={{ p: 1.5, textAlign: 'center', height: '100%' }}>
                        <Avatar
                          src={fav.product?.image || undefined}
                          variant="rounded"
                          sx={{ width: 56, height: 56, mx: 'auto', mb: 1 }}
                        >
                          <Iconify icon={'solar:box-bold-duotone' as any} width={24} />
                        </Avatar>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }} noWrap>
                          {fav.product?.name || fav.p_code}
                        </Typography>
                        {fav.product?.sellingPrice != null && (
                          <Typography variant="caption" color="text.secondary">
                            {formatCurrency(fav.product.sellingPrice)}
                          </Typography>
                        )}
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
