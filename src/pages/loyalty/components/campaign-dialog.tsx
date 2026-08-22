import type { LoyaltyCampaign } from 'src/types/loyalty';

import { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { createLoyaltyCampaign, updateLoyaltyCampaign } from 'src/services/loyalty';

// ----------------------------------------------------------------------

const toInputDate = (iso?: string | null) => (iso ? iso.slice(0, 10) : '');

type Props = {
  open: boolean;
  campaign: LoyaltyCampaign | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CampaignDialog({ open, campaign, onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [multiplier, setMultiplier] = useState('2');
  const [minimumOrderValue, setMinimumOrderValue] = useState('0');
  const [maximumBonusPoints, setMaximumBonusPoints] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && campaign) {
      setName(campaign.name);
      setDescription(campaign.description);
      setMultiplier(String(campaign.multiplier));
      setMinimumOrderValue(String(campaign.minimumOrderValue));
      setMaximumBonusPoints(campaign.maximumBonusPoints != null ? String(campaign.maximumBonusPoints) : '');
      setValidFrom(toInputDate(campaign.validFrom));
      setValidUntil(toInputDate(campaign.validUntil));
    } else if (open) {
      setName(''); setDescription(''); setMultiplier('2'); setMinimumOrderValue('0');
      setMaximumBonusPoints(''); setValidFrom(''); setValidUntil('');
    }
    setError('');
  }, [campaign, open]);

  const validate = (): boolean => {
    if (!name.trim()) { setError('Name is required'); return false; }
    if (!multiplier || Number(multiplier) < 1) { setError('Multiplier must be at least 1'); return false; }
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
        multiplier: Number(multiplier),
        minimumOrderValue: Number(minimumOrderValue) || 0,
        applicableProducts: campaign?.applicableProducts ?? [],
        applicableTiers: campaign?.applicableTiers ?? [],
        maximumBonusPoints: maximumBonusPoints ? Number(maximumBonusPoints) : null,
        validFrom: new Date(validFrom).toISOString(),
        validUntil: new Date(validUntil).toISOString(),
        status: campaign?.status ?? ('ACTIVE' as const),
      };
      if (campaign) {
        await updateLoyaltyCampaign(campaign._id, payload);
      } else {
        await createLoyaltyCampaign(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{campaign ? 'Edit Campaign' : 'Create Campaign'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={12}>
            <TextField label="Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} helperText="e.g. Diwali Double Points" />
          </Grid>
          <Grid size={12}>
            <TextField label="Description" fullWidth value={description} onChange={(e) => setDescription(e.target.value)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Multiplier" type="number" fullWidth value={multiplier} onChange={(e) => setMultiplier(e.target.value)} helperText="e.g. 2 = 2x points" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Minimum Order Value (₹)" type="number" fullWidth value={minimumOrderValue} onChange={(e) => setMinimumOrderValue(e.target.value)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Start Date" type="date" fullWidth value={validFrom} onChange={(e) => setValidFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="End Date" type="date" fullWidth value={validUntil} onChange={(e) => setValidUntil(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={12}>
            <TextField label="Maximum Bonus Points" type="number" fullWidth value={maximumBonusPoints} onChange={(e) => setMaximumBonusPoints(e.target.value)} helperText="Blank = uncapped" />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? <CircularProgress size={24} /> : campaign ? 'Save Changes' : 'Create Campaign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
