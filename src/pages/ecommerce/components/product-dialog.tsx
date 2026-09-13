import type { Product, Category, Department, Subcategory, ProductMasterPayload } from 'src/types/api';

import { useState, useEffect } from 'react';

import Chip from '@mui/material/Chip';
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
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { LOOKUP_LIST_LIMIT } from 'src/utils/lookup-constants';

import { getAllDepartments } from 'src/services/departments';
import { useStoreCode } from 'src/contexts/store-code-context';
import { getCategoriesByStore } from 'src/services/categories';
import { createProduct, updateProduct } from 'src/services/products';
import { getSubcategoriesByStore } from 'src/services/subcategories';

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
  const [additionalSubCategoryIds, setAdditionalSubCategoryIds] = useState<string[]>([]);

  // Options for the "Additional Subcategories" picker — the full store-wide
  // list, since a product can be cross-listed under any subcategory, not
  // just siblings of its primary Category.
  const [subcategoryOptions, setSubcategoryOptions] = useState<Subcategory[]>([]);
  const [loadingSubcategoryOptions, setLoadingSubcategoryOptions] = useState(false);

  // Cascading options for the primary Department -> Category -> Subcategory
  // pickers — each level's list is scoped to the level above it, same as
  // the Department/Category/Subcategory filter on the Products list page.
  const [departmentOptions, setDepartmentOptions] = useState<Department[]>([]);
  const [loadingDepartmentOptions, setLoadingDepartmentOptions] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<Category[]>([]);
  const [loadingCategoryOptions, setLoadingCategoryOptions] = useState(false);
  const [primarySubcategoryOptions, setPrimarySubcategoryOptions] = useState<Subcategory[]>([]);
  const [loadingPrimarySubcategoryOptions, setLoadingPrimarySubcategoryOptions] = useState(false);

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
      setAdditionalSubCategoryIds(product.additional_sub_category_ids ?? []);
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
      setAdditionalSubCategoryIds([]);
      setPcodeStatus('Y');
      setPcodeImg('');
    }
    setError('');
  }, [product, open, contextStoreCode]);

  // Populate the "Additional Subcategories" picker options for the current store
  useEffect(() => {
    if (!open || !storeCode) {
      setSubcategoryOptions([]);
      return undefined;
    }
    let active = true;
    setLoadingSubcategoryOptions(true);
    getSubcategoriesByStore({ store_code: storeCode, limit: LOOKUP_LIST_LIMIT })
      .then((response) => {
        if (active && response.success) setSubcategoryOptions(response.data);
      })
      .catch(() => {
        if (active) setSubcategoryOptions([]);
      })
      .finally(() => {
        if (active) setLoadingSubcategoryOptions(false);
      });
    return () => {
      active = false;
    };
  }, [open, storeCode]);

  // Department options for the current store
  useEffect(() => {
    if (!open || !storeCode) {
      setDepartmentOptions([]);
      return undefined;
    }
    let active = true;
    setLoadingDepartmentOptions(true);
    getAllDepartments({ storeCode, limit: LOOKUP_LIST_LIMIT })
      .then((response) => {
        if (active && response.success) setDepartmentOptions(response.data);
      })
      .catch(() => {
        if (active) setDepartmentOptions([]);
      })
      .finally(() => {
        if (active) setLoadingDepartmentOptions(false);
      });
    return () => {
      active = false;
    };
  }, [open, storeCode]);

  // Category options scoped to the selected Department
  useEffect(() => {
    if (!open || !storeCode || !deptId) {
      setCategoryOptions([]);
      return undefined;
    }
    let active = true;
    setLoadingCategoryOptions(true);
    getCategoriesByStore({ store_code: storeCode, deptId, limit: LOOKUP_LIST_LIMIT })
      .then((response) => {
        if (active && response.success) setCategoryOptions(response.data);
      })
      .catch(() => {
        if (active) setCategoryOptions([]);
      })
      .finally(() => {
        if (active) setLoadingCategoryOptions(false);
      });
    return () => {
      active = false;
    };
  }, [open, storeCode, deptId]);

  // Subcategory options scoped to the selected Category — the primary
  // Subcategory picker, distinct from the full-list "Additional
  // Subcategories" picker above.
  useEffect(() => {
    if (!open || !storeCode || !categoryId) {
      setPrimarySubcategoryOptions([]);
      return undefined;
    }
    let active = true;
    setLoadingPrimarySubcategoryOptions(true);
    getSubcategoriesByStore({ store_code: storeCode, categoryId, limit: LOOKUP_LIST_LIMIT })
      .then((response) => {
        if (active && response.success) setPrimarySubcategoryOptions(response.data);
      })
      .catch(() => {
        if (active) setPrimarySubcategoryOptions([]);
      })
      .finally(() => {
        if (active) setLoadingPrimarySubcategoryOptions(false);
      });
    return () => {
      active = false;
    };
  }, [open, storeCode, categoryId]);

  // A department/category change made by the admin invalidates whatever was
  // selected below it — but only when they change it, not when the form
  // first loads an existing product's already-consistent dept/category/sub.
  const handleDeptChange = (newDeptId: string) => {
    setDeptId(newDeptId);
    setCategoryId('');
    setSubCategoryId('');
  };

  const handleCategoryChange = (newCategoryId: string) => {
    setCategoryId(newCategoryId);
    setSubCategoryId('');
  };

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
      additional_sub_category_ids: additionalSubCategoryIds,
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
              <Autocomplete
                options={departmentOptions}
                getOptionLabel={(option) => `${option.department_name} (${option.department_id})`}
                isOptionEqualToValue={(option, value) =>
                  option.department_id === value.department_id
                }
                value={departmentOptions.find((d) => d.department_id === deptId) ?? null}
                onChange={(_event, newValue) => handleDeptChange(newValue?.department_id ?? '')}
                loading={loadingDepartmentOptions}
                disabled={!storeCode.trim()}
                renderInput={(params) => (
                  <TextField {...params} label="Department" required helperText="Search by name" />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={categoryOptions}
                getOptionLabel={(option) => `${option.category_name} (${option.idcategory_master})`}
                isOptionEqualToValue={(option, value) =>
                  option.idcategory_master === value.idcategory_master
                }
                value={categoryOptions.find((c) => c.idcategory_master === categoryId) ?? null}
                onChange={(_event, newValue) =>
                  handleCategoryChange(newValue?.idcategory_master ?? '')
                }
                loading={loadingCategoryOptions}
                disabled={!deptId}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Category"
                    required
                    helperText={deptId ? 'Search by name' : 'Select a Department first'}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={primarySubcategoryOptions}
                getOptionLabel={(option) =>
                  `${option.sub_category_name} (${option.idsub_category_master})`
                }
                isOptionEqualToValue={(option, value) =>
                  option.idsub_category_master === value.idsub_category_master
                }
                value={
                  primarySubcategoryOptions.find(
                    (s) => s.idsub_category_master === subCategoryId
                  ) ?? null
                }
                onChange={(_event, newValue) =>
                  setSubCategoryId(newValue?.idsub_category_master ?? '')
                }
                loading={loadingPrimarySubcategoryOptions}
                disabled={!categoryId}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Subcategory"
                    required
                    helperText={categoryId ? 'Search by name' : 'Select a Category first'}
                  />
                )}
              />
            </Grid>
            <Grid size={12}>
              <Autocomplete
                multiple
                options={subcategoryOptions.filter(
                  (s) => s.idsub_category_master !== subCategoryId.trim()
                )}
                getOptionLabel={(option) =>
                  `${option.sub_category_name} (${option.idsub_category_master})`
                }
                isOptionEqualToValue={(option, value) =>
                  option.idsub_category_master === value.idsub_category_master
                }
                value={subcategoryOptions.filter((s) =>
                  additionalSubCategoryIds.includes(s.idsub_category_master)
                )}
                onChange={(_event, newValue) =>
                  setAdditionalSubCategoryIds(newValue.map((s) => s.idsub_category_master))
                }
                loading={loadingSubcategoryOptions}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.sub_category_name}
                      size="small"
                      {...getTagProps({ index })}
                      key={option.idsub_category_master}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Additional Subcategories"
                    placeholder="Also list this product under..."
                    helperText="Cross-list this product under other subcategories, beyond its primary Subcategory ID above"
                  />
                )}
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
