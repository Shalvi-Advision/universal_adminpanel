import type {
  Category,
  Subcategory,
  PopularCategory,
  PopularCategoryItem,
  PopularCategoryPayload,
} from 'src/types/api';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { parsePopularCategoryItems } from 'src/utils/csv-parser';

import { getCategoriesByStore } from 'src/services/categories';
import { getSubcategoriesByStore } from 'src/services/subcategories';
import { createPopularCategory, updatePopularCategory } from 'src/services/popular-categories';

import { Iconify } from 'src/components/iconify';
import { CSVUpload } from 'src/components/csv-upload';
import { ImageUpload } from 'src/components/image-upload';

import StoreCodeSelector from './store-code-selector';

// Same cap used elsewhere for lookup dropdowns (see products.tsx) — these
// lists back a search-as-you-type picker, not a paginated table.
const LOOKUP_LIST_LIMIT = 500;

interface PopularCategoryDialogProps {
  open: boolean;
  popularCategory: PopularCategory | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function PopularCategoryDialog({
  open,
  popularCategory,
  onClose,
  onSuccess,
}: PopularCategoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [storeCodes, setStoreCodes] = useState<string[]>([]);
  const [desktopBanner, setDesktopBanner] = useState('');
  const [mobileBanner, setMobileBanner] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sequence, setSequence] = useState(0);
  const [subcategories, setSubcategories] = useState<PopularCategoryItem[]>([]);

