import type { Offer, Product, DealProduct, OfferPayload } from 'src/types/api';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { getStoreCodes } from 'src/services/store-codes';
import { getProductsByStore } from 'src/services/products';
import { createOffer, updateOffer } from 'src/services/offers';
import { useStoreCode } from 'src/contexts/store-code-context';

import { Iconify } from 'src/components/iconify';

interface OfferDialogProps {
  open: boolean;
  offer: Offer | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function OfferDialog({ open, offer, onClose, onSuccess }: OfferDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Common fields
  const [offerType, setOfferType] = useState<'cart_discount' | 'product_deal'>('cart_discount');
  const [title, setTitle] = useState('');
  const [minCartValue, setMinCartValue] = useState<number | ''>('');
  const [storeCodes, setStoreCodes] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [priority, setPriority] = useState<number | ''>(0);
  const [description, setDescription] = useState('');

  // Cart discount fields
  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>('flat');
  const [discountAmount, setDiscountAmount] = useState<number | ''>('');
  const [maxDiscount, setMaxDiscount] = useState<number | ''>('');

  // Product deal fields
  const [dealProducts, setDealProducts] = useState<DealProduct[]>([]);

  // Store codes for multi-select
  const { storeCode: contextStoreCode } = useStoreCode();
  const [availableStoreCodes, setAvailableStoreCodes] = useState<string[]>([]);

  useEffect(() => {
    getStoreCodes().then((res) => {
      if (res.success) {
        setAvailableStoreCodes((res.data as any).map((s: any) => s.store_code));
      }
    }).catch(() => {});
  }, []);

  // Product search for autocomplete
  const [productOptions, setProductOptions] = useState<Product[]>([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);

  const searchProducts = useCallback(async (query: string) => {
    const sc = storeCodes[0] || contextStoreCode;
    if (!sc) return;
    try {
      setProductSearchLoading(true);
      const response = await getProductsByStore({ store_code: sc, search: query, limit: 20 });
      if (response.success) {
        setProductOptions(response.data);
      }
    } catch {
      // Silently fail search
    } finally {
      setProductSearchLoading(false);
    }
  }, [storeCodes, contextStoreCode]);

  const handleProductSelect = (product: Product | null) => {
    if (!product) return;
    // Check if already added
    if (dealProducts.some(dp => dp.p_code === product.p_code)) return;
    setDealProducts([...dealProducts, {
      p_code: product.p_code,
      product_name: product.product_name,
      deal_price: 0,
      original_price: product.our_price,
      pcode_img: product.pcode_img || '',
      max_quantity: 1,
    }]);
  };

  useEffect(() => {
    if (offer) {
      setOfferType(offer.offer_type || 'cart_discount');
      setTitle(offer.title);
      setMinCartValue(offer.min_cart_value);
      setStoreCodes(offer.store_codes?.length ? [...offer.store_codes] : []);
      setIsActive(offer.is_active);
      setValidFrom(offer.valid_from ? offer.valid_from.slice(0, 10) : '');
      setValidUntil(offer.valid_until ? offer.valid_until.slice(0, 10) : '');
      setPriority(offer.priority);
      setDescription(offer.description ?? '');
      setDiscountType(offer.discount_type);
      setDiscountAmount(offer.discount_amount);
      setMaxDiscount(offer.max_discount ?? '');
      setDealProducts(offer.deal_products?.length ? [...offer.deal_products] : []);
    } else {
      setOfferType('cart_discount');
      setTitle('');
      setMinCartValue('');
      setStoreCodes(contextStoreCode ? [contextStoreCode] : []);
      setIsActive(true);
      setValidFrom(new Date().toISOString().slice(0, 10));
      setValidUntil('');
      setPriority(0);
      setDescription('');
      setDiscountType('flat');
      setDiscountAmount('');
      setMaxDiscount('');
      setDealProducts([]);
    }
    setError('');
  }, [offer, open, contextStoreCode]);

  const removeDealProduct = (index: number) => {
    setDealProducts(dealProducts.filter((_, i) => i !== index));
  };

  const updateDealProduct = (index: number, field: keyof DealProduct, value: any) => {
    const updated = [...dealProducts];
    updated[index] = { ...updated[index], [field]: value };
    setDealProducts(updated);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    if (minCartValue === '' || Number(minCartValue) <= 0) {
      setError('Minimum cart value must be a positive number');
      return false;
    }

    if (offerType === 'cart_discount') {
      if (discountAmount === '' || Number(discountAmount) <= 0) {
        setError('Discount amount must be a positive number');
        return false;
      }
      if (discountType === 'percentage' && Number(discountAmount) > 100) {
        setError('Percentage discount must be between 0 and 100');
        return false;
      }
    } else {
      if (dealProducts.length === 0) {
        setError('At least one deal product is required');
        return false;
      }
      for (const dp of dealProducts) {
        if (!dp.p_code.trim() || !dp.product_name.trim()) {
          setError('Product code and name are required for all deal products');
          return false;
        }
        if (dp.deal_price < 0 || dp.original_price <= 0) {
          setError('Invalid prices for deal products');
          return false;
        }
        if (dp.deal_price >= dp.original_price) {
          setError('Deal price must be less than original price');
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    const payload: OfferPayload = {
      offer_type: offerType,
      title: title.trim(),
      min_cart_value: Number(minCartValue),
      is_active: isActive,
      priority: Number(priority) || 0,
    };

    if (offerType === 'cart_discount') {
      payload.discount_amount = Number(discountAmount);
      payload.discount_type = discountType;
      if (discountType === 'percentage' && maxDiscount !== '') {
        payload.max_discount = Number(maxDiscount);
      }
      payload.deal_products = [];
    } else {
      payload.discount_amount = 0;
      payload.discount_type = 'flat';
      payload.deal_products = dealProducts;
    }

    if (storeCodes.length > 0) payload.store_codes = storeCodes;
    if (validFrom) payload.valid_from = validFrom;
    if (validUntil) payload.valid_until = validUntil;
    if (description.trim()) payload.description = description.trim();

    try {
      if (offer) {
        await updateOffer(offer._id, payload);
      } else {
        await createOffer(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save offer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth={offerType === 'product_deal' ? 'md' : 'sm'} fullWidth>
      <DialogTitle>{offer ? 'Edit Offer' : 'Create Offer'}</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <FormControl fullWidth required>
            <InputLabel>Offer Type</InputLabel>
            <Select
              value={offerType}
              label="Offer Type"
              onChange={(e) => setOfferType(e.target.value as 'cart_discount' | 'product_deal')}
            >
              <MenuItem value="cart_discount">Cart Discount</MenuItem>
              <MenuItem value="product_deal">Product Deal (Steal Deal)</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <TextField
            fullWidth
            label="Min Cart Value (₹)"
            value={minCartValue}
            onChange={(e) => {
              const val = e.target.value;
              setMinCartValue(val === '' ? '' : Number(val));
            }}
            type="number"
            required
            helperText="Cart must reach this value to unlock the offer"
          />

          {/* Cart Discount specific fields */}
          {offerType === 'cart_discount' && (
            <>
              <FormControl fullWidth required>
                <InputLabel>Discount Type</InputLabel>
                <Select
                  value={discountType}
                  label="Discount Type"
                  onChange={(e) => setDiscountType(e.target.value as 'flat' | 'percentage')}
                >
                  <MenuItem value="flat">Flat (₹)</MenuItem>
                  <MenuItem value="percentage">Percentage (%)</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Discount Amount"
                value={discountAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  setDiscountAmount(val === '' ? '' : Number(val));
                }}
                type="number"
                required
                helperText={discountType === 'percentage' ? 'Enter value between 0 and 100' : 'Enter flat amount'}
              />

              {discountType === 'percentage' && (
                <TextField
                  fullWidth
                  label="Max Discount (₹)"
                  value={maxDiscount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMaxDiscount(val === '' ? '' : Number(val));
                  }}
                  type="number"
                  helperText="Maximum discount cap in rupees (optional)"
                />
              )}
            </>
          )}

          {/* Product Deal specific fields */}
          {offerType === 'product_deal' && (
            <>
              <Divider />
              <Typography variant="subtitle1">Deal Products</Typography>

              <Autocomplete
                options={productOptions}
                getOptionLabel={(option) => `${option.p_code} — ${option.product_name}`}
                loading={productSearchLoading}
                onInputChange={(_e, value) => { if (value.length >= 2) searchProducts(value); }}
                onChange={(_e, value) => { handleProductSelect(value); }}
                value={null}
                blurOnSelect
                clearOnBlur
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.p_code}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%' }}>
                      <Avatar
                        src={option.pcode_img}
                        variant="rounded"
                        sx={{ width: 40, height: 40 }}
                      >
                        {option.product_name?.[0]}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" noWrap>{option.product_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.p_code} · ₹{option.our_price}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search & Add Product"
                    placeholder="Type product name or code..."
                    size="small"
                    helperText={!(storeCodes.length || contextStoreCode) ? 'Select store codes first to search products' : 'Type at least 2 characters to search'}
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {productSearchLoading ? <CircularProgress size={18} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
              />

              {dealProducts.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
                  No deal products added. Search and select products above.
                </Typography>
              )}

              {dealProducts.map((dp, index) => (
                <Box
                  key={dp.p_code}
                  sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                >
                  <Stack spacing={1.5}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      {dp.pcode_img && (
                        <Avatar src={dp.pcode_img} variant="rounded" sx={{ width: 48, height: 48 }} />
                      )}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2">{dp.product_name}</Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip label={dp.p_code} size="small" variant="outlined" />
                          <Typography variant="caption" color="text.secondary">
                            MRP: ₹{dp.original_price}
                          </Typography>
                        </Stack>
                      </Box>
                      <IconButton size="small" color="error" onClick={() => removeDealProduct(index)}>
                        <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                      </IconButton>
                    </Stack>

                    <Stack direction="row" spacing={2}>
                      <TextField
                        label="Deal Price (₹)"
                        value={dp.deal_price || ''}
                        onChange={(e) => updateDealProduct(index, 'deal_price', Number(e.target.value) || 0)}
                        type="number"
                        required
                        size="small"
                        sx={{ flex: 1 }}
                        helperText={dp.deal_price > 0 && dp.original_price > 0
                          ? `${Math.round((1 - dp.deal_price / dp.original_price) * 100)}% off`
                          : 'Set the special deal price'}
                      />
                      <TextField
                        label="Max Qty"
                        value={dp.max_quantity}
                        onChange={(e) => updateDealProduct(index, 'max_quantity', Math.max(1, Number(e.target.value) || 1))}
                        type="number"
                        size="small"
                        sx={{ flex: 0.5 }}
                      />
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </>
          )}

          <Divider />

          {/* Common fields */}
          <Autocomplete
            multiple
            options={availableStoreCodes}
            value={storeCodes}
            onChange={(_e, value) => setStoreCodes(value)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={option} size="small" {...getTagProps({ index })} key={option} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Store Codes"
                placeholder="Select stores..."
                helperText="Leave empty to apply to all stores"
              />
            )}
          />

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={isActive ? 'true' : 'false'}
              label="Status"
              onChange={(e) => setIsActive(e.target.value === 'true')}
            >
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Valid From"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            fullWidth
            label="Valid Until"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            helperText="Leave blank for no expiry"
          />

          <TextField
            fullWidth
            label="Priority"
            value={priority}
            onChange={(e) => {
              const val = e.target.value;
              setPriority(val === '' ? '' : Number(val));
            }}
            type="number"
            helperText="Higher number = higher priority"
          />

          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={2}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : offer ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
