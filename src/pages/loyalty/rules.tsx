import type { LoyaltyRule } from 'src/types/loyalty';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
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
import { getLoyaltyRules, setLoyaltyRuleStatus } from 'src/services/loyalty';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import RuleDialog from './components/rule-dialog';

// ----------------------------------------------------------------------

export default function Page() {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('loyalty', 'create');
  const canEdit = hasPermission('loyalty', 'edit');

  const [rules, setRules] = useState<LoyaltyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<LoyaltyRule | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getLoyaltyRules();
      if (res.success) setRules(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load rules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const handleToggle = async (rule: LoyaltyRule) => {
    try {
      await setLoyaltyRuleStatus(rule._id, rule.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
      fetchRules();
    } catch (err: any) {
      setError(err.message || 'Failed to update rule status');
    }
  };

  return (
    <>
      <title>{`Loyalty · Earning Rules - ${CONFIG.appName}`}</title>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h4">Earning Rules</Typography>
            {canCreate && (
              <Button
                variant="contained"
                startIcon={<Iconify icon={'solar:add-circle-bold' as any} />}
                onClick={() => { setSelected(null); setDialogOpen(true); }}
              >
                New Rule
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
                      <TableCell>Code</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Event</TableCell>
                      <TableCell>Points</TableCell>
                      <TableCell>Pending Days</TableCell>
                      <TableCell align="center">Active</TableCell>
                      {canEdit && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                    ) : rules.length === 0 ? (
                      <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                        <Typography variant="body2" color="text.secondary">No earning rules configured</Typography>
                      </TableCell></TableRow>
                    ) : (
                      rules.map((rule) => (
                        <TableRow key={rule._id} hover>
                          <TableCell><Chip size="small" label={rule.code} variant="outlined" /></TableCell>
                          <TableCell>{rule.name}</TableCell>
                          <TableCell>{rule.event.replace(/_/g, ' ')}</TableCell>
                          <TableCell>
                            {rule.pointsType === 'FIXED_PER_AMOUNT'
                              ? `${rule.pointsValue} pts / ₹${rule.amountValue}`
                              : `${rule.pointsValue} pts`}
                          </TableCell>
                          <TableCell>{rule.pendingPeriodDays}</TableCell>
                          <TableCell align="center">
                            <Switch
                              checked={rule.status === 'ACTIVE'}
                              onChange={() => handleToggle(rule)}
                              disabled={!canEdit}
                              size="small"
                            />
                          </TableCell>
                          {canEdit && (
                            <TableCell align="right">
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => { setSelected(rule); setDialogOpen(true); }}>
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

        <RuleDialog
          open={dialogOpen}
          rule={selected}
          onClose={() => setDialogOpen(false)}
          onSuccess={() => { setDialogOpen(false); fetchRules(); }}
        />
      </Container>
    </>
  );
}
