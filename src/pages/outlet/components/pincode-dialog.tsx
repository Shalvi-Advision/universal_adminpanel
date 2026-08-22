import type { Pincode, StoreCode, PincodePayload } from 'src/types/api';

import { useState, useEffect } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { getAllStoreCodes } from 'src/services/stores';
import { createPincode, updatePincode } from 'src/services/pincodes';

interface PincodeDialogProps {
  open: boolean;
  pincode: Pincode | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function PincodeDialog({ open, pincode, onClose, onSuccess }: PincodeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [idPincodeMaster, setIdPincodeMaster] = useState<number | ''>('');
  const [pincodeValue, setPincodeValue] = useState('');
  const [isEnabled, setIsEnabled] = useState<'Enabled' | 'Disabled'>('Enabled');
  const [storeCode, setStoreCode] = useState('');
  const [storeCodes, setStoreCodes] = useState<StoreCode[]>([]);

  // Store options for the assignment dropdown — loaded once per dialog open,
  // not per keystroke, since the list rarely changes.
  useEffect(() => {
    if (!open) return;
    getAllStoreCodes()
      .then((response) => setStoreCodes(response.data || []))
      .catch(() => setStoreCodes([]));
  }, [open]);

  // Load data when editing
  useEffect(() => {
    if (pincode) {
      setIdPincodeMaster(pincode.idpincode_master);
      setPincodeValue(pincode.pincode);
      setIsEnabled(pincode.is_enabled);
      setStoreCode(pincode.store_code || '');
    } else {
      // Reset form for create
      setIdPincodeMaster('');
      setPincodeValue('');
      setIsEnabled('Enabled');
      setStoreCode('');
    }
    setError('');
  }, [pincode, open]);

  const validateForm = (): boolean => {
    // Validate Pincode Master ID
    if (idPincodeMaster === '' || idPincodeMaster <= 0) {
      setError('Pincode Master ID is required and must be a positive number');
      return false;
    }

    // Validate pincode format (exactly 6 digits)
    if (!pincodeValue.trim()) {
      setError('Pincode is required');
      return false;
    }

    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pincodeValue.trim())) {
      setError('Pincode must be exactly 6 digits');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    const payload: PincodePayload = {
      idpincode_master: Number(idPincodeMaster),
      pincode: pincodeValue.trim(),
      is_enabled: isEnabled,
      store_code: storeCode || null,
    };

    try {
      if (pincode) {
        await updatePincode(pincode._id, payload);
      } else {
        await createPincode(payload);
      }
      onSuccess();
    } catch (err: any) {
      // Handle unique constraint error
      if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
        setError('This Pincode Master ID or Pincode already exists');
      } else {
        setError(err.message || 'Failed to save pincode');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and limit to 6 characters
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPincodeValue(value);
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or positive numbers only
    if (value === '') {
      setIdPincodeMaster('');
    } else {
      const numValue = parseInt(value, 10);
      if (!Number.isNaN(numValue) && numValue > 0) {
        setIdPincodeMaster(numValue);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{pincode ? 'Edit Pincode' : 'Create Pincode'}</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            fullWidth
            label="Pincode Master ID"
            value={idPincodeMaster}
            onChange={handleIdChange}
            type="number"
            required
            disabled={!!pincode} // Disable editing ID when updating
            helperText={
              pincode
                ? 'ID cannot be changed when editing'
                : 'Unique identifier (positive integer)'
            }
          />

          <TextField
            fullWidth
            label="Pincode"
            value={pincodeValue}
            onChange={handlePincodeChange}
            required
            placeholder="Enter 6-digit pincode"
            helperText={`${pincodeValue.length}/6 digits`}
            slotProps={{
              htmlInput: {
                maxLength: 6,
                pattern: '[0-9]*',
              },
            }}
          />

          <FormControl fullWidth required>
            <InputLabel>Status</InputLabel>
            <Select
              value={isEnabled}
              label="Status"
              onChange={(e) => setIsEnabled(e.target.value as 'Enabled' | 'Disabled')}
            >
              <MenuItem value="Enabled">Enabled</MenuItem>
              <MenuItem value="Disabled">Disabled</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Assign Store</InputLabel>
            <Select
              value={storeCode}
              label="Assign Store"
              onChange={(e) => setStoreCode(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">
                <em>Not assigned</em>
              </MenuItem>
              {storeCodes.map((store) => (
                <MenuItem key={store.store_code} value={store.store_code}>
                  {store.store_name} ({store.store_code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : pincode ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
