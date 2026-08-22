import type { LoyaltyReferral } from 'src/types/loyalty';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/config-global';
import { getLoyaltyReferrals } from 'src/services/loyalty';

import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const STATUS_COLORS: Record<LoyaltyReferral['status'], 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  PENDING: 'warning',
  QUALIFIED: 'info',
  COMPLETED: 'success',
  REJECTED: 'error',
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function Page() {
  const [referrals, setReferrals] = useState<LoyaltyReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReferrals = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getLoyaltyReferrals({ page, limit: 20 });
      if (res.success) {
        setReferrals(res.data);
        setTotalPages(res.pagination.totalPages || res.pagination.pages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load referrals');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchReferrals(); }, [fetchReferrals]);

  return (
    <>
      <title>{`Loyalty · Referrals - ${CONFIG.appName}`}</title>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Typography variant="h4">Referrals</Typography>

          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

          <Card>
            <Scrollbar>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Referrer</TableCell>
                      <TableCell>Referred</TableCell>
                      <TableCell>Code</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Referrer Points</TableCell>
                      <TableCell>Completed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                    ) : referrals.length === 0 ? (
                      <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        <Typography variant="body2" color="text.secondary">No referrals yet</Typography>
                      </TableCell></TableRow>
                    ) : (
                      referrals.map((r) => (
                        <TableRow key={r._id} hover>
                          <TableCell>{r.referrerMobile}</TableCell>
                          <TableCell>{r.referredMobile}</TableCell>
                          <TableCell>{r.referralCode}</TableCell>
                          <TableCell><Chip size="small" label={r.status} color={STATUS_COLORS[r.status]} /></TableCell>
                          <TableCell align="right">{r.referrerReward.points || '—'}</TableCell>
                          <TableCell>{r.completedAt ? formatDateTime(r.completedAt) : '—'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>
          </Card>

          {totalPages > 1 && (
            <Stack alignItems="center">
              <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
            </Stack>
          )}
        </Stack>
      </Container>
    </>
  );
}
