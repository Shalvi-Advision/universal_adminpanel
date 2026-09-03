import type { LabelColor } from 'src/components/label';
import type {
  SubscriptionRecord,
  TenantSubscriptionSummary,
} from 'src/services/subscriptions';

import dayjs from 'dayjs';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';

import { fDate } from 'src/utils/format-time';

import { CONFIG } from 'src/config-global';
import {
  cancelSubscription,
  updateSubscription,
  getSubscriptionHistory,
  getAllTenantSubscriptions,
  createOrRenewSubscription,
} from 'src/services/subscriptions';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

type DialogMode = 'renew' | 'edit';

const EDITABLE_STATUSES = ['active', 'upcoming'];

function daysRemainingOf(endDate: string): number {
  return dayjs(endDate).startOf('day').diff(dayjs().startOf('day'), 'day');
}

function statusLabel(row: TenantSubscriptionSummary): { label: string; color: LabelColor } {
  const { current } = row;
  if (!current) return { label: 'No subscription', color: 'default' };

  if (current.status === 'cancelled') return { label: 'Cancelled', color: 'error' };
  if (current.status === 'expired') return { label: 'Expired', color: 'error' };
  if (current.status === 'upcoming') return { label: 'Upcoming', color: 'info' };

  // active
  const remaining = daysRemainingOf(current.end_date);
  if (remaining <= 7) return { label: 'Expiring soon', color: 'warning' };
  return { label: 'Active', color: 'success' };
}

const emptyForm = { start_date: '', end_date: '', product_limit: '' as number | '', notes: '' };

