import type { Category, Subcategory, SubcategoryPayload } from 'src/types/api';

import { useState, useEffect } from 'react';

import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { LOOKUP_LIST_LIMIT } from 'src/utils/lookup-constants';

import { useStoreCode } from 'src/contexts/store-code-context';
import { getCategoriesByStore } from 'src/services/categories';
import { createSubcategory, updateSubcategory } from 'src/services/subcategories';

import { ImageUpload } from 'src/components/image-upload/image-upload';

interface SubcategoryDialogProps {
  open: boolean;
  subcategory: Subcategory | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function SubcategoryDialog({
  open,
  subcategory,
  onClose,
  onSuccess,
}: SubcategoryDialogProps) {
  const { storeCode } = useStoreCode();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [idSubCategoryMaster, setIdSubCategoryMaster] = useState('');
  const [subCategoryName, setSubCategoryName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [mainCategoryName, setMainCategoryName] = useState('');
  const [imageLink, setImageLink] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [additionalCategoryIds, setAdditionalCategoryIds] = useState<string[]>([]);

  // Options for the "Additional Categories" picker
  const [categoryOptions, setCategoryOptions] = useState<Category[]>([]);
  const [loadingCategoryOptions, setLoadingCategoryOptions] = useState(false);

  // Load data when editing
  useEffect(() => {
    if (subcategory) {
      setIdSubCategoryMaster(subcategory.idsub_category_master);
      setSubCategoryName(subcategory.sub_category_name);
      setCategoryId(subcategory.category_id);
      setMainCategoryName(subcategory.main_category_name);
      setImageLink(subcategory.image_link ?? '');
      setIsVisible(subcategory.is_visible ?? true);
      setAdditionalCategoryIds(subcategory.additional_category_ids ?? []);
    } else {
      // Reset form for create
      setIdSubCategoryMaster('');
      setSubCategoryName('');
      setCategoryId('');
      setMainCategoryName('');
      setImageLink('');
      setIsVisible(true);
      setAdditionalCategoryIds([]);
    }
    setError('');
  }, [subcategory, open]);

  // Populate the "Additional Categories" picker options for the current store
  useEffect(() => {
    if (!open || !storeCode) {
      setCategoryOptions([]);
      return undefined;
    }
    let active = true;
    setLoadingCategoryOptions(true);
    getCategoriesByStore({ store_code: storeCode, limit: LOOKUP_LIST_LIMIT })
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
  }, [open, storeCode]);

  const validateForm = (): boolean => {
    if (!idSubCategoryMaster.trim()) {
      setError('Subcategory Master ID is required');
      return false;
    }

    if (!subCategoryName.trim()) {
      setError('Subcategory Name is required');
      return false;
    }

    if (!categoryId.trim()) {
      setError('Category ID is required');
      return false;
    }

    if (!mainCategoryName.trim()) {
      setError('Main Category Name is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    const payload: SubcategoryPayload = {
      idsub_category_master: idSubCategoryMaster.trim(),
      sub_category_name: subCategoryName.trim(),
      category_id: categoryId.trim(),
      main_category_name: mainCategoryName.trim(),
      image_link: imageLink.trim() || undefined,
      is_visible: isVisible,
      additional_category_ids: additionalCategoryIds,
    };

    try {
      if (subcategory) {
        await updateSubcategory(subcategory._id, payload);
      } else {
        await createSubcategory(payload);
      }
      onSuccess();
    } catch (err: any) {
      if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
        setError('This Subcategory Master ID already exists');
      } else {
        setError(err.message || 'Failed to save subcategory');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{subcategory ? 'Edit Subcategory' : 'Create Subcategory'}</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            fullWidth
            label="Subcategory Master ID"
            value={idSubCategoryMaster}
            onChange={(e) => setIdSubCategoryMaster(e.target.value)}
            required
            disabled={!!subcategory}
            helperText={
              subcategory
                ? 'ID cannot be changed when editing'
                : 'Unique identifier for this subcategory'
            }
          />

          <TextField
            fullWidth
            label="Subcategory Name"
            value={subCategoryName}
            onChange={(e) => setSubCategoryName(e.target.value)}
            required
          />

          <TextField
            fullWidth
            label="Category ID"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          />

          <TextField
            fullWidth
            label="Main Category Name"
            value={mainCategoryName}
            onChange={(e) => setMainCategoryName(e.target.value)}
            required
          />

          <ImageUpload
            label="Subcategory Image"
            value={imageLink}
            onChange={(url) => setImageLink(url)}
            folder="subcategories"
          />

          <Autocomplete
            multiple
            options={categoryOptions.filter((c) => c.idcategory_master !== categoryId.trim())}
            getOptionLabel={(option) => `${option.category_name} (${option.idcategory_master})`}
            isOptionEqualToValue={(option, value) => option.idcategory_master === value.idcategory_master}
            value={categoryOptions.filter((c) => additionalCategoryIds.includes(c.idcategory_master))}
            onChange={(_event, newValue) =>
              setAdditionalCategoryIds(newValue.map((c) => c.idcategory_master))
            }
            loading={loadingCategoryOptions}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option.category_name}
                  size="small"
                  {...getTagProps({ index })}
                  key={option.idcategory_master}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Additional Categories"
                placeholder="Also show this subcategory under..."
                helperText="Cross-list this subcategory under other categories, beyond its primary Category ID above"
              />
            )}
          />

          <FormControlLabel
            control={
              <Switch
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
              />
            }
            label="Visible on mobile app"
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : subcategory ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
