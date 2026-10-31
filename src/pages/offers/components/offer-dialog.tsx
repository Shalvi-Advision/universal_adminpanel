import type { Offer, Product, OfferType, DealProduct, OfferPayload, CustomerEligibility } from 'src/types/api';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
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
import FormHelperText from '@mui/material/FormHelperText';
import CircularProgress from '@mui/material/CircularProgress';

import { getStoreCodes } from 'src/services/store-codes';
import { getProductsByStore } from 'src/services/products';
import { getAllDepartments } from 'src/services/departments';
import { getCategoriesByStore } from 'src/services/categories';
import { createOffer, updateOffer } from 'src/services/offers';
import { useStoreCode } from 'src/contexts/store-code-context';
import { getSubcategoriesByStore } from 'src/services/subcategories';

import { Iconify } from 'src/components/iconify';

import { ordinal, OFFER_TYPE_OPTIONS } from '../offer-labels';

interface OfferDialogProps {
  open: boolean;
  offer: Offer | null;
  onClose: () => void;
  onSuccess: () => void;
}

type NumberInput = number | '';

interface Option {
  id: string;
  label: string;
}

const ORDER_NUMBER_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

const toNumberInput = (value?: number | null): NumberInput => (value == null ? '' : value);
const toNullableNumber = (value: NumberInput) => (value === '' ? null : Number(value));

// Dates are picked as local calendar days: an offer runs from the start of
// "Valid From" to the end of "Valid Until" in the admin's timezone.
const toLocalDateInput = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const startOfLocalDay = (date: string) => new Date(`${date}T00:00:00`).toISOString();
const endOfLocalDay = (date: string) => new Date(`${date}T23:59:59.999`).toISOString();

const numberField = (setter: (v: NumberInput) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
  const val = e.target.value;
  setter(val === '' ? '' : Number(val));
};

