import type { Store, StorePayload } from 'src/types/api';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { createStore, updateStore } from 'src/services/stores';

interface StoreDialogProps {
  open: boolean;
  store: Store | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function StoreDialog({ open, store, onClose, onSuccess }: StoreDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state - Basic Information
  const [storeName, setStoreName] = useState('');
  const [storeCode, setStoreCode] = useState('');
  const [pincode, setPincode] = useState('');
  const [storeAddress, setStoreAddress] = useState('');

  // Form state - Contact Information
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Form state - Store Settings
  const [isEnabled, setIsEnabled] = useState<'Enabled' | 'Disabled'>('Enabled');
  const [minOrderAmount, setMinOrderAmount] = useState<number>(500);
  const [storeOpenTime, setStoreOpenTime] = useState('9 am to 10 pm');
  const [storeDeliveryTime, setStoreDeliveryTime] = useState('Day + 1 day');
  // Which day delivery slots start being offered on, relative to today -
  // 0 = same day, 1 = next day only, 2 = day after tomorrow, etc.
  const [deliveryStartOffsetDays, setDeliveryStartOffsetDays] = useState(0);
  const [storeOfferName, setStoreOfferName] = useState('');
  const [storeMessage, setStoreMessage] = useState('');

  // Form state - Location
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Form state - Delivery Options
  const [homeDelivery, setHomeDelivery] = useState<'yes' | 'no'>('yes');
  const [selfPickup, setSelfPickup] = useState<'yes' | 'no'>('no');

  // Load data when editing
  useEffect(() => {
    if (store) {
      setStoreName(store.mobile_outlet_name);
      setStoreCode(store.store_code);
      setPincode(store.pincode);
      setStoreAddress(store.store_address);
      setContactNumber(store.contact_number);
      setEmail(store.email);
      setWhatsappNumber(store.whatsappnumber || '');
      setIsEnabled(store.is_enabled);
      setMinOrderAmount(store.min_order_amount);
      setStoreOpenTime(store.store_open_time);
      setStoreDeliveryTime(store.store_delivery_time);
      setDeliveryStartOffsetDays(store.delivery_start_offset_days ?? 0);
      setStoreOfferName(store.store_offer_name || '');
      setStoreMessage(store.store_message || '');
      setLatitude(store.latitude || '');
      setLongitude(store.longitude || '');
      setHomeDelivery(store.home_delivery);
      setSelfPickup(store.self_pickup);
    } else {
      // Reset form for create
      setStoreName('');
      setStoreCode('');
      setPincode('');
      setStoreAddress('');
      setContactNumber('');
      setEmail('');
      setWhatsappNumber('');
      setIsEnabled('Enabled');
      setMinOrderAmount(500);
      setStoreOpenTime('9 am to 10 pm');
      setStoreDeliveryTime('Day + 1 day');
      setDeliveryStartOffsetDays(0);
      setStoreOfferName('');
      setStoreMessage('');
      setLatitude('');
      setLongitude('');
      setHomeDelivery('yes');
      setSelfPickup('no');
    }
    setError('');
  }, [store, open]);

  const validateForm = (): boolean => {
    // Validate required fields
    if (!storeName.trim()) {
      setError('Store Name is required');
      return false;
    }

    if (!storeCode.trim()) {
      setError('Store Code is required');
      return false;
    }

    // Pincode is legacy on Store now — which pincodes a store serves is
    // assigned from Outlet > Pincodes (many pincodes -> one store), not set
    // here. Still validated as a real 6-digit code when one is entered, but
    // no longer required to create or save a store.
    if (pincode.trim() && !/^\d{6}$/.test(pincode.trim())) {
      setError('Pincode must be exactly 6 digits');
      return false;
    }

    if (!storeAddress.trim()) {
      setError('Store Address is required');
      return false;
    }

    if (!contactNumber.trim()) {
      setError('Contact Number is required');
      return false;
    }

    // Validate email format
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    const payload: StorePayload = {
      mobile_outlet_name: storeName.trim(),
      store_code: storeCode.trim().toUpperCase(),
      pincode: pincode.trim() || undefined,
      store_address: storeAddress.trim(),
      contact_number: contactNumber.trim(),
      email: email.trim(),
      whatsappnumber: whatsappNumber.trim() || undefined,
      is_enabled: isEnabled,
      min_order_amount: minOrderAmount,
      store_open_time: storeOpenTime.trim(),
      store_delivery_time: storeDeliveryTime.trim(),
      delivery_start_offset_days: deliveryStartOffsetDays,
      store_offer_name: storeOfferName.trim() || undefined,
      store_message: storeMessage.trim() || undefined,
      latitude: latitude.trim() || undefined,
      longitude: longitude.trim() || undefined,
      home_delivery: homeDelivery,
      self_pickup: selfPickup,
    };

    try {
      if (store) {
        await updateStore(store._id, payload);
      } else {
        await createStore(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save store');
    } finally {
      setLoading(false);
    }
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and limit to 6 characters
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPincode(value);
  };

  const handleStoreCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-uppercase store code
    setStoreCode(e.target.value.toUpperCase());
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{store ? 'Edit Store' : 'Create Store'}</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Basic Information */}
          <Box>
            <InputLabel sx={{ mb: 1, fontWeight: 600 }}>Basic Information</InputLabel>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Store Name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                placeholder="e.g., Shivaji Chowk, Ambernath (E)"
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Store Code"
                    value={storeCode}
                    onChange={handleStoreCodeChange}
                    required
                    placeholder="e.g., AME"
                    helperText="Will be auto-converted to uppercase"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Pincode (legacy, optional)"
                    value={pincode}
                    onChange={handlePincodeChange}
                    placeholder="Enter 6-digit pincode"
                    helperText="Assign the pincodes this store serves from Outlet > Pincodes instead"
                    slotProps={{
                      htmlInput: {
                        maxLength: 6,
                        pattern: '[0-9]*',
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Store Address"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                required
                multiline
                rows={3}
                placeholder="Enter complete store address"
              />
            </Stack>
          </Box>

          {/* Contact Information */}
          <Box>
            <InputLabel sx={{ mb: 1, fontWeight: 600 }}>Contact Information</InputLabel>
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Contact Number"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    required
                    placeholder="e.g., 9356941532"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="WhatsApp Number"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="Optional"
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                type="email"
                placeholder="e.g., support@patelrpl.net"
              />
            </Stack>
          </Box>

          {/* Store Settings */}
          <Box>
            <InputLabel sx={{ mb: 1, fontWeight: 600 }}>Store Settings</InputLabel>
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
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
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Minimum Order Amount"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                    type="number"
                    required
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Store Open Time"
                    value={storeOpenTime}
                    onChange={(e) => setStoreOpenTime(e.target.value)}
                    placeholder="e.g., 9 am to 10 pm"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Store Delivery Time"
                    value={storeDeliveryTime}
                    onChange={(e) => setStoreDeliveryTime(e.target.value)}
                    placeholder="e.g., Day + 1 day"
                    helperText="Display text only — set the actual rule below"
                  />
                </Grid>
              </Grid>

              <FormControl fullWidth>
                <InputLabel>Delivery Starts After</InputLabel>
                <Select
                  value={deliveryStartOffsetDays}
                  label="Delivery Starts After"
                  onChange={(e) => setDeliveryStartOffsetDays(Number(e.target.value))}
                >
                  <MenuItem value={0}>Same day (Today)</MenuItem>
                  <MenuItem value={1}>Next day only (Tomorrow)</MenuItem>
                  <MenuItem value={2}>2 days from now</MenuItem>
                  <MenuItem value={3}>3 days from now</MenuItem>
                  <MenuItem value={4}>4 days from now</MenuItem>
                  <MenuItem value={5}>5 days from now</MenuItem>
                  <MenuItem value={6}>6 days from now</MenuItem>
                  <MenuItem value={7}>7 days from now</MenuItem>
                </Select>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.5 }}>
                  Which day the checkout delivery-date picker starts from for this store.
                </Typography>
              </FormControl>

              <TextField
                fullWidth
                label="Store Offer Name"
                value={storeOfferName}
                onChange={(e) => setStoreOfferName(e.target.value)}
                placeholder="e.g., Upto 50% Off"
              />

              <TextField
                fullWidth
                label="Store Message"
                value={storeMessage}
                onChange={(e) => setStoreMessage(e.target.value)}
                multiline
                rows={2}
                placeholder="e.g., We are not accepting any Online Order, sorry for inconvenience"
              />
            </Stack>
          </Box>

          {/* Location */}
          <Box>
            <InputLabel sx={{ mb: 1, fontWeight: 600 }}>Location (Optional)</InputLabel>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g., 19.183818659251685"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g., 73.2199407558218"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Delivery Options */}
          <Box>
            <InputLabel sx={{ mb: 1, fontWeight: 600 }}>Delivery Options</InputLabel>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Home Delivery</InputLabel>
                  <Select
                    value={homeDelivery}
                    label="Home Delivery"
                    onChange={(e) => setHomeDelivery(e.target.value as 'yes' | 'no')}
                  >
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Self Pickup</InputLabel>
                  <Select
                    value={selfPickup}
                    label="Self Pickup"
                    onChange={(e) => setSelfPickup(e.target.value as 'yes' | 'no')}
                  >
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : store ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
