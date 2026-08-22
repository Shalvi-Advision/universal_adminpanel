import type { LoyaltyTier } from 'src/types/loyalty';

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
import { getLoyaltyTiers } from 'src/services/loyalty';
import { usePermissions } from 'src/contexts/permissions-context';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import TierDialog from './components/tier-dialog';

// ----------------------------------------------------------------------

export default function Page() {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('loyalty', 'create');
  const canEdit = hasPermission('loyalty', 'edit');

  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<LoyaltyTier | null>(null);

  const fetchTiers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getLoyaltyTiers();
      if (res.success) setTiers(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tiers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTiers(); }, [fetchTiers]);

  return (
    <>
      <title>{`Loyalty · Tiers - ${CONFIG.appName}`}</title>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h4">VIP Tiers</Typography>
            {canCreate && (
              <Button variant="contained" startIcon={<Iconify icon={'solar:add-circle-bold' as any} />} onClick={() => { setSelected(null); setDialogOpen(true); }}>
                New Tier
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
                      <TableCell>Rank</TableCell>
                      <TableCell>Code</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Spend Range</TableCell>
                      <TableCell>Multiplier</TableCell>
                      <TableCell>Status</TableCell>
                      {canEdit && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                    ) : tiers.length === 0 ? (
                      <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                        <Typography variant="body2" color="text.secondary">No tiers configured</Typography>
                      </TableCell></TableRow>
                    ) : (
                      tiers.map((tier) => (
                        <TableRow key={tier._id} hover>
                          <TableCell>{tier.rank}</TableCell>
                          <TableCell><Chip size="small" label={tier.code} color="primary" variant="outlined" /></TableCell>
                          <TableCell>{tier.name}</TableCell>
                          <TableCell>
                            ₹{tier.minimumSpend.toLocaleString('en-IN')} – {tier.maximumSpend != null ? `₹${tier.maximumSpend.toLocaleString('en-IN')}` : '∞'}
                          </TableCell>
                          <TableCell>{tier.pointMultiplier}x</TableCell>
                          <TableCell>
                            <Chip size="small" label={tier.status} color={tier.status === 'ACTIVE' ? 'success' : 'default'} />
                          </TableCell>
                          {canEdit && (
                            <TableCell align="right">
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => { setSelected(tier); setDialogOpen(true); }}>
                                  <Iconify icon={'solar:pen-bold-duotone' as any} width={18} />
                                </IconButton>
                              </Tooltip>
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

        <TierDialog
          open={dialogOpen}
          tier={selected}
          onClose={() => setDialogOpen(false)}
          onSuccess={() => { setDialogOpen(false); fetchTiers(); }}
        />
      </Container>
    </>
  );
}
