import { useState } from 'react';

import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { adjustLoyaltyPoints } from 'src/services/loyalty';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  mobile: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AdjustPointsDialog({ open, mobile, onClose, onSuccess }: Props) {
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    setPoints(''); setReason(''); setError('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!mobile) return;
    const value = Number(points);
    if (!points || !Number.isFinite(value) || value === 0) {
      setError('Enter a non-zero number of points (negative to deduct)');
      return;
    }
    if (!reason.trim()) {
      setError('A reason is required for every manual adjustment');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await adjustLoyaltyPoints(mobile, value, reason.trim());
      setPoints(''); setReason('');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to adjust points');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Adjust Points {mobile ? `— ${mobile}` : ''}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={12}>
            <TextField
              label="Points"
              type="number"
              fullWidth
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              helperText="Positive to credit, negative to deduct"
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label="Reason"
              fullWidth
              multiline
              minRows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              helperText="Required — recorded in the audit log"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? <CircularProgress size={24} /> : 'Apply Adjustment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
