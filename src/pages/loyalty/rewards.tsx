import type { LoyaltyReward } from 'src/types/loyalty';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Pagination from '@mui/material/Pagination';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/config-global';
import { usePermissions } from 'src/contexts/permissions-context';
import { getLoyaltyRewards, deleteLoyaltyReward } from 'src/services/loyalty';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import RewardDialog from './components/reward-dialog';
import { DeleteConfirmDialog } from '../dynamic/components/delete-confirm-dialog';

// ----------------------------------------------------------------------

export default function Page() {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('loyalty', 'create');
  const canEdit = hasPermission('loyalty', 'edit');
  const canDelete = hasPermission('loyalty', 'delete');

  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<LoyaltyReward | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchRewards = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getLoyaltyRewards({ page, limit: 20 });
      if (res.success) {
        setRewards(res.data);
        setTotalPages(res.pagination.totalPages || res.pagination.pages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load rewards');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchRewards(); }, [fetchRewards]);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteLoyaltyReward(deleteId);
      setDeleteOpen(false);
      fetchRewards();
    } catch (err: any) {
      setError(err.message || 'Failed to delete reward');
    }
  };

  return (
    <>
      <title>{`Loyalty · Rewards - ${CONFIG.appName}`}</title>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h4">Reward Catalog</Typography>
            {canCreate && (
              <Button variant="contained" startIcon={<Iconify icon={'solar:add-circle-bold' as any} />} onClick={() => { setSelected(null); setDialogOpen(true); }}>
                New Reward
              </Button>
            )}
          </Stack>

          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

          <Card>
            <Scrollbar>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Points</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell>Min Order</TableCell>
                      <TableCell>Used</TableCell>
                      <TableCell>Status</TableCell>
                      {(canEdit || canDelete) && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={8} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                    ) : rewards.length === 0 ? (
                      <TableRow><TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                        <Typography variant="body2" color="text.secondary">No rewards in the catalog</Typography>
                      </TableCell></TableRow>
                    ) : (
                      rewards.map((reward) => (
                        <TableRow key={reward._id} hover>
                          <TableCell>{reward.name}</TableCell>
                          <TableCell><Chip size="small" variant="outlined" label={reward.type.replace(/_/g, ' ')} /></TableCell>
                          <TableCell>{reward.pointsRequired.toLocaleString('en-IN')}</TableCell>
                          <TableCell>
                            {reward.type === 'PERCENTAGE_DISCOUNT' ? `${reward.discountValue}%` :
                              reward.type === 'FREE_SHIPPING' ? '—' : `₹${reward.discountValue}`}
                          </TableCell>
                          <TableCell>₹{reward.minimumOrderValue}</TableCell>
                          <TableCell>{reward.usedCount}{reward.usageLimit != null ? ` / ${reward.usageLimit}` : ''}</TableCell>
                          <TableCell>
                            <Chip size="small" label={reward.status} color={reward.status === 'ACTIVE' ? 'success' : 'default'} />
                          </TableCell>
                          {(canEdit || canDelete) && (
                            <TableCell align="right">
                              <Stack direction="row" justifyContent="flex-end">
                                {canEdit && (
                                  <Tooltip title="Edit">
                                    <IconButton size="small" onClick={() => { setSelected(reward); setDialogOpen(true); }}>
                                      <Iconify icon={'solar:pen-bold-duotone' as any} width={18} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {canDelete && (
                                  <Tooltip title="Delete">
                                    <IconButton size="small" color="error" onClick={() => { setDeleteId(reward._id); setDeleteOpen(true); }}>
                                      <Iconify icon={'solar:trash-bin-trash-bold-duotone' as any} width={18} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Stack>
                            </TableCell>
                          )}
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

        <RewardDialog
          open={dialogOpen}
          reward={selected}
          onClose={() => setDialogOpen(false)}
          onSuccess={() => { setDialogOpen(false); fetchRewards(); }}
        />
        <DeleteConfirmDialog
          open={deleteOpen}
          title="Delete Reward"
          message="Are you sure you want to delete this reward? Customers who already redeemed it keep their voucher."
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDeleteConfirm}
        />
      </Container>
    </>
  );
}
