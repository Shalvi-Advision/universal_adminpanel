import type { LoyaltyDashboardStats } from 'src/types/loyalty';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/config-global';
import { getLoyaltyDashboard } from 'src/services/loyalty';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
      <Avatar sx={{ bgcolor: `${color}.lighter`, color: `${color}.dark`, width: 48, height: 48 }}>
        <Iconify icon={icon as any} width={24} />
      </Avatar>
      <Box>
        <Typography variant="h5">{value}</Typography>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </Box>
    </Card>
  );
}

export default function Page() {
  const [stats, setStats] = useState<LoyaltyDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getLoyaltyDashboard()
      .then((res) => { if (res.success) setStats(res.data); })
      .catch((err: any) => setError(err.message || 'Failed to load loyalty dashboard'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <title>{`Loyalty · Dashboard - ${CONFIG.appName}`}</title>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>Loyalty Dashboard</Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
        ) : stats ? (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatCard label="Total Members" value={stats.totalMembers.toLocaleString('en-IN')} icon="solar:users-group-rounded-bold-duotone" color="primary" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatCard label="Active Members" value={stats.activeMembers.toLocaleString('en-IN')} icon="solar:user-check-bold-duotone" color="success" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatCard label="Points Issued" value={stats.pointsIssued.toLocaleString('en-IN')} icon="solar:star-bold-duotone" color="warning" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatCard label="Points Redeemed" value={stats.pointsRedeemed.toLocaleString('en-IN')} icon="solar:gift-bold-duotone" color="info" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatCard label="Outstanding Points" value={stats.outstandingPoints.toLocaleString('en-IN')} icon="solar:wallet-money-bold-duotone" color="primary" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatCard label="Points Expired" value={stats.pointsExpired.toLocaleString('en-IN')} icon="solar:clock-circle-bold-duotone" color="error" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatCard label="Redemption Rate" value={`${stats.redemptionRate}%`} icon="solar:chart-2-bold-duotone" color="success" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatCard label="Referral Conversions" value={stats.referralConversions.toLocaleString('en-IN')} icon="solar:users-group-two-rounded-bold-duotone" color="info" />
              </Grid>
            </Grid>

            <Card sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" sx={{ mb: 1.5 }}>Top Redeemed Rewards</Typography>
              {stats.topRewards.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No redemptions yet</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Reward</TableCell>
                        <TableCell align="right">Redemptions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.topRewards.map((r) => (
                        <TableRow key={r.name} hover>
                          <TableCell>{r.name}</TableCell>
                          <TableCell align="right">{r.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>
          </>
        ) : null}
      </Container>
    </>
  );
}