export default function ManageSubscriptionsPage() {
  const [rows, setRows] = useState<TenantSubscriptionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Renew/Edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>('renew');
  const [selectedRow, setSelectedRow] = useState<TenantSubscriptionSummary | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState('');

  // History dialog state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRow, setHistoryRow] = useState<TenantSubscriptionSummary | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<SubscriptionRecord[]>([]);

  // Cancel confirmation state
  const [cancelTarget, setCancelTarget] = useState<TenantSubscriptionSummary | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchRows = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAllTenantSubscriptions();
      if (response.success) {
        setRows(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const handleOpenRenew = (row: TenantSubscriptionSummary) => {
    setDialogMode('renew');
    setSelectedRow(row);
    setForm({
      start_date: dayjs().format('YYYY-MM-DD'),
      end_date: '',
      product_limit: row.current?.product_limit ?? '',
      notes: '',
    });
    setDialogError('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (row: TenantSubscriptionSummary) => {
    if (!row.current) return;
    setDialogMode('edit');
    setSelectedRow(row);
    setForm({
      start_date: dayjs(row.current.start_date).format('YYYY-MM-DD'),
      end_date: dayjs(row.current.end_date).format('YYYY-MM-DD'),
      product_limit: row.current.product_limit,
      notes: row.current.notes || '',
    });
    setDialogError('');
    setDialogOpen(true);
  };

  const handleOpenHistory = async (row: TenantSubscriptionSummary) => {
    setHistoryRow(row);
    setHistoryOpen(true);
    setHistoryRecords([]);
    try {
      setHistoryLoading(true);
      const response = await getSubscriptionHistory(row.project_code);
      if (response.success) {
        setHistoryRecords(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedRow) return;

    if (!form.start_date || !form.end_date || form.product_limit === '') {
      setDialogError('Start date, end date and product limit are required');
      return;
    }
    if (dayjs(form.end_date).isBefore(dayjs(form.start_date))) {
      setDialogError('End date must be after start date');
      return;
    }

    try {
      setSaving(true);
      setDialogError('');
      const payload = {
        start_date: form.start_date,
        end_date: form.end_date,
        product_limit: Number(form.product_limit),
        notes: form.notes || undefined,
      };

      if (dialogMode === 'renew') {
        await createOrRenewSubscription(selectedRow.project_code, payload);
        setSuccess(`Subscription renewed for ${selectedRow.client_name}`);
      } else {
        if (!selectedRow.current?._id) return;
        await updateSubscription(selectedRow.project_code, selectedRow.current._id, payload);
        setSuccess(`Subscription updated for ${selectedRow.client_name}`);
      }

      setDialogOpen(false);
      fetchRows();
    } catch (err: any) {
      setDialogError(err.message || 'Failed to save subscription');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget?.current?._id) return;
    try {
      setCancelling(true);
      await cancelSubscription(cancelTarget.project_code, cancelTarget.current._id);
      setSuccess(`Subscription cancelled for ${cancelTarget.client_name}`);
      setCancelTarget(null);
      fetchRows();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription');
      setCancelTarget(null);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <title>{`Manage Subscriptions | ${CONFIG.appName}`}</title>

      <Container maxWidth="lg">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Manage Subscriptions</Typography>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Card>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Scrollbar>
              <TableContainer sx={{ overflow: 'unset' }}>
                <Table sx={{ minWidth: 900 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Client</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell>End Date</TableCell>
                      <TableCell align="right">Days Remaining</TableCell>
                      <TableCell align="right">Product Limit</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => {
                      const { label, color } = statusLabel(row);
                      const canEdit =
                        !!row.current && EDITABLE_STATUSES.includes(row.current.status);
                      const remaining = row.current ? daysRemainingOf(row.current.end_date) : null;

                      return (
                        <TableRow key={row.project_code} hover>
                          <TableCell>
                            <Typography variant="subtitle2">{row.client_name}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {row.project_code}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Label color={color} variant="soft">
                              {label}
                            </Label>
                          </TableCell>
                          <TableCell>
                            {row.current ? fDate(row.current.start_date) : '—'}
                          </TableCell>
                          <TableCell>{row.current ? fDate(row.current.end_date) : '—'}</TableCell>
                          <TableCell align="right">{remaining ?? '—'}</TableCell>
                          <TableCell align="right">{row.current?.product_limit ?? '—'}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <IconButton
                                size="small"
                                title="Renew"
                                onClick={() => handleOpenRenew(row)}
                              >
                                <Iconify icon={'solar:restart-bold-duotone' as any} />
                              </IconButton>
                              {canEdit && (
                                <IconButton
                                  size="small"
                                  title="Edit"
                                  onClick={() => handleOpenEdit(row)}
                                >
                                  <Iconify icon={'solar:pen-bold-duotone' as any} />
                                </IconButton>
                              )}
                              <IconButton
                                size="small"
                                title="History"
                                onClick={() => handleOpenHistory(row)}
                              >
                                <Iconify icon={'solar:history-bold-duotone' as any} />
                              </IconButton>
                              {canEdit && (
                                <IconButton
                                  size="small"
                                  title="Cancel Subscription"
                                  color="error"
                                  onClick={() => setCancelTarget(row)}
                                >
                                  <Iconify icon={'solar:close-circle-bold-duotone' as any} />
                                </IconButton>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {rows.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            No tenants found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>
          )}
        </Card>

        {/* Renew / Edit Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {dialogMode === 'renew' ? 'Renew Subscription' : 'Edit Subscription'} —{' '}
            {selectedRow?.client_name}
          </DialogTitle>
          <DialogContent dividers>
            {dialogError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {dialogError}
              </Alert>
            )}
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Start Date"
                  type="date"
                  fullWidth
                  size="small"
                  value={form.start_date}
                  onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="End Date"
                  type="date"
                  fullWidth
                  size="small"
                  value={form.end_date}
                  onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Stack>
              <TextField
                label="Product Limit"
                type="number"
                size="small"
                value={form.product_limit}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    product_limit: e.target.value === '' ? '' : Number(e.target.value),
                  }))
                }
              />
              <TextField
                label="Notes"
                multiline
                minRows={3}
                size="small"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving
                ? 'Saving...'
                : dialogMode === 'renew'
                  ? 'Renew Subscription'
                  : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* History Dialog (read-only) */}
        <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Subscription History — {historyRow?.client_name}</DialogTitle>
          <DialogContent dividers>
            {historyLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : historyRecords.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
                No subscription history found
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell align="right">Product Limit</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell>Created By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyRecords.map((record) => (
                    <TableRow key={record._id}>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{record.status}</TableCell>
                      <TableCell>{fDate(record.start_date)}</TableCell>
                      <TableCell>{fDate(record.end_date)}</TableCell>
                      <TableCell align="right">{record.product_limit}</TableCell>
                      <TableCell>{record.notes || '—'}</TableCell>
                      <TableCell>{record.created_by_name || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setHistoryOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Cancel confirmation */}
        <Dialog open={!!cancelTarget} onClose={() => setCancelTarget(null)}>
          <DialogTitle>Cancel Subscription</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to cancel the current subscription for{' '}
              {cancelTarget?.client_name}? This cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelTarget(null)}>Back</Button>
            <Button
              onClick={handleConfirmCancel}
              color="error"
              variant="contained"
              disabled={cancelling}
              autoFocus
            >
              {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
