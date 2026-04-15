import type { Subcategory, SubcategoryPayload } from 'src/types/api';

import { useState, useEffect } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { createSubcategory, updateSubcategory } from 'src/services/subcategories';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [idSubCategoryMaster, setIdSubCategoryMaster] = useState('');
  const [subCategoryName, setSubCategoryName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [mainCategoryName, setMainCategoryName] = useState('');

  // Load data when editing
  useEffect(() => {
    if (subcategory) {
      setIdSubCategoryMaster(subcategory.idsub_category_master);
      setSubCategoryName(subcategory.sub_category_name);
      setCategoryId(subcategory.category_id);
      setMainCategoryName(subcategory.main_category_name);
    } else {
      // Reset form for create
      setIdSubCategoryMaster('');
      setSubCategoryName('');
      setCategoryId('');
      setMainCategoryName('');
    }
    setError('');
  }, [subcategory, open]);

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
