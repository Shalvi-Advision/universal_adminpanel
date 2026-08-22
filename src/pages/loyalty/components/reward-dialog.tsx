import type { LoyaltyReward, LoyaltyRewardType } from 'src/types/loyalty';

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

import { createLoyaltyReward, updateLoyaltyReward } from 'src/services/loyalty';

// ----------------------------------------------------------------------

const TYPES: { value: LoyaltyRewardType; label: string }[] = [
  { value: 'FIXED_DISCOUNT', label: 'Fixed Discount (₹)' },
  { value: 'PERCENTAGE_DISCOUNT', label: 'Percentage Discount (%)' },
  { value: 'FREE_SHIPPING', label: 'Free Shipping' },
  { value: 'CASHBACK', label: 'Cashback (₹) — treated as a fixed discount voucher' },
  { value: 'FREE_PRODUCT', label: 'Free Product — fulfilled manually, not checkout-applicable' },
  { value: 'SPECIAL_OFFER', label: 'Special Offer — fulfilled manually, not checkout-applicable' },
];

type Props = {
  open: boolean;
  reward: LoyaltyReward | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function RewardDialog({ open, reward, onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<LoyaltyRewardType>('FIXED_DISCOUNT');
  const [pointsRequired, setPointsRequired] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [minimumOrderValue, setMinimumOrderValue] = useState('0');
  const [maximumDiscount, setMaximumDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [perUserLimit, setPerUserLimit] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && reward) {
      setName(reward.name);
      setDescription(reward.description);
      setType(reward.type);
      setPointsRequired(String(reward.pointsRequired));
      setDiscountValue(String(reward.discountValue));
      setMinimumOrderValue(String(reward.minimumOrderValue));
      setMaximumDiscount(reward.maximumDiscount != null ? String(reward.maximumDiscount) : '');
      setUsageLimit(reward.usageLimit != null ? String(reward.usageLimit) : '');
      setPerUserLimit(reward.perUserLimit != null ? String(reward.perUserLimit) : '');
    } else if (open) {
      setName(''); setDescription(''); setType('FIXED_DISCOUNT'); setPointsRequired('');
      setDiscountValue(''); setMinimumOrderValue('0'); setMaximumDiscount(''); setUsageLimit(''); setPerUserLimit('');
    }
    setError('');
  }, [reward, open]);

  const validate = (): boolean => {
    if (!name.trim()) { setError('Name is required'); return false; }
    if (!pointsRequired || Number(pointsRequired) <= 0) { setError('Points required must be greater than 0'); return false; }
    if (type !== 'FREE_SHIPPING' && (!discountValue || Number(discountValue) < 0)) {
      setError('Discount value is required for this reward type');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      setError('');
      const payload = {
        name: name.trim(),
        description: description.trim(),
        image: reward?.image ?? null,
        type,
        pointsRequired: Number(pointsRequired),
        discountValue: Number(discountValue) || 0,
        minimumOrderValue: Number(minimumOrderValue) || 0,
        maximumDiscount: maximumDiscount ? Number(maximumDiscount) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        perUserLimit: perUserLimit ? Number(perUserLimit) : null,
        applicableTiers: reward?.applicableTiers ?? [],
        validFrom: reward?.validFrom ?? null,
        validUntil: reward?.validUntil ?? null,
        status: reward?.status ?? ('ACTIVE' as const),
      };
      if (reward) {
        await updateLoyaltyReward(reward._id, payload);
      } else {
        await createLoyaltyReward(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save reward');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{reward ? 'Edit Reward' : 'Create Reward'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} helperText="e.g. ₹100 OFF" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select label="Type" fullWidth value={type} onChange={(e) => setType(e.target.value as LoyaltyRewardType)}>
              {TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={12}>
            <TextField label="Description" fullWidth value={description} onChange={(e) => setDescription(e.target.value)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Points Required" type="number" fullWidth value={pointsRequired} onChange={(e) => setPointsRequired(e.target.value)} />
          </Grid>
          {type !== 'FREE_SHIPPING' && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label={type === 'PERCENTAGE_DISCOUNT' ? 'Discount (%)' : 'Discount Value (₹)'}
                type="number"
                fullWidth
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Minimum Order Value (₹)" type="number" fullWidth value={minimumOrderValue} onChange={(e) => setMinimumOrderValue(e.target.value)} />
          </Grid>
          {type === 'PERCENTAGE_DISCOUNT' && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Maximum Discount (₹)" type="number" fullWidth value={maximumDiscount} onChange={(e) => setMaximumDiscount(e.target.value)} helperText="Caps the % discount" />
            </Grid>
          )}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Total Usage Limit" type="number" fullWidth value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} helperText="Blank = unlimited" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Per-Customer Limit" type="number" fullWidth value={perUserLimit} onChange={(e) => setPerUserLimit(e.target.value)} helperText="Blank = unlimited" />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? <CircularProgress size={24} /> : reward ? 'Save Changes' : 'Create Reward'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
