import type { LoyaltyCampaign } from 'src/types/loyalty';

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
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/config-global';
import { usePermissions } from 'src/contexts/permissions-context';
import { getLoyaltyCampaigns, deleteLoyaltyCampaign } from 'src/services/loyalty';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import CampaignDialog from './components/campaign-dialog';
import { DeleteConfirmDialog } from '../dynamic/components/delete-confirm-dialog';

// ----------------------------------------------------------------------

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function Page() {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('loyalty', 'create');
  const canEdit = hasPermission('loyalty', 'edit');
  const canDelete = hasPermission('loyalty', 'delete');

  const [campaigns, setCampaigns] = useState<LoyaltyCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<LoyaltyCampaign | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getLoyaltyCampaigns();
      if (res.success) setCampaigns(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteLoyaltyCampaign(deleteId);
      setDeleteOpen(false);
      fetchCampaigns();
    } catch (err: any) {
      setError(err.message || 'Failed to delete campaign');
    }
  };

  const isLive = (c: LoyaltyCampaign) => {
    const now = new Date();
    return c.status === 'ACTIVE' && new Date(c.validFrom) <= now && new Date(c.validUntil) >= now;
  };

  return (
    <>
      <title>{`Loyalty · Campaigns - ${CONFIG.appName}`}</title>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h4">Campaigns</Typography>
            {canCreate && (
              <Button variant="contained" startIcon={<Iconify icon={'solar:add-circle-bold' as any} />} onClick={() => { setSelected(null); setDialogOpen(true); }}>
                New Campaign
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
                      <TableCell>Multiplier</TableCell>
                      <TableCell>Window</TableCell>
                      <TableCell>Min Order</TableCell>
                      <TableCell>Status</TableCell>
                      {(canEdit || canDelete) && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                    ) : campaigns.length === 0 ? (
                      <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        <Typography variant="body2" color="text.secondary">No campaigns configured</Typography>
                      </TableCell></TableRow>
                    ) : (
                      campaigns.map((c) => (
                        <TableRow key={c._id} hover>
                          <TableCell>
                            <Typography variant="body2">{c.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{c.description}</Typography>
                          </TableCell>
                          <TableCell>{c.multiplier}x</TableCell>
                          <TableCell>{formatDate(c.validFrom)} – {formatDate(c.validUntil)}</TableCell>
                          <TableCell>₹{c.minimumOrderValue}</TableCell>
                          <TableCell>
                            <Chip size="small" label={isLive(c) ? 'Live' : c.status} color={isLive(c) ? 'success' : c.status === 'ACTIVE' ? 'warning' : 'default'} />
                          </TableCell>
                          {(canEdit || canDelete) && (
                            <TableCell align="right">
                              <Stack direction="row" justifyContent="flex-end">
                                {canEdit && (
                                  <Tooltip title="Edit">
                                    <IconButton size="small" onClick={() => { setSelected(c); setDialogOpen(true); }}>
                                      <Iconify icon={'solar:pen-bold-duotone' as any} width={18} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {canDelete && (
                                  <Tooltip title="Delete">
                                    <IconButton size="small" color="error" onClick={() => { setDeleteId(c._id); setDeleteOpen(true); }}>
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
        </Stack>

        <CampaignDialog
          open={dialogOpen}
          campaign={selected}
          onClose={() => setDialogOpen(false)}
          onSuccess={() => { setDialogOpen(false); fetchCampaigns(); }}
        />
        <DeleteConfirmDialog
          open={deleteOpen}
          title="Delete Campaign"
          message="Are you sure you want to delete this campaign?"
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDeleteConfirm}
        />
      </Container>
    </>
  );
}
