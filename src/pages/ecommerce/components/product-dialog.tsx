import type { Product, ProductMasterPayload } from 'src/types/api';

import { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useStoreCode } from 'src/contexts/store-code-context';
import { createProduct, updateProduct } from 'src/services/products';

import { ImageUpload } from 'src/components/image-upload/image-upload';

interface ProductDialogProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProductDialog({ open, product, onClose, onSuccess }: ProductDialogProps) {
  const { storeCode: contextStoreCode } = useStoreCode();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Basic Info
  const [pCode, setPCode] = useState('');
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [brandName, setBrandName] = useState('');
  const [barcode, setBarcode] = useState('');

  // Packaging
  const [packageSize, setPackageSize] = useState<number | ''>('');
  const [packageUnit, setPackageUnit] = useState('');

  // Pricing
  const [productMrp, setProductMrp] = useState<number | ''>('');
  const [ourPrice, setOurPrice] = useState<number | ''>('');

  // Stock
  const [storeQuantity, setStoreQuantity] = useState<number | ''>(0);
  const [maxQuantityAllowed, setMaxQuantityAllowed] = useState<number | ''>(10);

  // Classification
  const [storeCode, setStoreCode] = useState('');
  const [deptId, setDeptId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');

  // Status
  const [pcodeStatus, setPcodeStatus] = useState('Y');

  // Image
  const [pcodeImg, setPcodeImg] = useState('');

  // Load data when editing
  useEffect(() => {
    if (product) {
      setPCode(product.p_code);
      setProductName(product.product_name);
      setProductDescription(product.product_description || '');
      setBrandName(product.brand_name || '');
      setBarcode(product.barcode || '');
      setPackageSize(product.package_size);
      setPackageUnit(product.package_unit);
      setProductMrp(product.product_mrp);
      setOurPrice(product.our_price);
      setStoreQuantity(product.store_quantity ?? 0);
      setMaxQuantityAllowed(product.max_quantity_allowed ?? 10);
      setStoreCode(product.store_code);
      setDeptId(product.dept_id);
      setCategoryId(product.category_id);
      setSubCategoryId(product.sub_category_id);
      setPcodeStatus(product.pcode_status || 'Y');
      setPcodeImg(product.pcode_img || '');
    } else {
      // Reset form for create
      setPCode('');
      setProductName('');
      setProductDescription('');
      setBrandName('');
      setBarcode('');
      setPackageSize('');
      setPackageUnit('');
      setProductMrp('');
      setOurPrice('');
      setStoreQuantity(0);
      setMaxQuantityAllowed(10);
      setStoreCode(contextStoreCode || '');
      setDeptId('');
      setCategoryId('');
      setSubCategoryId('');
      setPcodeStatus('Y');
      setPcodeImg('');
    }
    setError('');
  }, [product, open, contextStoreCode]);

  const validateForm = (): boolean => {
    if (!pCode.trim()) {
      setError('Product Code is required');
      return false;
    }

    if (!productName.trim()) {
      setError('Product Name is required');
      return false;
    }

    if (packageSize === '' || packageSize <= 0) {
      setError('Package Size must be a positive number');
      return false;
    }

    if (!packageUnit.trim()) {
      setError('Package Unit is required');
      return false;
    }

    if (productMrp === '' || productMrp <= 0) {
      setError('Product MRP must be a positive number');
      return false;
    }

    if (ourPrice === '' || ourPrice <= 0) {
      setError('Our Price must be a positive number');
      return false;
    }

    if (ourPrice > productMrp) {
      setError('Our Price must be less than or equal to Product MRP');
      return false;
    }

    if (!storeCode.trim()) {
      setError('Store Code is required');
      return false;
    }

    if (!deptId.trim()) {
      setError('Department ID is required');
      return false;
    }

    if (!categoryId.trim()) {
      setError('Category ID is required');
      return false;
    }

    if (!subCategoryId.trim()) {
      setError('Subcategory ID is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    const payload: ProductMasterPayload = {
      p_code: pCode.trim(),
      product_name: productName.trim(),
      package_size: Number(packageSize),
      package_unit: packageUnit.trim(),
      product_mrp: Number(productMrp),
      our_price: Number(ourPrice),
      store_code: storeCode.trim(),
      dept_id: deptId.trim(),
      category_id: categoryId.trim(),
      sub_category_id: subCategoryId.trim(),
      barcode: barcode.trim() || undefined,
      product_description: productDescription.trim() || undefined,
      brand_name: brandName.trim() || undefined,
      pcode_status: pcodeStatus as 'Y' | 'N',
      store_quantity: storeQuantity === '' ? 0 : Number(storeQuantity),
      max_quantity_allowed: maxQuantityAllowed === '' ? 10 : Number(maxQuantityAllowed),
      pcode_img: pcodeImg.trim() || undefined,
    };

    try {
      if (product) {
        await updateProduct(product.id, payload);
      } else {
        await createProduct(payload);
      }
      onSuccess();
    } catch (err: any) {
      if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
        setError('This Product Code already exists');
      } else {
        setError(err.message || 'Failed to save product');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNumberChange =
    (setter: (val: number | '') => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      if (value === '') {
        setter('');
      } else {
        const numValue = parseFloat(value);
        if (!Number.isNaN(numValue)) {
          setter(numValue);
        }
      }
    };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{product ? 'Edit Product' : 'Create Product'}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Basic Info */}
          <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>
            Basic Info
          </Typography>

          <TextField
            fullWidth
            label="Product Code"
            value={pCode}
            onChange={(e) => setPCode(e.target.value)}
            required
            disabled={!!product}
            helperText={
              product ? 'Product Code cannot be changed when editing' : 'Unique product code'
            }
          />

          <TextField
            fullWidth
            label="Product Name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
          />

          <TextField
            fullWidth
            label="Product Description"
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            multiline
            rows={3}
          />

          <TextField
            fullWidth
            label="Brand Name"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
          />

          <TextField
            fullWidth
            label="Barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
          />

          {/* Packaging */}
          <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>
            Packaging
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Package Size"
                value={packageSize}
                onChange={handleNumberChange(setPackageSize)}
                type="number"
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Package Unit"
                value={packageUnit}
                onChange={(e) => setPackageUnit(e.target.value)}
                required
                placeholder="e.g. kg, g, ml, L, pcs"
              />
            </Grid>
          </Grid>

          {/* Pricing */}
          <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>
            Pricing
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Product MRP"
                value={productMrp}
                onChange={handleNumberChange(setProductMrp)}
                type="number"
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Our Price"
                value={ourPrice}
                onChange={handleNumberChange(setOurPrice)}
                type="number"
                required
                helperText="Must be less than or equal to MRP"
              />
            </Grid>
          </Grid>

          {/* Stock */}
          <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>
            Stock
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Store Quantity"
                value={storeQuantity}
                onChange={handleNumberChange(setStoreQuantity)}
                type="number"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Max Quantity Allowed"
                value={maxQuantityAllowed}
                onChange={handleNumberChange(setMaxQuantityAllowed)}
                type="number"
              />
            </Grid>
          </Grid>

          {/* Classification */}
          <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>
            Classification
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Store Code"
                value={storeCode}
                onChange={(e) => setStoreCode(e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Department ID"
                value={deptId}
                onChange={(e) => setDeptId(e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Category ID"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Subcategory ID"
                value={subCategoryId}
                onChange={(e) => setSubCategoryId(e.target.value)}
                required
              />
            </Grid>
          </Grid>

          {/* Status */}
          <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>
            Status
          </Typography>

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={pcodeStatus}
              label="Status"
              onChange={(e) => setPcodeStatus(e.target.value)}
            >
              <MenuItem value="Y">Active</MenuItem>
              <MenuItem value="N">Inactive</MenuItem>
            </Select>
          </FormControl>

          {/* Image */}
          <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>
            Image
          </Typography>

          <ImageUpload
            label="Product Image"
            value={pcodeImg}
            onChange={(url) => setPcodeImg(url)}
            folder="products"
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : product ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
