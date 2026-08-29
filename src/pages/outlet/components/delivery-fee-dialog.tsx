import type { Store, DeliveryDistanceSlab } from 'src/types/api';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { updateStore } from 'src/services/stores';

import { Iconify } from 'src/components/iconify';

interface DeliveryFeeDialogProps {
  open: boolean;
  store: Store | null;
  onClose: () => void;
  onSuccess: () => void;
}

const defaultSlabs = (): DeliveryDistanceSlab[] => [
  { from_km: 0, to_km: 5, per_km_charge: 10 },
  { from_km: 5, to_km: 10, per_km_charge: 10 },
  { from_km: 10, to_km: null, per_km_charge: 12 },
];

const emptySlab = (): DeliveryDistanceSlab => ({ from_km: 0, to_km: null, per_km_charge: 0 });

export function DeliveryFeeDialog({ open, store, onClose, onSuccess }: DeliveryFeeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(6000);
  const [freeDeliveryRadiusKm, setFreeDeliveryRadiusKm] = useState(0);
  const [maxDeliveryRadiusKm, setMaxDeliveryRadiusKm] = useState(50);
  const [baseCharge, setBaseCharge] = useState(30);
  const [baseDistanceKm, setBaseDistanceKm] = useState(3);
  const [perKmCharge, setPerKmCharge] = useState(5);
  const [slabs, setSlabs] = useState<DeliveryDistanceSlab[]>([]);
  const [handlingFee, setHandlingFee] = useState(0);
  const [packageFee, setPackageFee] = useState(0);
  const [packingFeeEnabledForPickup, setPackingFeeEnabledForPickup] = useState(false);

  useEffect(() => {
    if (!store) return;

    setFreeDeliveryThreshold(store.free_delivery_threshold ?? 6000);
    setFreeDeliveryRadiusKm(store.free_delivery_radius_km ?? 0);
    setMaxDeliveryRadiusKm(store.max_delivery_radius_km ?? 50);
    setBaseCharge(store.delivery_base_charge ?? 30);
    setBaseDistanceKm(store.delivery_base_distance_km ?? 3);
    setPerKmCharge(store.delivery_per_km_charge ?? 5);
    setSlabs(
      store.delivery_distance_slabs?.length
        ? store.delivery_distance_slabs.map((slab) => ({
            from_km: slab.from_km,
            to_km: slab.to_km ?? null,
            per_km_charge: slab.per_km_charge,
          }))
        : []
    );
    setHandlingFee(store.handling_fee ?? 0);
    setPackageFee(store.package_fee ?? 0);
    setPackingFeeEnabledForPickup(store.packing_fee_enabled_for_pickup ?? false);
    setError('');
  }, [store, open]);

  const handleSlabChange = (index: number, field: keyof DeliveryDistanceSlab, value: string) => {
    setSlabs((prev) =>
      prev.map((slab, i) => {
        if (i !== index) return slab;
        if (field === 'to_km') {
          return { ...slab, to_km: value === '' ? null : Number(value) };
        }
        return { ...slab, [field]: Number(value) };
      })
    );
  };

  const handleAddSlab = () => {
    setSlabs((prev) => [...prev, emptySlab()]);
  };

  const handleRemoveSlab = (index: number) => {
    setSlabs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUseTemplate = () => {
    setSlabs(defaultSlabs());
  };

  const handleSubmit = async () => {
    if (!store) return;

    setLoading(true);
    setError('');

    try {
      await updateStore(store._id, {
        pincode: store.pincode,
        mobile_outlet_name: store.mobile_outlet_name,
        store_code: store.store_code,
        is_enabled: store.is_enabled,
        store_address: store.store_address,
        min_order_amount: store.min_order_amount,
        store_open_time: store.store_open_time,
        store_delivery_time: store.store_delivery_time,
        store_offer_name: store.store_offer_name,
        latitude: store.latitude,
        longitude: store.longitude,
        home_delivery: store.home_delivery,
        self_pickup: store.self_pickup,
        store_message: store.store_message,
        contact_number: store.contact_number,
        email: store.email,
        whatsappnumber: store.whatsappnumber,
        free_delivery_threshold: freeDeliveryThreshold,
        free_delivery_radius_km: freeDeliveryRadiusKm,
        max_delivery_radius_km: maxDeliveryRadiusKm,
        delivery_base_charge: baseCharge,
        delivery_base_distance_km: baseDistanceKm,
        delivery_per_km_charge: perKmCharge,
        delivery_distance_slabs: slabs,
        handling_fee: handlingFee,
        package_fee: packageFee,
        packing_fee_enabled_for_pickup: packingFeeEnabledForPickup,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save delivery fee settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Delivery Fees — {store?.mobile_outlet_name} ({store?.store_code})
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              Free delivery rules
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Free above order ₹"
                  value={freeDeliveryThreshold}
                  onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Free within radius (km)"
                  value={freeDeliveryRadiusKm}
                  onChange={(e) => setFreeDeliveryRadiusKm(Number(e.target.value))}
                  helperText="0 = disabled"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max delivery radius (km)"
                  value={maxDeliveryRadiusKm}
                  onChange={(e) => setMaxDeliveryRadiusKm(Number(e.target.value))}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              Base delivery charge
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Base charge ₹"
                  value={baseCharge}
                  onChange={(e) => setBaseCharge(Number(e.target.value))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Base distance (km)"
                  value={baseDistanceKm}
                  onChange={(e) => setBaseDistanceKm(Number(e.target.value))}
                  helperText="Distance included in base charge"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Fallback ₹/km"
                  value={perKmCharge}
                  onChange={(e) => setPerKmCharge(Number(e.target.value))}
                  helperText="Used when no slabs or slab gaps"
                />
              </Grid>
            </Grid>
          </Box>

          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Box>
                <Typography variant="subtitle2">Distance slabs (₹ per km)</Typography>
                <Typography variant="caption" color="text.secondary">
                  Applied to distance beyond base distance. Leave &quot;To km&quot; empty for unlimited.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" onClick={handleUseTemplate}>
                  Example template
                </Button>
                <Button size="small" variant="contained" onClick={handleAddSlab} startIcon={<Iconify icon="mingcute:add-line" />}>
                  Add slab
                </Button>
              </Stack>
            </Stack>

            {slabs.length === 0 ? (
              <Alert severity="info">
                No slabs configured — flat ₹{perKmCharge}/km will be used beyond base distance.
              </Alert>
            ) : (
              <Stack spacing={1.5}>
                {slabs.map((slab, index) => (
                  <Grid container spacing={1.5} key={`slab-${index}`} alignItems="center">
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="From km"
                        value={slab.from_km}
                        onChange={(e) => handleSlabChange(index, 'from_km', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="To km"
                        value={slab.to_km ?? ''}
                        onChange={(e) => handleSlabChange(index, 'to_km', e.target.value)}
                        placeholder="∞"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="₹ per km"
                        value={slab.per_km_charge}
                        onChange={(e) => handleSlabChange(index, 'per_km_charge', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 2 }}>
                      <IconButton color="error" onClick={() => handleRemoveSlab(index)}>
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
              </Stack>
            )}
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              Additional fees (always added for delivery orders)
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Handling fee ₹"
                  value={handlingFee}
                  onChange={(e) => setHandlingFee(Number(e.target.value))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Package fee ₹"
                  value={packageFee}
                  onChange={(e) => setPackageFee(Number(e.target.value))}
                />
              </Grid>
            </Grid>
            <FormControlLabel
              sx={{ mt: 1 }}
              control={
                <Switch
                  checked={packingFeeEnabledForPickup}
                  onChange={(e) => setPackingFeeEnabledForPickup(e.target.checked)}
                />
              }
              label="Charge packing fee on self-pickup orders"
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 1.5 }}>
              When off, self-pickup orders are charged only the cart subtotal — no delivery,
              handling, or packing fee. When on, the &quot;Package fee ₹&quot; above is charged
              as a packing fee.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading || !store}>
          {loading ? <CircularProgress size={24} /> : 'Save fees'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
