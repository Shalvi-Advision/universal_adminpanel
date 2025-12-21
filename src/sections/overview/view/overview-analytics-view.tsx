import type { DashboardOverview } from 'src/types/api';

import { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import { getDashboardOverview } from 'src/services/dashboard';

import { AnalyticsWidgetSummary } from '../analytics-widget-summary';

// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getDashboardOverview();
        if (response.success) {
          setOverview(response.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <DashboardContent maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 3 }}>
          Hi, Welcome back 👋
        </Typography>
        <CircularProgress />
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
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Hi, Welcome back 👋
      </Typography>

      <Grid container spacing={3}>
        {/* Total Revenue Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Total Revenue"
            percent={overview.revenue.growth || 0}
            total={overview.revenue.total}
            icon={<img alt="Total Revenue" src="/assets/icons/glass/ic-glass-bag.svg" />}
            chart={{
              categories: ['Last Month', 'This Month'],
              series: [overview.revenue.lastMonth, overview.revenue.thisMonth],
            }}
          />
        </Grid>

        {/* Total Orders Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Total Orders"
            percent={overview.orders.growth}
            total={overview.orders.total}
            color="secondary"
            icon={<img alt="Total Orders" src="/assets/icons/glass/ic-glass-buy.svg" />}
            chart={{
              categories: ['Last Month', 'This Month'],
              series: [overview.orders.lastMonth, overview.orders.thisMonth],
            }}
          />
        </Grid>

        {/* Total Users Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Total Users"
            percent={overview.users.growth}
            total={overview.users.total}
            color="warning"
            icon={<img alt="Total Users" src="/assets/icons/glass/ic-glass-users.svg" />}
            chart={{
              categories: ['Last Month', 'This Month'],
              series: [overview.users.newLastMonth, overview.users.newThisMonth],
            }}
          />
        </Grid>



        {/* Stats Info Grid */}
        <Grid size={{ xs: 12 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Pending Orders
              </Typography>
              <Typography variant="h6">{overview.orders.pending}</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="body2" color="text.secondary">
                New Users Today
              </Typography>
              <Typography variant="h6">{overview.users.newToday}</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Avg Order Value
              </Typography>
              <Typography variant="h6">₹{overview.revenue.averageOrderValue.toFixed(2)}</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Low Stock Products
              </Typography>
              <Typography variant="h6">{overview.products.lowStock}</Typography>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
