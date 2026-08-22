import type { LoyaltyAccountSummary } from 'src/types/loyalty';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Pagination from '@mui/material/Pagination';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/config-global';
import { usePermissions } from 'src/contexts/permissions-context';
import { getLoyaltyAccounts, setLoyaltyAccountStatus } from 'src/services/loyalty';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import AdjustPointsDialog from './components/adjust-points-dialog';
import AccountDetailDialog from './components/account-detail-dialog';

// ----------------------------------------------------------------------

export default function Page() {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission('loyalty', 'edit');

  const [accounts, setAccounts] = useState<LoyaltyAccountSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [detailMobile, setDetailMobile] = useState<string | null>(null);
  const [adjustMobile, setAdjustMobile] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getLoyaltyAccounts({ page, limit: 20, search: search || undefined });
      if (res.success) {
        setAccounts(res.data);
        setTotalPages(res.pagination.totalPages || res.pagination.pages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load loyalty accounts');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timer = setTimeout(fetchAccounts, 300);
    return () => clearTimeout(timer);
  }, [fetchAccounts]);

  const handleToggleStatus = async (account: LoyaltyAccountSummary) => {
    try {
      const next = account.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      const reason = next === 'SUSPENDED' ? window.prompt('Reason for suspending this account?') || '' : undefined;
      await setLoyaltyAccountStatus(account.mobile, next, reason);
      fetchAccounts();
    } catch (err: any) {
      setError(err.message || 'Failed to update account status');
    }
  };

  return (
    <>
      <title>{`Loyalty · Customers - ${CONFIG.appName}`}</title>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Typography variant="h4">Loyalty Customers</Typography>

          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

          <TextField
            placeholder="Search by mobile or name..."
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            sx={{ maxWidth: 360 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon={'solar:magnifer-bold' as any} width={20} />
                </InputAdornment>
              ),
            }}
          />

          <Card>
            <Scrollbar>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell>Mobile</TableCell>
                      <TableCell>Tier</TableCell>
                      <TableCell align="right">Available</TableCell>
                      <TableCell align="right">Pending</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                    ) : accounts.length === 0 ? (
                      <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                        <Typography variant="body2" color="text.secondary">No loyalty accounts found</Typography>
                      </TableCell></TableRow>
                    ) : (
                      accounts.map((account) => (
                        <TableRow key={account._id} hover>
                          <TableCell>{account.user?.name || '—'}</TableCell>
                          <TableCell>{account.mobile}</TableCell>
                          <TableCell>
                            {account.currentTierCode ? <Chip size="small" variant="outlined" label={account.currentTierCode} /> : '—'}
                          </TableCell>
                          <TableCell align="right">{account.availablePoints.toLocaleString('en-IN')}</TableCell>
                          <TableCell align="right">{account.pendingPoints.toLocaleString('en-IN')}</TableCell>
                          <TableCell>
                            <Chip size="small" label={account.status} color={account.status === 'ACTIVE' ? 'success' : 'error'} />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" justifyContent="flex-end">
                              <Tooltip title="View details">
                                <IconButton size="small" onClick={() => setDetailMobile(account.mobile)}>
                                  <Iconify icon={'solar:eye-bold-duotone' as any} width={18} />
                                </IconButton>
                              </Tooltip>
                              {canEdit && (
                                <>
                                  <Tooltip title="Adjust points">
                                    <IconButton size="small" onClick={() => setAdjustMobile(account.mobile)}>
                                      <Iconify icon={'solar:pen-bold-duotone' as any} width={18} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title={account.status === 'ACTIVE' ? 'Suspend account' : 'Activate account'}>
                                    <IconButton size="small" color={account.status === 'ACTIVE' ? 'error' : 'success'} onClick={() => handleToggleStatus(account)}>
                                      <Iconify
                                        icon={(account.status === 'ACTIVE' ? 'solar:lock-bold-duotone' : 'solar:lock-unlocked-bold-duotone') as any}
                                        width={18}
                                      />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Stack>
                          </TableCell>
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

        <AccountDetailDialog open={!!detailMobile} mobile={detailMobile} onClose={() => setDetailMobile(null)} />
        <AdjustPointsDialog
          open={!!adjustMobile}
          mobile={adjustMobile}
          onClose={() => setAdjustMobile(null)}
          onSuccess={() => { setAdjustMobile(null); fetchAccounts(); }}
        />
      </Container>
    </>
  );
}
