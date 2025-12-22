import type { RecentOrder, DashboardOverview } from 'src/types/api';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import { getRecentOrders, getDashboardOverview } from 'src/services/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  gradient: string;
  iconBg: string;
}

function StatCard({ title, value, subtitle, icon, gradient, iconBg }: StatCardProps) {
  return (
    <Card
      sx={{
        p: 3,
        height: '100%',
        background: gradient,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.common.black, 0.12)}`,
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => `0 12px 32px ${alpha(theme.palette.common.black, 0.18)}`,
        },
      }}
    >
      <Stack spacing={1}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: iconBg,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <Iconify icon={icon as any} width={28} sx={{ color: 'white' }} />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
            {value}
          </Typography>
          <Typography variant="subtitle2" sx={{ color: alpha('#fff', 0.8), fontWeight: 500 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: alpha('#fff', 0.6), mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>

      {/* Decorative circle */}
      <Box
        sx={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: alpha('#fff', 0.1),
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -40,
          right: 30,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: alpha('#fff', 0.08),
        }}
      />
    </Card>
  );
}

interface MiniStatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

function MiniStatCard({ title, value, icon, color }: MiniStatCardProps) {
  return (
    <Card
      sx={{
        p: 2.5,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        boxShadow: (theme) => `0 4px 16px ${alpha(theme.palette.common.black, 0.08)}`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: (theme) => `0 6px 20px ${alpha(theme.palette.common.black, 0.12)}`,
        },
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: alpha(color, 0.12),
        }}
      >
        <Iconify icon={icon as any} width={24} sx={{ color }} />
      </Box>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
          {value}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {title}
        </Typography>
      </Box>
    </Card>
  );
}

const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'warning' | 'error' | 'success' | 'info' => {
  const colors: Record<string, 'default' | 'primary' | 'secondary' | 'warning' | 'error' | 'success' | 'info'> = {
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

export function OverviewAnalyticsView() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        const [overviewResponse, ordersResponse] = await Promise.all([
          getDashboardOverview(),
          getRecentOrders(5)
        ]);

        if (overviewResponse.success) {
          setOverview(overviewResponse.data);
        }
        if (ordersResponse.success) {
          setRecentOrders(ordersResponse.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)}K`;
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <DashboardContent maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 3 }}>
          Hi, Welcome back 👋
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={48} />
        </Box>
      </DashboardContent>
    );
  }

  if (error) {
    return (
      <DashboardContent maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 3 }}>
          Hi, Welcome back 👋
        </Typography>
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </DashboardContent>
    );
  }

  if (!overview) {
    return (
      <DashboardContent maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 3 }}>
          Hi, Welcome back 👋
        </Typography>
        <Alert severity="info">No dashboard data available</Alert>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 4 } }}>
        Hi, Welcome back 👋
      </Typography>

      {/* Main Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(overview.revenue.total)}
            subtitle={`This month: ${formatCurrency(overview.revenue.thisMonth)}`}
            icon="eva:trending-up-fill"
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            iconBg="linear-gradient(135deg, #764ba2 0%, #667eea 100%)"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Orders"
            value={overview.orders.total}
            subtitle={`Today: ${overview.orders.today} orders`}
            icon="solar:cart-3-bold"
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            iconBg="linear-gradient(135deg, #f5576c 0%, #f093fb 100%)"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Users"
            value={overview.users.total}
            subtitle={`New this month: ${overview.users.newThisMonth}`}
            icon="solar:check-circle-bold"
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            iconBg="linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)"
          />
        </Grid>
      </Grid>

      {/* Mini Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MiniStatCard
            title="Today's Orders"
            value={overview.orders.today}
            icon="solar:calendar-mark-bold"
            color="#FF6B6B"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MiniStatCard
            title="Pending Orders"
            value={overview.orders.pending}
            icon="solar:clock-circle-bold"
            color="#FF9800"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MiniStatCard
            title="Delivered Orders"
            value={overview.orders.delivered}
            icon="solar:check-circle-bold"
            color="#4CAF50"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MiniStatCard
            title="Refunded Orders"
            value={overview.orders.refunded}
            icon="solar:restart-bold"
            color="#F44336"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MiniStatCard
            title="New Users Today"
            value={overview.users.newToday}
            icon="eva:trending-up-fill"
            color="#4CAF50"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MiniStatCard
            title="Avg Order Value"
            value={formatCurrency(overview.revenue.averageOrderValue)}
            icon="eva:trending-up-fill"
            color="#2196F3"
          />
        </Grid>
      </Grid>

      {/* Recent Orders */}
      <Card>
        <CardHeader
          title="Recent Orders"
          action={
            <Button
              size="small"
              color="inherit"
              onClick={() => navigate('/orders')}
              endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={18} />}
            >
              View All
            </Button>
          }
          sx={{ pb: 0 }}
        />
        <Scrollbar>
          <TableContainer sx={{ minWidth: 720, px: 2, pb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No recent orders
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  recentOrders.map((order) => (
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
                        <Typography variant="subtitle2" color="primary">
                          ₹{order.order_summary?.total_amount?.toFixed(2) || '0.00'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.order_status}
                          color={getStatusColor(order.order_status)}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {formatDate(order.order_placed_at)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/orders?highlight=${order._id}`)}
                          title="View Order"
                          sx={{
                            color: 'primary.main',
                            '&:hover': {
                              bgcolor: 'primary.lighter',
                            }
                          }}
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
      </Card>
    </DashboardContent>
  );
}
