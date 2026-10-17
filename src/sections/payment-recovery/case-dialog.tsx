import type {
  PaymentRecoveryCase,
  PaymentRecoveryCaseDetail,
  PaymentRecoveryHistoryEntry,
} from 'src/services/payment-recovery';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import {
  getPaymentRecoveryCase,
  refundPaymentRecoveryCase,
  dismissPaymentRecoveryCase,
  restorePaymentRecoveryCase,
} from 'src/services/payment-recovery';

// ----------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  open: '#FFAB00',
  resolved: '#22C55E',
  dismissed: '#9E9E9E',
};

// Store's own delivery_start_offset_days from "today" (0 = same-day allowed).
const nextValidDate = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + Math.max(0, offsetDays));
  return d.toISOString().slice(0, 10);
};

const describeActor = (entry: PaymentRecoveryHistoryEntry) => {
  if (entry.changed_by_name) return `by ${entry.changed_by_name}`;
  return entry.changed_by_role === 'admin' ? 'by an admin' : 'automatically';
};

type Props = {
  open: boolean;
  caseId: string | null;
  canEdit: boolean;
  onClose: () => void;
  onChanged: (message: string) => void;
};

export function PaymentRecoveryCaseDialog({ open, caseId, canEdit, onClose, onChanged }: Props) {
  const [detail, setDetail] = useState<PaymentRecoveryCaseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Restore form state
  const [storeCode, setStoreCode] = useState('');
  const [slotId, setSlotId] = useState<number | ''>('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [addressId, setAddressId] = useState('');
  const [paymentModeId, setPaymentModeId] = useState<number | ''>('');
  const [dismissReason, setDismissReason] = useState('');

  const fetchDetail = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    setError('');
    try {
      const response = await getPaymentRecoveryCase(caseId);
      const { suggestions } = response.data;
      setDetail(response.data);

      // Pre-fill sane defaults — admin can override before submitting.
      // Prefer the store the cart snapshot was actually taken at, if any.
      const snapshotStoreCode = response.data.case.cart_snapshot?.store_code;
      const defaultStore =
        suggestions.stores.find((s) => s.store_code === snapshotStoreCode) ?? suggestions.stores[0];
      if (defaultStore) {
        setStoreCode(defaultStore.store_code);
        setSlotId(defaultStore.slots.length ? defaultStore.slots[0].iddelivery_slot : '');
        setDeliveryDate(nextValidDate(defaultStore.delivery_start_offset_days));
      }
      setAddressId(suggestions.addresses.length === 1 ? suggestions.addresses[0]._id : '');
      const onlineMode = suggestions.payment_modes.find((m) =>
        /online|razorpay|upi|card/i.test(m.payment_mode_name)
      );
      setPaymentModeId((onlineMode ?? suggestions.payment_modes[0])?.idpayment_mode ?? '');
    } catch (err: any) {
      setError(err.message || 'Failed to load case');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    if (open) {
      fetchDetail();
    } else {
      setDetail(null);
      setError('');
      setDismissReason('');
    }
  }, [open, fetchDetail]);

  const handleStoreChange = (code: string) => {
    setStoreCode(code);
    const store = detail?.suggestions.stores.find((s) => s.store_code === code);
    setSlotId(store?.slots.length ? store.slots[0].iddelivery_slot : '');
    if (store) setDeliveryDate(nextValidDate(store.delivery_start_offset_days));
  };

  const handleRestore = async () => {
    if (!caseId || !storeCode || !slotId || !deliveryDate || !paymentModeId) return;
    setBusy(true);
    setError('');
    try {
      const response = await restorePaymentRecoveryCase(caseId, {
        store_code: storeCode,
        fulfillment_type: 'delivery',
        delivery_slot_id: Number(slotId),
        delivery_date: deliveryDate,
        address_id: addressId || undefined,
        payment_mode_id: Number(paymentModeId),
      });
      onChanged(response.message || `Order #${response.data.order_number} created`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to restore order');
    } finally {
      setBusy(false);
    }
  };

  const handleRefund = async () => {
    if (!caseId) return;
    setBusy(true);
    setError('');
    try {
      await refundPaymentRecoveryCase(caseId, dismissReason || undefined);
      onChanged('Refund issued');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to issue refund');
    } finally {
      setBusy(false);
    }
  };

  const handleDismiss = async () => {
    if (!caseId || !dismissReason.trim()) return;
    setBusy(true);
    setError('');
    try {
      await dismissPaymentRecoveryCase(caseId, dismissReason);
      onChanged('Case dismissed');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to dismiss case');
    } finally {
      setBusy(false);
    }
  };

  const activeCase: PaymentRecoveryCase | undefined = detail?.case;
  const suggestions = detail?.suggestions;
  const selectedStore = suggestions?.stores.find((s) => s.store_code === storeCode);
  const isOpen = activeCase?.status === 'open';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Payment Recovery Case{activeCase ? ` — ₹${activeCase.amount}` : ''}</DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress />
          </Stack>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {!loading && activeCase && (
          <Stack spacing={3}>
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  size="small"
                  label={activeCase.status}
                  sx={{ textTransform: 'capitalize', color: '#fff', bgcolor: STATUS_COLORS[activeCase.status] }}
                />
                <Chip size="small" variant="outlined" label={activeCase.source} />
              </Stack>
              <Typography variant="body2">
                <strong>Customer:</strong> {activeCase.customer_name || '—'} ({activeCase.mobile_no || 'no mobile on file'})
              </Typography>
              <Typography variant="body2">
                <strong>Razorpay payment:</strong> {activeCase.razorpay_payment_id}
              </Typography>
              <Typography variant="body2">
                <strong>Captured:</strong>{' '}
                {activeCase.captured_at ? new Date(activeCase.captured_at).toLocaleString() : '—'}
              </Typography>
              {activeCase.cart_snapshot?.items?.length ? (
                <Stack spacing={0.25}>
                  <Typography variant="body2">
                    <strong>What was paid for</strong> (frozen at payment time — immune to cart changes since):
                  </Typography>
                  {activeCase.cart_snapshot.items.map((item) => (
                    <Typography key={item.p_code} variant="caption" color="text.secondary">
                      {item.quantity} × {item.product_name || item.p_code}
                      {item.total_price != null ? ` — ₹${item.total_price}` : ''}
                    </Typography>
                  ))}
                </Stack>
              ) : (
                suggestions && (
                  <Typography variant="body2" color={suggestions.cart_item_count ? 'text.primary' : 'error'}>
                    <strong>Customer&apos;s cart now:</strong>{' '}
                    {suggestions.cart_item_count
                      ? `${suggestions.cart_item_count} item(s), ₹${suggestions.cart_subtotal}`
                      : 'empty, and no cart snapshot was taken for this payment — cannot restore'}
                  </Typography>
                )
              )}
            </Stack>

            {isOpen && canEdit && (
              <>
                <Divider />
                <Typography variant="subtitle2">Restore order</Typography>

                <FormControl fullWidth size="small">
                  <InputLabel>Store</InputLabel>
                  <Select
                    value={storeCode}
                    label="Store"
                    onChange={(e) => handleStoreChange(e.target.value)}
                  >
                    {suggestions?.stores.map((s) => (
                      <MenuItem key={s.store_code} value={s.store_code}>
                        {s.name} ({s.store_code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" disabled={!selectedStore?.slots.length}>
                  <InputLabel>Delivery slot</InputLabel>
                  <Select
                    value={slotId}
                    label="Delivery slot"
                    onChange={(e) => setSlotId(Number(e.target.value))}
                  >
                    {selectedStore?.slots.map((slot) => (
                      <MenuItem key={slot.iddelivery_slot} value={slot.iddelivery_slot}>
                        {slot.delivery_slot_from} – {slot.delivery_slot_to}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Delivery date"
                  InputLabelProps={{ shrink: true }}
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />

                <FormControl fullWidth size="small">
                  <InputLabel>Address</InputLabel>
                  <Select value={addressId} label="Address" onChange={(e) => setAddressId(e.target.value)}>
                    {suggestions?.addresses.map((a) => (
                      <MenuItem key={a._id} value={a._id}>
                        {a.full_name} — {[a.delivery_addr_line_1, a.delivery_addr_city].filter(Boolean).join(', ')}
                      </MenuItem>
                    ))}
                  </Select>
                  {!suggestions?.addresses.length && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      No saved address matches this mobile number — cannot place a delivery order.
                    </Typography>
                  )}
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Payment mode</InputLabel>
                  <Select
                    value={paymentModeId}
                    label="Payment mode"
                    onChange={(e) => setPaymentModeId(Number(e.target.value))}
                  >
                    {suggestions?.payment_modes.map((m) => (
                      <MenuItem key={m.idpayment_mode} value={m.idpayment_mode}>
                        {m.payment_mode_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Divider />
                <Typography variant="subtitle2">Or, refund / dismiss instead</Typography>
                <TextField
                  fullWidth
                  size="small"
                  label="Reason (required to dismiss, optional for refund)"
                  value={dismissReason}
                  onChange={(e) => setDismissReason(e.target.value)}
                />
              </>
            )}

            {(activeCase.history?.length ?? 0) > 0 && (
              <>
                <Divider />
                <Typography variant="subtitle2">History</Typography>
                <Stack>
                  {activeCase.history!.map((entry, index) => {
                    const isLast = index === activeCase.history!.length - 1;
                    return (
                      <Stack key={`${entry.status}-${entry.changed_at}-${index}`} direction="row" spacing={2}>
                        <Stack alignItems="center" sx={{ pt: 0.5 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: STATUS_COLORS[entry.status] ?? '#9E9E9E',
                              flexShrink: 0,
                            }}
                          />
                          {!isLast && (
                            <Box sx={{ width: '2px', flexGrow: 1, minHeight: 20, bgcolor: 'divider', my: 0.5 }} />
                          )}
                        </Stack>
                        <Box sx={{ pb: isLast ? 0 : 2, flexGrow: 1 }}>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {entry.status}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(entry.changed_at).toLocaleString()} · {describeActor(entry)}
                          </Typography>
                          {entry.note && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontStyle: 'italic' }}>
                              {entry.note}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    );
                  })}
                </Stack>
              </>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {isOpen && canEdit && (
          <>
            <Button color="error" disabled={busy || !dismissReason.trim()} onClick={handleDismiss}>
              Dismiss
            </Button>
            <Button color="warning" variant="outlined" disabled={busy} onClick={handleRefund}>
              Refund
            </Button>
            <Button
              variant="contained"
              disabled={
                busy ||
                !storeCode ||
                !slotId ||
                !deliveryDate ||
                !paymentModeId ||
                !addressId ||
                !(activeCase.cart_snapshot?.items?.length || suggestions?.cart_item_count)
              }
              onClick={handleRestore}
            >
              Restore Order
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
