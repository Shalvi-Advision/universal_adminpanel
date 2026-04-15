import type { Category, CategoryPayload } from 'src/types/api';

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

import { useStoreCode } from 'src/contexts/store-code-context';
import { createCategory, updateCategory } from 'src/services/categories';

import { ImageUpload } from 'src/components/image-upload/image-upload';

interface CategoryDialogProps {
  open: boolean;
  category: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CategoryDialog({ open, category, onClose, onSuccess }: CategoryDialogProps) {
  const { storeCode: contextStoreCode } = useStoreCode();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [idCategoryMaster, setIdCategoryMaster] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [deptId, setDeptId] = useState('');
  const [sequenceId, setSequenceId] = useState<number | ''>('');
  const [storeCode, setStoreCode] = useState('');
  const [noOfCol, setNoOfCol] = useState('');
  const [imageLink, setImageLink] = useState('');
  const [categoryBgColor, setCategoryBgColor] = useState('');

  // Load data when editing
  useEffect(() => {
    if (category) {
      setIdCategoryMaster(category.idcategory_master);
      setCategoryName(category.category_name);
      setDeptId(category.dept_id);
      setSequenceId(category.sequence_id);
      setStoreCode(category.store_code ?? '');
      setNoOfCol(category.no_of_col ?? '');
      setImageLink(category.image_link ?? '');
      setCategoryBgColor(category.category_bg_color ?? '');
    } else {
      // Reset form for create, pre-fill store code from context
      setIdCategoryMaster('');
      setCategoryName('');
      setDeptId('');
      setSequenceId('');
      setStoreCode(contextStoreCode ?? '');
      setNoOfCol('');
      setImageLink('');
      setCategoryBgColor('');
    }
    setError('');
  }, [category, open, contextStoreCode]);

  const validateForm = (): boolean => {
    if (!idCategoryMaster.trim()) {
      setError('Category Master ID is required');
      return false;
    }

    if (!categoryName.trim()) {
      setError('Category Name is required');
      return false;
    }

    if (!deptId.trim()) {
      setError('Department ID is required');
      return false;
    }

    if (sequenceId === '' || sequenceId <= 0) {
      setError('Sequence ID is required and must be a positive number');
      return false;
    }

    if (!storeCode.trim()) {
      setError('Store Code is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    const payload: CategoryPayload = {
      idcategory_master: idCategoryMaster.trim(),
      category_name: categoryName.trim(),
      dept_id: deptId.trim(),
      sequence_id: Number(sequenceId),
      store_code: storeCode.trim(),
      no_of_col: noOfCol.trim() || undefined,
      image_link: imageLink.trim() || undefined,
      category_bg_color: categoryBgColor.trim() || undefined,
    };

    try {
      if (category) {
        await updateCategory(category._id, payload);
      } else {
        await createCategory(payload);
      }
      onSuccess();
    } catch (err: any) {
      if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
        setError('This Category Master ID already exists');
      } else {
        setError(err.message || 'Failed to save category');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSequenceIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setSequenceId('');
    } else {
      const numValue = parseInt(value, 10);
      if (!Number.isNaN(numValue) && numValue > 0) {
        setSequenceId(numValue);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{category ? 'Edit Category' : 'Create Category'}</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            fullWidth
            label="Category Master ID"
            value={idCategoryMaster}
            onChange={(e) => setIdCategoryMaster(e.target.value)}
            required
            disabled={!!category}
            helperText={
              category
                ? 'ID cannot be changed when editing'
                : 'Unique category identifier'
            }
          />

          <TextField
            fullWidth
            label="Category Name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            required
          />

          <TextField
            fullWidth
            label="Department ID"
            value={deptId}
            onChange={(e) => setDeptId(e.target.value)}
            required
          />

          <TextField
            fullWidth
            label="Sequence ID"
            value={sequenceId}
            onChange={handleSequenceIdChange}
            type="number"
            required
            helperText="Positive integer for display ordering"
          />

          <TextField
            fullWidth
            label="Store Code"
            value={storeCode}
            onChange={(e) => setStoreCode(e.target.value)}
            required
          />

          <TextField
            fullWidth
            label="Number of Columns"
            value={noOfCol}
            onChange={(e) => setNoOfCol(e.target.value)}
          />

          <ImageUpload
            label="Category Image"
            value={imageLink}
            onChange={(url) => setImageLink(url)}
            folder="categories"
          />

          <TextField
            fullWidth
            label="Background Color"
            value={categoryBgColor}
            onChange={(e) => setCategoryBgColor(e.target.value)}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : category ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