  // Options for the per-tile picker below, scoped to this popular category's
  // primary store — real names instead of a raw id field is what stops an
  // admin from typing a category id into a field that used to be silently
  // resolved as a subcategory id (or vice versa) whenever the two numbers
  // happened to collide (they're both small per-store sequences).
  const [categoryOptions, setCategoryOptions] = useState<Category[]>([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<Subcategory[]>([]);
  const primaryStoreCode = storeCodes[0] ?? '';

  useEffect(() => {
    if (!open || !primaryStoreCode) {
      setCategoryOptions([]);
      setSubcategoryOptions([]);
      return undefined;
    }
    let active = true;
    Promise.all([
      getCategoriesByStore({ store_code: primaryStoreCode, limit: LOOKUP_LIST_LIMIT }),
      getSubcategoriesByStore({ store_code: primaryStoreCode, limit: LOOKUP_LIST_LIMIT }),
    ])
      .then(([categoryRes, subcategoryRes]) => {
        if (!active) return;
        if (categoryRes.success) setCategoryOptions(categoryRes.data);
        if (subcategoryRes.success) setSubcategoryOptions(subcategoryRes.data);
      })
      .catch(() => {
        if (active) {
          setCategoryOptions([]);
          setSubcategoryOptions([]);
        }
      });
    return () => {
      active = false;
    };
  }, [open, primaryStoreCode]);

  // Load data when editing
  useEffect(() => {
    if (popularCategory) {
      setTitle(popularCategory.title || '');
      setDescription(popularCategory.description || '');
      // Combine both store_code and store_codes for backward compatibility
      const codes = popularCategory.store_codes || [];
      if (popularCategory.store_code && !codes.includes(popularCategory.store_code)) {
        codes.push(popularCategory.store_code);
      }
      setStoreCodes(codes);
      setDesktopBanner(popularCategory.banner_urls?.desktop || '');
      setMobileBanner(popularCategory.banner_urls?.mobile || '');
      setBackgroundColor(popularCategory.background_color || '#ffffff');
      setRedirectUrl(popularCategory.redirect_url || '');
      setIsActive(popularCategory.is_active);
      setSequence(popularCategory.sequence || 0);
      setSubcategories(popularCategory.subcategories || []);
    } else {
      // Reset form for create
      setTitle('');
      setDescription('');
      setStoreCodes([]);
      setDesktopBanner('');
      setMobileBanner('');
      setBackgroundColor('#ffffff');
      setRedirectUrl('');
      setIsActive(true);
      setSequence(0);
      setSubcategories([]);
    }
    setError('');
  }, [popularCategory, open]);

  const handleAddSubcategory = () => {
    setSubcategories([
      ...subcategories,
      {
        sub_category_id: '',
        reference_type: 'subcategory',
        position: subcategories.length + 1,
        metadata: {},
        redirect_url: '',
      },
    ]);
  };

  const handleRemoveSubcategory = (index: number) => {
    setSubcategories(subcategories.filter((_, i) => i !== index));
  };

  const handleCSVUpload = (content: string) => {
    try {
      const parsedItems = parsePopularCategoryItems(content);
      if (parsedItems.length === 0) {
        setError('No valid subcategories found in CSV');
        return;
      }
      setSubcategories(parsedItems);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to parse CSV file');
    }
  };

  const handleSubcategoryChange = (
    index: number,
    field: keyof PopularCategoryItem | 'badge' | 'highlight',
    value: string | number | boolean
  ) => {
    const newSubcategories = [...subcategories];
    if (field === 'badge' || field === 'highlight') {
      newSubcategories[index] = {
        ...newSubcategories[index],
        metadata: { ...newSubcategories[index].metadata, [field]: value },
      };
    } else {
      newSubcategories[index] = { ...newSubcategories[index], [field]: value };
    }
    setSubcategories(newSubcategories);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!desktopBanner.trim()) {
      setError('Desktop banner URL is required');
      return false;
    }
    if (!mobileBanner.trim()) {
      setError('Mobile banner URL is required');
      return false;
    }
    if (!backgroundColor.trim()) {
      setError('Background color is required');
      return false;
    }
    if (subcategories.length === 0 || !subcategories.some((s) => s.sub_category_id.trim())) {
      setError('At least one subcategory is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    const payload: PopularCategoryPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      store_codes: storeCodes.length > 0 ? storeCodes : undefined,
      banner_urls: {
        desktop: desktopBanner.trim(),
        mobile: mobileBanner.trim(),
      },
      background_color: backgroundColor.trim(),
      redirect_url: redirectUrl.trim() || undefined,
      is_active: isActive,
      sequence,
      subcategories: subcategories.filter((s) => s.sub_category_id.trim()),
    };

    try {
      if (popularCategory) {
        await updatePopularCategory(popularCategory._id, payload);
      } else {
        await createPopularCategory(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save popular category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {popularCategory ? 'Edit Popular Category' : 'Create Popular Category'}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={2}
          />

          <StoreCodeSelector
            value={storeCodes}
            onChange={setStoreCodes}
            label="Select Store Codes"
            helperText="Select one or more store codes for this popular category"
          />

          <ImageUpload
            label="Desktop Banner"
            value={desktopBanner}
            onChange={setDesktopBanner}
            required
            folder="popular-categories"
            helperText="Upload image or enter URL (max 5MB)"
          />

          <ImageUpload
            label="Mobile Banner"
            value={mobileBanner}
            onChange={setMobileBanner}
            required
            folder="popular-categories"
            helperText="Upload image or enter URL (max 5MB)"
          />

          <TextField
            fullWidth
            label="Background Color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            type="color"
            required
          />

          <TextField
            fullWidth
            label="Redirect URL"
            value={redirectUrl}
            onChange={(e) => setRedirectUrl(e.target.value)}
          />

          <TextField
            fullWidth
            label="Sequence"
            value={sequence}
            onChange={(e) => setSequence(Number(e.target.value))}
            type="number"
          />

          <FormControlLabel
            control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
            label="Is Active"
          />

          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <span>Subcategories (Required)</span>
              <Button
                size="small"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={handleAddSubcategory}
              >
                Add Subcategory
              </Button>
            </Stack>

            <CSVUpload
              onUpload={handleCSVUpload}
              onError={(err) => setError(err)}
              templateName="popular-category-subcategories.csv"
              label="Bulk Import Subcategories via CSV"
              helperText='Upload a CSV file to add multiple subcategories at once. This will replace existing subcategories. Include a "reference_type" column ("category" or "subcategory") per row — defaults to subcategory when omitted.'
            />

            <Stack spacing={2} sx={{ mt: 2 }}>
              {subcategories.map((subcategory, index) => (
                <Box
                  key={index}
                  sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1}>
                      <TextField
                        select
                        size="small"
                        label="Type"
                        value={subcategory.reference_type ?? 'subcategory'}
                        onChange={(e) =>
                          // The picker below is keyed off this — switching
                          // type without clearing the id would keep a
                          // now-meaningless id (a subcategory id read as a
                          // category id, or vice versa) around silently.
                          setSubcategories((prev) =>
                            prev.map((item, i) =>
                              i === index
                                ? {
                                    ...item,
                                    reference_type: e.target.value as 'category' | 'subcategory',
                                    sub_category_id: '',
                                  }
                                : item
                            )
                          )
                        }
                        sx={{ flex: 1, minWidth: 130 }}
                      >
                        <MenuItem value="subcategory">Subcategory</MenuItem>
                        <MenuItem value="category">Category</MenuItem>
                      </TextField>
                      {subcategory.reference_type === 'category' ? (
                        <Autocomplete
                          size="small"
                          sx={{ flex: 2 }}
                          options={categoryOptions}
                          getOptionLabel={(option) =>
                            `${option.category_name} (${option.idcategory_master})`
                          }
                          isOptionEqualToValue={(option, value) =>
                            option.idcategory_master === value.idcategory_master
                          }
                          value={
                            categoryOptions.find(
                              (c) => c.idcategory_master === subcategory.sub_category_id
                            ) ?? null
                          }
                          onChange={(_, newValue) =>
                            handleSubcategoryChange(
                              index,
                              'sub_category_id',
                              newValue?.idcategory_master ?? ''
                            )
                          }
                          noOptionsText={
                            primaryStoreCode
                              ? 'No categories found for this store'
                              : 'Select a store code above first'
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Category"
                              required
                              helperText={
                                subcategory.sub_category_id &&
                                !categoryOptions.some(
                                  (c) => c.idcategory_master === subcategory.sub_category_id
                                )
                                  ? `Category "${subcategory.sub_category_id}" not found for ${primaryStoreCode || 'this store'} — pick again`
                                  : undefined
                              }
                            />
                          )}
                        />
                      ) : (
                        <Autocomplete
                          size="small"
                          sx={{ flex: 2 }}
                          options={subcategoryOptions}
                          getOptionLabel={(option) =>
                            `${option.sub_category_name} (${option.idsub_category_master})`
                          }
                          isOptionEqualToValue={(option, value) =>
                            option.idsub_category_master === value.idsub_category_master
                          }
                          value={
                            subcategoryOptions.find(
                              (s) => s.idsub_category_master === subcategory.sub_category_id
                            ) ?? null
                          }
                          onChange={(_, newValue) =>
                            handleSubcategoryChange(
                              index,
                              'sub_category_id',
                              newValue?.idsub_category_master ?? ''
                            )
                          }
                          noOptionsText={
                            primaryStoreCode
                              ? 'No subcategories found for this store'
                              : 'Select a store code above first'
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Subcategory"
                              required
                              helperText={
                                subcategory.sub_category_id &&
                                !subcategoryOptions.some(
                                  (s) => s.idsub_category_master === subcategory.sub_category_id
                                )
                                  ? `Subcategory "${subcategory.sub_category_id}" not found for ${primaryStoreCode || 'this store'} — pick again`
                                  : undefined
                              }
                            />
                          )}
                        />
                      )}
                      <TextField
                        size="small"
                        label="Position"
                        value={subcategory.position}
                        onChange={(e) =>
                          handleSubcategoryChange(index, 'position', Number(e.target.value))
                        }
                        type="number"
                        sx={{ flex: 1 }}
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveSubcategory(index)}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Stack>
                    <TextField
                      size="small"
                      label="Store Code"
                      value={subcategory.store_code || ''}
                      onChange={(e) =>
                        handleSubcategoryChange(index, 'store_code', e.target.value)
                      }
                      fullWidth
                    />
                    <TextField
                      size="small"
                      label="Redirect URL"
                      value={subcategory.redirect_url || ''}
                      onChange={(e) =>
                        handleSubcategoryChange(index, 'redirect_url', e.target.value)
                      }
                      fullWidth
                    />
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        size="small"
                        label="Badge (metadata)"
                        value={subcategory.metadata?.badge || ''}
                        onChange={(e) => handleSubcategoryChange(index, 'badge', e.target.value)}
                        sx={{ flex: 1 }}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={subcategory.metadata?.highlight || false}
                            onChange={(e) =>
                              handleSubcategoryChange(index, 'highlight', e.target.checked)
                            }
                            size="small"
                          />
                        }
                        label="Highlight"
                      />
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <CircularProgress size={24} />
          ) : popularCategory ? (
            'Update'
          ) : (
            'Create'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
