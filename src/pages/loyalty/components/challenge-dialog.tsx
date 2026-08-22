import type { LoyaltyChallenge, LoyaltyChallengeType } from 'src/types/loyalty';

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

import { createLoyaltyChallenge, updateLoyaltyChallenge } from 'src/services/loyalty';

// ----------------------------------------------------------------------

const TYPES: { value: LoyaltyChallengeType; label: string }[] = [
  { value: 'PURCHASE_COUNT', label: 'Number of orders' },
  { value: 'SPEND_AMOUNT', label: 'Total spend (₹)' },
  { value: 'CATEGORY_COUNT', label: 'Orders across categories (counts orders — see admin notes)' },
  { value: 'FIRST_APP_ORDER', label: 'First order ever' },
];

const toInputDate = (iso?: string | null) => (iso ? iso.slice(0, 10) : '');

type Props = {
  open: boolean;
  challenge: LoyaltyChallenge | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ChallengeDialog({ open, challenge, onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<LoyaltyChallengeType>('PURCHASE_COUNT');
  const [targetValue, setTargetValue] = useState('2');
  const [rewardPoints, setRewardPoints] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && challenge) {
      setName(challenge.name);
      setDescription(challenge.description);
      setType(challenge.type);
      setTargetValue(String(challenge.targetValue));
      setRewardPoints(String(challenge.rewardPoints));
      setValidFrom(toInputDate(challenge.validFrom));
      setValidUntil(toInputDate(challenge.validUntil));
    } else if (open) {
      setName(''); setDescription(''); setType('PURCHASE_COUNT'); setTargetValue('2');
      setRewardPoints(''); setValidFrom(''); setValidUntil('');
    }
    setError('');
  }, [challenge, open]);

  const validate = (): boolean => {
    if (!name.trim()) { setError('Name is required'); return false; }
    if (!targetValue || Number(targetValue) < 1) { setError('Target must be at least 1'); return false; }
    if (!rewardPoints || Number(rewardPoints) <= 0) { setError('Reward points must be greater than 0'); return false; }
    if (!validFrom || !validUntil) { setError('Start and end dates are required'); return false; }
    if (new Date(validUntil) < new Date(validFrom)) { setError('End date must be after start date'); return false; }
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
        type,
        targetValue: Number(targetValue),
        rewardPoints: Number(rewardPoints),
        validFrom: new Date(validFrom).toISOString(),
        validUntil: new Date(validUntil).toISOString(),
        status: challenge?.status ?? ('ACTIVE' as const),
      };
      if (challenge) {
        await updateLoyaltyChallenge(challenge._id, payload);
      } else {
        await createLoyaltyChallenge(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save challenge');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{challenge ? 'Edit Challenge' : 'Create Challenge'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={12}>
            <TextField label="Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} helperText="e.g. Weekend Shopper" />
          </Grid>
          <Grid size={12}>
            <TextField label="Description" fullWidth value={description} onChange={(e) => setDescription(e.target.value)} helperText="Shown to the customer, e.g. Buy 2 products this weekend" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select label="Type" fullWidth value={type} onChange={(e) => setType(e.target.value as LoyaltyChallengeType)}>
              {TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Target" type="number" fullWidth value={targetValue} onChange={(e) => setTargetValue(e.target.value)} disabled={type === 'FIRST_APP_ORDER'} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Reward Points" type="number" fullWidth value={rewardPoints} onChange={(e) => setRewardPoints(e.target.value)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} />
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Start Date" type="date" fullWidth value={validFrom} onChange={(e) => setValidFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="End Date" type="date" fullWidth value={validUntil} onChange={(e) => setValidUntil(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? <CircularProgress size={24} /> : challenge ? 'Save Changes' : 'Create Challenge'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