export function OfferDialog({ open, offer, onClose, onSuccess }: OfferDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Common fields
  const [offerType, setOfferType] = useState<OfferType>('cart_discount');
  const [title, setTitle] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [minCartValue, setMinCartValue] = useState<NumberInput>('');
  const [storeCodes, setStoreCodes] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [priority, setPriority] = useState<NumberInput>(0);
  const [description, setDescription] = useState('');

  // Discount fields (cart / category discount, buy X get Y cap)
  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>('flat');
  const [discountAmount, setDiscountAmount] = useState<NumberInput>('');
  const [maxDiscount, setMaxDiscount] = useState<NumberInput>('');

  // Buy X get Y
  const [buyQuantity, setBuyQuantity] = useState<NumberInput>(2);
  const [getQuantity, setGetQuantity] = useState<NumberInput>(1);
  const [getDiscountPercent, setGetDiscountPercent] = useState<NumberInput>(100);

  // Targets (category discount, buy X get Y)
  const [targetDeptIds, setTargetDeptIds] = useState<string[]>([]);
  const [targetCategoryIds, setTargetCategoryIds] = useState<string[]>([]);
  const [targetSubCategoryIds, setTargetSubCategoryIds] = useState<string[]>([]);
  const [targetBrands, setTargetBrands] = useState<string[]>([]);
  const [targetPCodes, setTargetPCodes] = useState<string[]>([]);

  // Who can use it + limits
  const [eligibility, setEligibility] = useState<CustomerEligibility>('all');
  const [orderNumbers, setOrderNumbers] = useState<number[]>([1]);
  const [newUserDays, setNewUserDays] = useState<NumberInput>(7);
  const [limitPerUser, setLimitPerUser] = useState<NumberInput>('');
  const [limitTotal, setLimitTotal] = useState<NumberInput>('');

  // Product deal fields
  const [dealProducts, setDealProducts] = useState<DealProduct[]>([]);

  const hasDiscountValue = offerType === 'cart_discount' || offerType === 'category_discount';
  const hasTargets = offerType === 'category_discount' || offerType === 'buy_x_get_y';

  // Store codes for multi-select
  const { storeCode: contextStoreCode } = useStoreCode();
  const [availableStoreCodes, setAvailableStoreCodes] = useState<string[]>([]);
  const lookupStoreCode = storeCodes[0] || contextStoreCode;

  useEffect(() => {
    getStoreCodes().then((res) => {
      if (res.success) {
        setAvailableStoreCodes((res.data as any).map((s: any) => s.store_code));
      }
    }).catch(() => {});
  }, []);

  // Department / category / sub-category options for targeting
  const [deptOptions, setDeptOptions] = useState<Option[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState<Option[]>([]);

  useEffect(() => {
    if (!open || !hasTargets || !lookupStoreCode) return;
    getAllDepartments({ storeCode: lookupStoreCode, limit: 500 }).then((res) => {
      setDeptOptions((res.data || []).map((d) => ({ id: String(d.department_id), label: d.department_name })));
    }).catch(() => {});
    getCategoriesByStore({ store_code: lookupStoreCode, limit: 1000 }).then((res) => {
      setCategoryOptions((res.data || []).map((c) => ({ id: String(c.idcategory_master), label: c.category_name })));
    }).catch(() => {});
    getSubcategoriesByStore({ store_code: lookupStoreCode, limit: 2000 }).then((res) => {
      setSubCategoryOptions((res.data || []).map((c) => ({
        id: String(c.idsub_category_master),
        label: `${c.sub_category_name} (${c.main_category_name})`,
      })));
    }).catch(() => {});
  }, [open, hasTargets, lookupStoreCode]);

  // Product search for autocomplete
  const [productOptions, setProductOptions] = useState<Product[]>([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);

  const searchProducts = useCallback(async (query: string) => {
    if (!lookupStoreCode) return;
    try {
      setProductSearchLoading(true);
      const response = await getProductsByStore({ store_code: lookupStoreCode, search: query, limit: 20 });
      if (response.success) {
        setProductOptions(response.data);
      }
    } catch {
      // Silently fail search
    } finally {
      setProductSearchLoading(false);
    }
  }, [lookupStoreCode]);

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
      setCouponCode(offer.coupon_code || '');
      setMinCartValue(offer.min_cart_value);
      setStoreCodes(offer.store_codes?.length ? [...offer.store_codes] : []);
      setIsActive(offer.is_active);
      setValidFrom(toLocalDateInput(offer.valid_from));
      setValidUntil(toLocalDateInput(offer.valid_until));
      setPriority(offer.priority);
      setDescription(offer.description ?? '');
      setDiscountType(offer.discount_type);
      setDiscountAmount(offer.discount_amount || '');
      setMaxDiscount(toNumberInput(offer.max_discount));
      setBuyQuantity(toNumberInput(offer.buy_quantity) || 2);
      setGetQuantity(toNumberInput(offer.get_quantity) || 1);
      setGetDiscountPercent(offer.get_discount_percent ?? 100);
      setTargetDeptIds(offer.target_dept_ids || []);
      setTargetCategoryIds(offer.target_category_ids || []);
      setTargetSubCategoryIds(offer.target_sub_category_ids || []);
      setTargetBrands(offer.target_brands || []);
      setTargetPCodes(offer.target_p_codes || []);
      setEligibility(offer.customer_eligibility || 'all');
      setOrderNumbers(offer.eligible_order_numbers?.length ? [...offer.eligible_order_numbers] : [1]);
      setNewUserDays(toNumberInput(offer.new_user_within_days) || 7);
      setLimitPerUser(toNumberInput(offer.usage_limit_per_user));
      setLimitTotal(toNumberInput(offer.usage_limit_total));
      setDealProducts(offer.deal_products?.length ? [...offer.deal_products] : []);
    } else {
      setOfferType('cart_discount');
      setTitle('');
      setCouponCode('');
      setMinCartValue('');
      setStoreCodes(contextStoreCode ? [contextStoreCode] : []);
      setIsActive(true);
      setValidFrom(toLocalDateInput(new Date().toISOString()));
      setValidUntil('');
      setPriority(0);
      setDescription('');
      setDiscountType('flat');
      setDiscountAmount('');
      setMaxDiscount('');
      setBuyQuantity(2);
      setGetQuantity(1);
      setGetDiscountPercent(100);
      setTargetDeptIds([]);
      setTargetCategoryIds([]);
      setTargetSubCategoryIds([]);
      setTargetBrands([]);
      setTargetPCodes([]);
      setEligibility('all');
      setOrderNumbers([1]);
      setNewUserDays(7);
      setLimitPerUser('');
      setLimitTotal('');
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

  const validateForm = (): string | null => {
    if (!title.trim()) return 'Title is required';
    if (couponCode && !/^[A-Za-z0-9_-]+$/.test(couponCode.trim())) {
      return 'Coupon code can only contain letters, numbers, - and _';
    }
    if (minCartValue === '' || Number(minCartValue) < 0) return 'Minimum cart value must be 0 or more';

    if (hasDiscountValue) {
      if (discountAmount === '' || Number(discountAmount) <= 0) return 'Discount amount must be a positive number';
      if (discountType === 'percentage' && Number(discountAmount) > 100) {
        return 'Percentage discount must be between 0 and 100';
      }
    }
    if (offerType === 'category_discount' &&
      !targetDeptIds.length && !targetCategoryIds.length && !targetSubCategoryIds.length &&
      !targetBrands.length && !targetPCodes.length) {
      return 'Pick at least one department, category, sub-category, brand or product';
    }
    if (offerType === 'buy_x_get_y') {
      if (!Number(buyQuantity) || Number(buyQuantity) < 1) return 'Buy quantity must be at least 1';
      if (!Number(getQuantity) || Number(getQuantity) < 1) return 'Get quantity must be at least 1';
      if (!Number(getDiscountPercent) || Number(getDiscountPercent) < 1 || Number(getDiscountPercent) > 100) {
        return 'Discount on the free items must be between 1 and 100%';
      }
    }
    if (offerType === 'product_deal') {
      if (dealProducts.length === 0) return 'At least one deal product is required';
      for (const dp of dealProducts) {
        if (!dp.p_code.trim() || !dp.product_name.trim()) {
          return 'Product code and name are required for all deal products';
        }
        if (dp.deal_price < 0 || dp.original_price <= 0) return 'Invalid prices for deal products';
        if (dp.deal_price >= dp.original_price) return 'Deal price must be less than original price';
      }
    }

    if (eligibility === 'order_number' && orderNumbers.length === 0) return 'Pick at least one order number';
    if (eligibility === 'new_user' && (!Number(newUserDays) || Number(newUserDays) < 1)) {
      return 'Days since registration must be at least 1';
    }
    if (limitPerUser !== '' && Number(limitPerUser) < 1) return 'Uses per customer must be at least 1';
    if (limitTotal !== '' && Number(limitTotal) < 1) return 'Total uses must be at least 1';
    if (validFrom && validUntil && validUntil < validFrom) return 'Valid Until cannot be before Valid From';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    // Every field is sent (null / [] when unused) so clearing a value on edit
    // actually clears it.
    const payload: OfferPayload = {
      offer_type: offerType,
      title: title.trim(),
      coupon_code: couponCode.trim().toUpperCase(),
      min_cart_value: Number(minCartValue),
      is_active: isActive,
      priority: Number(priority) || 0,
      description: description.trim(),
      store_codes: storeCodes,
      valid_until: validUntil ? endOfLocalDay(validUntil) : null,
      discount_type: hasDiscountValue ? discountType : 'flat',
      discount_amount: hasDiscountValue ? Number(discountAmount) : 0,
      max_discount:
        (hasDiscountValue && discountType === 'percentage') || offerType === 'buy_x_get_y'
          ? toNullableNumber(maxDiscount)
          : null,
      deal_products: offerType === 'product_deal' ? dealProducts : [],
      buy_quantity: offerType === 'buy_x_get_y' ? Number(buyQuantity) : null,
      get_quantity: offerType === 'buy_x_get_y' ? Number(getQuantity) : null,
      get_discount_percent: offerType === 'buy_x_get_y' ? Number(getDiscountPercent) : 100,
      target_dept_ids: hasTargets ? targetDeptIds : [],
      target_category_ids: hasTargets ? targetCategoryIds : [],
      target_sub_category_ids: hasTargets ? targetSubCategoryIds : [],
      target_brands: hasTargets ? targetBrands : [],
      target_p_codes: hasTargets ? targetPCodes : [],
      customer_eligibility: eligibility,
      eligible_order_numbers: eligibility === 'order_number' ? orderNumbers : [],
      new_user_within_days: eligibility === 'new_user' ? Number(newUserDays) : null,
      usage_limit_per_user: toNullableNumber(limitPerUser),
      usage_limit_total: toNullableNumber(limitTotal),
    };
    if (validFrom) payload.valid_from = startOfLocalDay(validFrom);

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

  const optionLabel = (options: Option[], id: string) => options.find((o) => o.id === id)?.label ?? id;

  const renderIdPicker = (
    label: string,
    options: Option[],
    value: string[],
    onChange: (ids: string[]) => void
  ) => (
    <Autocomplete
      multiple
      options={options.map((o) => o.id)}
      value={value}
      onChange={(_e, ids) => onChange(ids)}
      getOptionLabel={(id) => optionLabel(options, id)}
      renderTags={(ids, getTagProps) =>
        ids.map((id, index) => (
          <Chip label={optionLabel(options, id)} size="small" {...getTagProps({ index })} key={id} />
        ))
      }
      renderInput={(params) => <TextField {...params} label={label} size="small" />}
    />
  );

  const selectedTypeHint = OFFER_TYPE_OPTIONS.find((o) => o.value === offerType)?.hint;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{offer ? 'Edit Offer' : 'Create Offer'}</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <FormControl fullWidth required>
            <InputLabel>Offer Type</InputLabel>
            <Select
              value={offerType}
              label="Offer Type"
              onChange={(e) => setOfferType(e.target.value as OfferType)}
            >
              {OFFER_TYPE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
            {selectedTypeHint && <FormHelperText>{selectedTypeHint}</FormHelperText>}
          </FormControl>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 7 }}>
              <TextField
                fullWidth
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                fullWidth
                label="Coupon Code (optional)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                disabled={offerType === 'product_deal'}
                helperText={
                  offerType === 'product_deal'
                    ? 'Product deals apply automatically'
                    : couponCode
                      ? 'Applies only when the customer enters this code'
                      : 'Leave empty to apply automatically'
                }
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Min Cart Value (₹)"
            value={minCartValue}
            onChange={numberField(setMinCartValue)}
            type="number"
            required
            helperText="Cart must reach this value to unlock the offer (0 = no minimum)"
          />

          {/* Discount value: cart / category discount */}
          {hasDiscountValue && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
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
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Discount Amount"
                  value={discountAmount}
                  onChange={numberField(setDiscountAmount)}
                  type="number"
                  required
                  helperText={discountType === 'percentage' ? 'Between 0 and 100' : 'Flat amount in ₹'}
                />
              </Grid>
              {discountType === 'percentage' && (
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Max Discount (₹)"
                    value={maxDiscount}
                    onChange={numberField(setMaxDiscount)}
                    type="number"
                    helperText="Optional cap"
                  />
                </Grid>
              )}
            </Grid>
          )}

          {/* Buy X get Y */}
          {offerType === 'buy_x_get_y' && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  fullWidth
                  label="Buy (qty)"
                  value={buyQuantity}
                  onChange={numberField(setBuyQuantity)}
                  type="number"
                  required
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  fullWidth
                  label="Get (qty)"
                  value={getQuantity}
                  onChange={numberField(setGetQuantity)}
                  type="number"
                  required
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  fullWidth
                  label="Off on 'get' items (%)"
                  value={getDiscountPercent}
                  onChange={numberField(setGetDiscountPercent)}
                  type="number"
                  required
                  helperText="100 = free"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  fullWidth
                  label="Max Discount (₹)"
                  value={maxDiscount}
                  onChange={numberField(setMaxDiscount)}
                  type="number"
                  helperText="Optional cap"
                />
              </Grid>
              <Grid size={12}>
                <Typography variant="caption" color="text.secondary">
                  For every {Number(buyQuantity) || 'X'} + {Number(getQuantity) || 'Y'} eligible units in the
                  cart, the cheapest {Number(getQuantity) || 'Y'} get{' '}
                  {Number(getDiscountPercent) >= 100 ? 'free' : `${Number(getDiscountPercent) || 0}% off`}.
                  Mixing products counts (e.g. any 3 items from the brand).
                </Typography>
              </Grid>
            </Grid>
          )}

          {/* Targets: category discount, buy X get Y */}
          {hasTargets && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle1">Applies to</Typography>
                <Typography variant="caption" color="text.secondary">
                  An item counts if it matches any one of these.
                  {offerType === 'buy_x_get_y' && ' Leave all empty to count every product.'}
                  {!lookupStoreCode && ' Select a store code below to load departments and categories.'}
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  {renderIdPicker('Departments', deptOptions, targetDeptIds, setTargetDeptIds)}
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  {renderIdPicker('Categories', categoryOptions, targetCategoryIds, setTargetCategoryIds)}
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  {renderIdPicker('Sub-categories', subCategoryOptions, targetSubCategoryIds, setTargetSubCategoryIds)}
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={[] as string[]}
                    value={targetBrands}
                    onChange={(_e, value) => setTargetBrands(value.map((v) => v.trim()).filter(Boolean))}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip label={option} size="small" {...getTagProps({ index })} key={option} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Brands" size="small" helperText="Type a brand name and press Enter" />
                    )}
                  />
                </Grid>
                <Grid size={12}>
                  <Autocomplete
                    options={productOptions}
                    getOptionLabel={(option) => `${option.p_code} — ${option.product_name}`}
                    loading={productSearchLoading}
                    onInputChange={(_e, value) => { if (value.length >= 2) searchProducts(value); }}
                    onChange={(_e, value) => {
                      if (value && !targetPCodes.includes(value.p_code)) setTargetPCodes([...targetPCodes, value.p_code]);
                    }}
                    value={null}
                    blurOnSelect
                    clearOnBlur
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Add specific products"
                        placeholder="Type product name or code..."
                        size="small"
                      />
                    )}
                  />
                  {targetPCodes.length > 0 && (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      {targetPCodes.map((code) => (
                        <Chip
                          key={code}
                          label={code}
                          size="small"
                          onDelete={() => setTargetPCodes(targetPCodes.filter((c) => c !== code))}
                        />
                      ))}
                    </Stack>
                  )}
                </Grid>
              </Grid>
            </>
          )}

          {offerType === 'free_delivery' && (
            <Alert severity="info">
              Waives the delivery fee once the cart reaches the minimum value (the store&apos;s handling
              and package fees still apply). It can be combined with one discount offer and product deals.
            </Alert>
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
                    helperText={!lookupStoreCode ? 'Select store codes first to search products' : 'Type at least 2 characters to search'}
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

          {/* Who can use it */}
          <Typography variant="subtitle1">Who can use it</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Customers</InputLabel>
                <Select
                  value={eligibility}
                  label="Customers"
                  onChange={(e) => setEligibility(e.target.value as CustomerEligibility)}
                >
                  <MenuItem value="all">All customers</MenuItem>
                  <MenuItem value="order_number">Only on specific order numbers (1st, 2nd…)</MenuItem>
                  <MenuItem value="new_user">New registrations only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              {eligibility === 'order_number' && (
                <Autocomplete
                  multiple
                  options={ORDER_NUMBER_OPTIONS}
                  value={orderNumbers}
                  onChange={(_e, value) => setOrderNumbers([...value].sort((a, b) => a - b))}
                  getOptionLabel={(n) => `${ordinal(n)} order`}
                  renderTags={(value, getTagProps) =>
                    value.map((n, index) => (
                      <Chip label={`${ordinal(n)} order`} size="small" {...getTagProps({ index })} key={n} />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Order numbers"
                      helperText="Counts the customer's earlier orders; cancelled orders don't count"
                    />
                  )}
                />
              )}
              {eligibility === 'new_user' && (
                <TextField
                  fullWidth
                  label="Within days of registering"
                  value={newUserDays}
                  onChange={numberField(setNewUserDays)}
                  type="number"
                  helperText="e.g. 7 = only customers who signed up in the last 7 days"
                />
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Uses per customer"
                value={limitPerUser}
                onChange={numberField(setLimitPerUser)}
                type="number"
                helperText="Empty = unlimited"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Total uses (all customers)"
                value={limitTotal}
                onChange={numberField(setLimitTotal)}
                type="number"
                helperText="Empty = unlimited. Cancelled orders free up a use."
              />
            </Grid>
          </Grid>

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

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
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
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Valid From"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Valid Until"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                helperText="Inclusive. Blank = no expiry"
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Priority"
            value={priority}
            onChange={numberField(setPriority)}
            type="number"
            helperText="When several discount offers are unlocked, the highest priority is applied automatically (ties go to the bigger saving)"
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
