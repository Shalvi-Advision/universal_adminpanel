import type { LoyaltyTransaction, LoyaltyAccountSummary } from 'src/types/loyalty';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { getLoyaltyAccountDetail } from 'src/services/loyalty';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const TYPE_COLORS: Record<LoyaltyTransaction['type'], 'success' | 'error' | 'default' | 'warning'> = {
  CREDIT: 'success',
  DEBIT: 'error',
  EXPIRATION: 'warning',
  REVERSAL: 'error',
  ADJUSTMENT: 'default',
};

type Props = {
  open: boolean;
  mobile: string | null;
  onClose: () => void;
};

export default function AccountDetailDialog({ open, mobile, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [account, setAccount] = useState<LoyaltyAccountSummary | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);

  useEffect(() => {
    if (!open || !mobile) return;
    setLoading(true);
    setError('');
    getLoyaltyAccountDetail(mobile)
      .then((res) => {
        if (res.success) {
          setAccount(res.data.account);
          setTransactions(res.data.transactions);
        }
      })
      .catch((err: any) => setError(err.message || 'Failed to load account'))
      .finally(() => setLoading(false));
  }, [open, mobile]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Loyalty Account — {mobile}</span>
        <IconButton onClick={onClose}><Iconify icon={'solar:close-circle-bold-duotone' as any} width={24} /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
        {loading ? (
          <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress /></Stack>
        ) : account ? (
          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary">Available</Typography>
                <Typography variant="h6">{account.availablePoints.toLocaleString('en-IN')}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary">Pending</Typography>
                <Typography variant="h6">{account.pendingPoints.toLocaleString('en-IN')}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary">Tier</Typography>
                <Typography variant="h6">{account.currentTierCode || '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary">Lifetime Spend</Typography>
                <Typography variant="h6">₹{account.eligibleLifetimeSpend.toLocaleString('en-IN')}</Typography>
              </Grid>
            </Grid>

            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Transaction History</Typography>
              <TableContainer sx={{ maxHeight: 360 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell align="right">Points</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">No transactions yet</Typography>
                      </TableCell></TableRow>
                    ) : (
                      transactions.map((tx) => (
                        <TableRow key={tx._id} hover>
                          <TableCell><Chip size="small" label={tx.type} color={TYPE_COLORS[tx.type]} /></TableCell>
                          <TableCell>{tx.source}</TableCell>
                          <TableCell align="right">
                            {tx.type === 'CREDIT' ? '+' : '-'}{tx.points.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell>{tx.status}</TableCell>
                          <TableCell>{formatDateTime(tx.createdAt)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Stack>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
