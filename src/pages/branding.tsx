import type { ProjectSettingsConfig } from 'src/services/project-settings';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { uploadImage } from 'src/services/upload';
import { getProjectSettings, updateProjectSettings } from 'src/services/project-settings';

import { Iconify } from 'src/components/iconify';
import { PermissionButton } from 'src/components/permission-button/permission-button';

// ----------------------------------------------------------------------

// Popular Google Fonts the mobile app can load at runtime (google_fonts pkg).
const FONT_OPTIONS = [
  'Poppins',
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Nunito',
  'Raleway',
  'Rubik',
  'Manrope',
  'DM Sans',
  'Work Sans',
  'Mulish',
  'Outfit',
  'Quicksand',
  'Josefin Sans',
  'Playfair Display',
  'Merriweather',
];

type ColorKey =
  | 'primary_color'
  | 'secondary_color'
  | 'accent_color'
  | 'background_color'
  | 'text_primary_color'
  | 'text_secondary_color'
  | 'success_color'
  | 'warning_color'
  | 'error_color'
  | 'info_color';

const COLOR_FIELDS: { key: ColorKey; label: string; hint: string }[] = [
  { key: 'primary_color', label: 'Primary', hint: 'Main brand color — app bar, buttons' },
  { key: 'secondary_color', label: 'Secondary', hint: 'Supporting brand color' },
  { key: 'accent_color', label: 'Accent', hint: 'Highlights and CTAs' },
  { key: 'background_color', label: 'Background', hint: 'Screen background' },
  { key: 'text_primary_color', label: 'Text primary', hint: 'Main text' },
  { key: 'text_secondary_color', label: 'Text secondary', hint: 'Muted text' },
  { key: 'success_color', label: 'Success', hint: 'Positive states' },
  { key: 'warning_color', label: 'Warning', hint: 'Warning states' },
  { key: 'error_color', label: 'Error', hint: 'Error states' },
  { key: 'info_color', label: 'Info', hint: 'Informational states' },
];

const HEX_COLOR = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const EMPTY_CONFIG: Partial<ProjectSettingsConfig> = {};

// ----------------------------------------------------------------------

type ColorFieldProps = {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
};

function ColorField({ label, hint, value, onChange }: ColorFieldProps) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const valid = !value || HEX_COLOR.test(value);

  return (
    <TextField
      fullWidth
      size="small"
      label={label}
      value={value}
      placeholder="App default"
      helperText={valid ? hint : 'Use hex like #RRGGBB'}
      error={!valid}
      onChange={(e) => onChange(e.target.value.trim())}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Box
              onClick={() => pickerRef.current?.click()}
              sx={{
                width: 24,
                height: 24,
                borderRadius: 0.75,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: valid && value ? value : 'transparent',
                backgroundImage:
                  valid && value
                    ? 'none'
                    : 'repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 0 0 / 12px 12px',
              }}
            >
              <input
                ref={pickerRef}
                type="color"
                value={valid && value ? value.slice(0, 7) : '#ffffff'}
                onChange={(e) => onChange(e.target.value)}
                style={{ opacity: 0, width: 0, height: 0, border: 0, padding: 0 }}
              />
            </Box>
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <Iconify
              icon={"mingcute:close-line" as any}
              width={16}
              sx={{ cursor: 'pointer', color: 'text.disabled' }}
              onClick={() => onChange('')}
            />
          </InputAdornment>
        ) : undefined,
      }}
    />
  );
}

// ----------------------------------------------------------------------

type LogoFieldProps = {
  label: string;
  value: string;
  folder: string;
  onChange: (url: string) => void;
};

function LogoField({ label, value, folder, onChange }: LogoFieldProps) {
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
          <Iconify icon={"solar:gallery-bold-duotone" as any} width={28} />
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
                  <Iconify icon={"solar:upload-bold" as any} width={16} />
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
        onChange={(e) => onChange(e.target.value.trim())}
      />
      {uploadError && <Alert severity="error">{uploadError}</Alert>}
    </Stack>
  );
}

// ----------------------------------------------------------------------

