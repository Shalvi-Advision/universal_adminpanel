import type { ChangeEvent } from 'react';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { uploadImage } from 'src/services/upload';

import { Iconify } from 'src/components/iconify';

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  helperText?: string;
  folder?: string;
}

export function ImageUpload({
  label,
  value,
  onChange,
  required = false,
  helperText,
  folder = 'ecommerce',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const result = await uploadImage(file, folder);
      onChange(result.url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClearImage = () => {
    onChange('');
    setError('');
  };

  return (
    <Stack spacing={2}>
      <Box>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {label}
            {required && <span style={{ color: 'error.main' }}> *</span>}
          </Typography>
          <Button
            size="small"
            variant="text"
            onClick={() => setShowUrlInput(!showUrlInput)}
            sx={{ minWidth: 'auto', px: 1 }}
          >
            {showUrlInput ? 'Upload File' : 'Enter URL'}
          </Button>
        </Stack>

        {showUrlInput ? (
          <TextField
            fullWidth
            size="small"
            label={`${label} URL`}
            value={value}
            onChange={handleUrlChange}
            required={required}
            helperText={helperText}
          />
        ) : (
          <Stack spacing={1}>
            <Button
              component="label"
              variant="outlined"
              disabled={uploading}
              startIcon={
                uploading ? (
                  <CircularProgress size={20} />
                ) : (
                  <Iconify icon={"solar:upload-bold" as any} />
                )
              }
              sx={{ justifyContent: 'flex-start' }}
            >
              {uploading ? 'Uploading...' : 'Choose Image File'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </Button>
            {helperText && (
              <Typography variant="caption" color="text.secondary">
                {helperText}
              </Typography>
            )}
          </Stack>
        )}
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {value && (
        <Box
          sx={{
            position: 'relative',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              component="img"
              src={value}
              alt={label}
              sx={{
                width: 120,
                height: 80,
                objectFit: 'cover',
                borderRadius: 1,
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <Box sx={{ flex: 1 }} />
            <IconButton size="small" color="error" onClick={handleClearImage}>
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
