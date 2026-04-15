import type { Department, DepartmentPayload } from 'src/types/api';

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

import { createDepartment, updateDepartment } from 'src/services/departments';

import { ImageUpload } from 'src/components/image-upload/image-upload';

interface DepartmentDialogProps {
  open: boolean;
  department: Department | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DepartmentDialog({ open, department, onClose, onSuccess }: DepartmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [departmentId, setDepartmentId] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [deptTypeId, setDeptTypeId] = useState('');
  const [sequenceId, setSequenceId] = useState<number | ''>('');
  const [deptNoOfCol, setDeptNoOfCol] = useState<number | ''>('');
  const [storeCode, setStoreCode] = useState('');
  const [imageLink, setImageLink] = useState('');

  // Load data when editing
  useEffect(() => {
    if (department) {
      setDepartmentId(department.department_id);
      setDepartmentName(department.department_name);
      setDeptTypeId(department.dept_type_id);
      setSequenceId(department.sequence_id);
      setDeptNoOfCol(department.dept_no_of_col ?? '');
      setStoreCode(department.store_code ?? '');
      setImageLink(department.image_link ?? '');
    } else {
      // Reset form for create
      setDepartmentId('');
      setDepartmentName('');
      setDeptTypeId('');
      setSequenceId('');
      setDeptNoOfCol('');
      setStoreCode('');
      setImageLink('');
    }
    setError('');
  }, [department, open]);

  const validateForm = (): boolean => {
    if (!departmentId.trim()) {
      setError('Department ID is required');
      return false;
    }

    if (!departmentName.trim()) {
      setError('Department Name is required');
      return false;
    }

    if (!deptTypeId.trim()) {
      setError('Department Type ID is required');
      return false;
    }

    if (sequenceId === '' || sequenceId <= 0) {
      setError('Sequence ID is required and must be a positive number');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    const payload: DepartmentPayload = {
      department_id: departmentId.trim(),
      department_name: departmentName.trim(),
      dept_type_id: deptTypeId.trim(),
      sequence_id: Number(sequenceId),
      dept_no_of_col: deptNoOfCol === '' ? 0 : Number(deptNoOfCol),
      store_code: storeCode.trim() || undefined,
      image_link: imageLink.trim() || undefined,
    };

    try {
      if (department) {
        await updateDepartment(department._id, payload);
      } else {
        await createDepartment(payload);
      }
      onSuccess();
    } catch (err: any) {
      if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
        setError('This Department ID already exists');
      } else {
        setError(err.message || 'Failed to save department');
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

  const handleDeptNoOfColChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setDeptNoOfCol('');
    } else {
      const numValue = parseInt(value, 10);
      if (!Number.isNaN(numValue) && numValue >= 0) {
        setDeptNoOfCol(numValue);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{department ? 'Edit Department' : 'Create Department'}</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            fullWidth
            label="Department ID"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            required
            disabled={!!department}
            helperText={
              department
                ? 'ID cannot be changed when editing'
                : 'Unique department identifier'
            }
          />

          <TextField
            fullWidth
            label="Department Name"
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
            required
          />

          <TextField
            fullWidth
            label="Department Type ID"
            value={deptTypeId}
            onChange={(e) => setDeptTypeId(e.target.value)}
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
            label="Number of Columns"
            value={deptNoOfCol}
            onChange={handleDeptNoOfColChange}
            type="number"
            helperText="Optional, defaults to 0"
          />

          <TextField
            fullWidth
            label="Store Code"
            value={storeCode}
            onChange={(e) => setStoreCode(e.target.value)}
          />

          <ImageUpload
            label="Department Image"
            value={imageLink}
            onChange={(url) => setImageLink(url)}
            folder="departments"
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : department ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