export default function Page() {
  const [config, setConfig] = useState<Partial<ProjectSettingsConfig>>(EMPTY_CONFIG);
  const [clientName, setClientName] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getProjectSettings();
      if (response.success) {
        setConfig(response.data.config as Partial<ProjectSettingsConfig>);
        setClientName(response.data.client_name);
        setProjectCode(response.data.project_code);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load project settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const set = (key: keyof ProjectSettingsConfig) => (value: string) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  const setText =
    (key: keyof ProjectSettingsConfig) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setConfig((prev) => ({ ...prev, [key]: e.target.value }));

  const invalidColor = COLOR_FIELDS.some(({ key }) => {
    const v = config[key];
    return v && !HEX_COLOR.test(v);
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      const response = await updateProjectSettings(config);
      if (response.success) {
        setConfig(response.data.config as Partial<ProjectSettingsConfig>);
        setSaved(true);
      } else {
        setError(response.message || 'Failed to save');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save project settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4">App Branding</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {clientName} ({projectCode}) — changes apply to the mobile app on next launch, no
            rebuild needed
          </Typography>
        </Box>
        <PermissionButton section="dynamicSection" action="edit" fallback="disable">
          <Button
            variant="contained"
            disabled={saving || invalidColor}
            onClick={handleSave}
            startIcon={
              saving ? <CircularProgress size={16} /> : <Iconify icon={"solar:diskette-bold" as any} />
            }
          >
            Save Changes
          </Button>
        </PermissionButton>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Identity
            </Typography>
            <Stack spacing={3}>
              <TextField
                fullWidth
                size="small"
                label="App Name"
                helperText="Shown as the app title inside the mobile app"
                value={config.app_name ?? ''}
                onChange={setText('app_name')}
              />
              <Autocomplete
                freeSolo
                options={FONT_OPTIONS}
                value={config.font_family ?? ''}
                onInputChange={(_, v) => set('font_family')(v)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label="Font Family"
                    helperText="Any Google Fonts family name — empty = app default (Poppins)"
                  />
                )}
              />
              <Divider />
              <LogoField
                label="App Logo"
                value={config.logo_url ?? ''}
                folder="branding"
                onChange={set('logo_url')}
              />
              <LogoField
                label="Splash Logo"
                value={config.splash_logo_url ?? ''}
                folder="branding"
                onChange={set('splash_logo_url')}
              />
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Theme Colors
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Leave a color empty to use the app&apos;s built-in default. Light/dark shades are
              derived automatically.
            </Typography>
            <Grid container spacing={2}>
              {COLOR_FIELDS.map(({ key, label, hint }) => (
                <Grid key={key} size={{ xs: 12, sm: 6 }}>
                  <ColorField
                    label={label}
                    hint={hint}
                    value={config[key] ?? ''}
                    onChange={set(key)}
                  />
                </Grid>
              ))}
            </Grid>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Contact
            </Typography>
            <Stack spacing={3}>
              <TextField
                fullWidth
                size="small"
                label="Contact Email"
                value={config.contact_email ?? ''}
                onChange={setText('contact_email')}
              />
              <TextField
                fullWidth
                size="small"
                label="Contact Phone"
                value={config.contact_phone ?? ''}
                onChange={setText('contact_phone')}
              />
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              App Updates
            </Typography>
            <Stack spacing={3}>
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Minimum Version"
                  helperText="Older installs are forced to update"
                  value={config.min_app_version ?? ''}
                  onChange={setText('min_app_version')}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Latest Version"
                  value={config.latest_app_version ?? ''}
                  onChange={setText('latest_app_version')}
                />
              </Stack>
              <TextField
                fullWidth
                size="small"
                label="Android Store URL"
                value={config.android_store_url ?? ''}
                onChange={setText('android_store_url')}
              />
              <TextField
                fullWidth
                size="small"
                label="iOS Store URL"
                value={config.ios_store_url ?? ''}
                onChange={setText('ios_store_url')}
              />
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={2}
                label="Force Update Message"
                value={config.force_update_message ?? ''}
                onChange={setText('force_update_message')}
              />
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={saved}
        autoHideDuration={3000}
        onClose={() => setSaved(false)}
        message="Branding saved — live for the app immediately"
      />
    </Container>
  );
}
