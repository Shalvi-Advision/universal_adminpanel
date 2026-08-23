import type { LoyaltyTier } from 'src/types/loyalty';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { createLoyaltyTier, updateLoyaltyTier } from 'src/services/loyalty';

import ColorField from './color-field';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  tier: LoyaltyTier | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function TierDialog({ open, tier, onClose, onSuccess }: Props) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [minimumSpend, setMinimumSpend] = useState('0');
  const [maximumSpend, setMaximumSpend] = useState('');
  const [pointMultiplier, setPointMultiplier] = useState('1');
  const [rank, setRank] = useState('1');
  const [cardPrimaryColor, setCardPrimaryColor] = useState('#1A1A1A');
  const [cardAccentColor, setCardAccentColor] = useState('#D4AF37');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && tier) {
      setCode(tier.code);
      setName(tier.name);
      setMinimumSpend(String(tier.minimumSpend));
      setMaximumSpend(tier.maximumSpend != null ? String(tier.maximumSpend) : '');
      setPointMultiplier(String(tier.pointMultiplier));
      setRank(String(tier.rank));
      setCardPrimaryColor(tier.cardPrimaryColor || '#1A1A1A');
      setCardAccentColor(tier.cardAccentColor || '#D4AF37');
    } else if (open) {
      setCode(''); setName(''); setMinimumSpend('0'); setMaximumSpend(''); setPointMultiplier('1'); setRank('1');
      setCardPrimaryColor('#1A1A1A'); setCardAccentColor('#D4AF37');
    }
    setError('');
  }, [tier, open]);

  const validate = (): boolean => {
    if (!code.trim()) { setError('Code is required'); return false; }
    if (!name.trim()) { setError('Name is required'); return false; }
    if (!pointMultiplier || Number(pointMultiplier) < 1) { setError('Point multiplier must be at least 1'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      setError('');
      const payload = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        minimumSpend: Number(minimumSpend) || 0,
        maximumSpend: maximumSpend ? Number(maximumSpend) : null,
        pointMultiplier: Number(pointMultiplier),
        rank: Number(rank) || 1,
        benefits: tier?.benefits ?? [{ type: 'POINT_MULTIPLIER', value: Number(pointMultiplier) }],
        status: tier?.status ?? ('ACTIVE' as const),
        cardPrimaryColor: cardPrimaryColor || '#1A1A1A',
        cardAccentColor: cardAccentColor || '#D4AF37',
      };
      if (tier) {
        await updateLoyaltyTier(tier._id, payload);
      } else {
        await createLoyaltyTier(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save tier');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{tier ? 'Edit Tier' : 'Create Tier'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Code" fullWidth value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} disabled={!!tier} helperText="e.g. GOLD" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Minimum Spend (₹)" type="number" fullWidth value={minimumSpend} onChange={(e) => setMinimumSpend(e.target.value)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Maximum Spend (₹)" type="number" fullWidth value={maximumSpend} onChange={(e) => setMaximumSpend(e.target.value)} helperText="Leave blank for no ceiling (top tier)" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Point Multiplier" type="number" fullWidth value={pointMultiplier} onChange={(e) => setPointMultiplier(e.target.value)} helperText="e.g. 1.5 = 1.5x points" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Rank" type="number" fullWidth value={rank} onChange={(e) => setRank(e.target.value)} helperText="Ordering, lowest = base tier" />
          </Grid>

          <Grid size={12}>
            <Typography variant="subtitle2" sx={{ mt: 1 }}>Loyalty Card Colors</Typography>
            <Typography variant="caption" color="text.secondary">
              How this tier&apos;s membership card looks in the app
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <ColorField label="Primary Color" hint="Card background" value={cardPrimaryColor} onChange={setCardPrimaryColor} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <ColorField label="Accent Color" hint="Stripe, tier name, icons" value={cardAccentColor} onChange={setCardAccentColor} />
          </Grid>
          <Grid size={12}>
            <Box
              sx={{
                borderRadius: 2,
                p: 2,
                background: `linear-gradient(135deg, ${cardPrimaryColor} 0%, ${cardPrimaryColor} 60%, ${cardAccentColor} 150%)`,
                color: cardAccentColor,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
              }}
            >
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Card preview</Typography>
              <Typography variant="subtitle2" sx={{ color: cardAccentColor, fontWeight: 700 }}>
                {(name || 'TIER').toUpperCase()}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? <CircularProgress size={24} /> : tier ? 'Save Changes' : 'Create Tier'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
