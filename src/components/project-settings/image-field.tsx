import { useRef, useState } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { uploadImage } from 'src/services/upload';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type ImageFieldProps = {
  label: string;
  value: string;
  folder: string;
  helperText?: string;
  onChange: (url: string) => void;
};

/** Upload-or-paste image field used by the project settings pages. */
export function ImageField({ label, value, folder, helperText, onChange }: ImageFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setUploading(true);
      setUploadError('');
      const result = await uploadImage(file, folder);
      onChange(result.url);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar
          variant="rounded"
          src={value || undefined}
          sx={{ width: 64, height: 64, bgcolor: 'background.neutral' }}
        >
          <Iconify icon={'solar:gallery-bold-duotone' as any} width={28} />
        </Avatar>
        <Stack spacing={0.5} sx={{ flex: 1 }}>
          <Typography variant="subtitle2">{label}</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              startIcon={
                uploading ? (
                  <CircularProgress size={14} />
                ) : (
                  <Iconify icon={'solar:upload-bold' as any} width={16} />
                )
              }
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </Button>
            {value && (
              <Button size="small" color="inherit" onClick={() => onChange('')}>
                Remove
              </Button>
            )}
          </Stack>
        </Stack>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </Stack>
      <TextField
        fullWidth
        size="small"
        label={`${label} URL`}
        value={value}
        helperText={helperText}
        onChange={(e) => onChange(e.target.value.trim())}
      />
      {uploadError && <Alert severity="error">{uploadError}</Alert>}
    </Stack>
  );
}
