import type { Store } from 'src/types/api';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { getAllPincodes } from 'src/services/pincodes';

interface StorePincodesDialogProps {
  open: boolean;
  store: Store | null;
  onClose: () => void;
}

// A store's mapped pincodes are just its pincodes-with-this-store_code — no
// dedicated endpoint needed, this reuses the same Pincodes list the Outlet >
// Pincodes page already calls, filtered server-side by storeCode.
export function StorePincodesDialog({ open, store, onClose }: StorePincodesDialogProps) {
  const [loading, setLoading] = useState(false);
  const [pincodes, setPincodes] = useState<string[]>([]);

  useEffect(() => {
    if (!open || !store) return;
    setLoading(true);
    getAllPincodes({ storeCode: store.store_code, limit: 500 })
      .then((response) => setPincodes(response.data.map((p) => p.pincode)))
      .catch(() => setPincodes([]))
      .finally(() => setLoading(false));
  }, [open, store]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Pincodes served by {store?.mobile_outlet_name}
        {store && (
          <Chip label={store.store_code} size="small" variant="outlined" sx={{ ml: 1 }} />
        )}
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : pincodes.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No pincodes are assigned to this store yet. Assign them from Outlet &gt; Pincodes.
          </Typography>
        ) : (
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ py: 1 }}>
            {pincodes.map((pincode) => (
              <Chip key={pincode} label={pincode} size="small" />
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
