import type { LoyaltyRule, LoyaltyRuleEvent } from 'src/types/loyalty';

import { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { createLoyaltyRule, updateLoyaltyRule } from 'src/services/loyalty';

// ----------------------------------------------------------------------

const EVENTS: LoyaltyRuleEvent[] = [
  'REGISTRATION', 'FIRST_ORDER', 'ORDER_DELIVERED', 'PRODUCT_REVIEW',
  'PHOTO_REVIEW', 'REFERRAL', 'BIRTHDAY', 'FIRST_APP_ORDER',
];

type Props = {
  open: boolean;
  rule: LoyaltyRule | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function RuleDialog({ open, rule, onClose, onSuccess }: Props) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [event, setEvent] = useState<LoyaltyRuleEvent>('ORDER_DELIVERED');
  const [pointsType, setPointsType] = useState<'FIXED' | 'FIXED_PER_AMOUNT'>('FIXED');
  const [pointsValue, setPointsValue] = useState('');
  const [amountValue, setAmountValue] = useState('100');
  const [minimumOrderValue, setMinimumOrderValue] = useState('0');
  const [pendingPeriodDays, setPendingPeriodDays] = useState('0');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && rule) {
      setCode(rule.code);
      setName(rule.name);
      setEvent(rule.event);
      setPointsType(rule.pointsType);
      setPointsValue(String(rule.pointsValue));
      setAmountValue(String(rule.amountValue));
      setMinimumOrderValue(String(rule.minimumOrderValue));
      setPendingPeriodDays(String(rule.pendingPeriodDays));
    } else if (open) {
      setCode('');
      setName('');
      setEvent('ORDER_DELIVERED');
      setPointsType('FIXED');
      setPointsValue('');
      setAmountValue('100');
      setMinimumOrderValue('0');
      setPendingPeriodDays('0');
    }
    setError('');
  }, [rule, open]);

  const validate = (): boolean => {
    if (!code.trim()) { setError('Code is required'); return false; }
    if (!name.trim()) { setError('Name is required'); return false; }
    if (!pointsValue || Number(pointsValue) <= 0) { setError('Points value must be greater than 0'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      setError('');
      const payload = {
        code: code.trim(),
        name: name.trim(),
        event,
        pointsType,
        pointsValue: Number(pointsValue),
        amountValue: Number(amountValue) || 100,
        multiplier: rule?.multiplier ?? 1,
        minimumOrderValue: Number(minimumOrderValue) || 0,
        maximumPoints: rule?.maximumPoints ?? null,
        eligibleOrderStatuses: rule?.eligibleOrderStatuses ?? ['delivered'],
        pendingPeriodDays: Number(pendingPeriodDays) || 0,
        status: rule?.status ?? ('ACTIVE' as const),
        validFrom: rule?.validFrom ?? null,
        validUntil: rule?.validUntil ?? null,
      };
      if (rule) {
        await updateLoyaltyRule(rule._id, payload);
      } else {
        await createLoyaltyRule(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{rule ? 'Edit Earning Rule' : 'Create Earning Rule'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Code"
              fullWidth
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={!!rule}
              helperText="Unique identifier, e.g. PURCHASE_POINTS"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              label="Event"
              fullWidth
              value={event}
              onChange={(e) => setEvent(e.target.value as LoyaltyRuleEvent)}
            >
              {EVENTS.map((ev) => (
                <MenuItem key={ev} value={ev}>{ev.replace(/_/g, ' ')}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              label="Points Type"
              fullWidth
              value={pointsType}
              onChange={(e) => setPointsType(e.target.value as 'FIXED' | 'FIXED_PER_AMOUNT')}
            >
              <MenuItem value="FIXED">Fixed points</MenuItem>
              <MenuItem value="FIXED_PER_AMOUNT">Points per order amount</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: pointsType === 'FIXED_PER_AMOUNT' ? 6 : 12 }}>
            <TextField
              label="Points"
              type="number"
              fullWidth
              value={pointsValue}
              onChange={(e) => setPointsValue(e.target.value)}
              helperText={pointsType === 'FIXED_PER_AMOUNT' ? 'Points earned per amountValue spent' : 'Flat points awarded'}
            />
          </Grid>
          {pointsType === 'FIXED_PER_AMOUNT' && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Per ₹ Amount"
                type="number"
                fullWidth
                value={amountValue}
                onChange={(e) => setAmountValue(e.target.value)}
                helperText="e.g. 10 points per ₹100"
              />
            </Grid>
          )}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Minimum Order Value"
              type="number"
              fullWidth
              value={minimumOrderValue}
              onChange={(e) => setMinimumOrderValue(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Pending Period (days)"
              type="number"
              fullWidth
              value={pendingPeriodDays}
              onChange={(e) => setPendingPeriodDays(e.target.value)}
              helperText="Days before earned points become redeemable"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? <CircularProgress size={24} /> : rule ? 'Save Changes' : 'Create Rule'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
