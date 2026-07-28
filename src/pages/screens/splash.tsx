import type { ProjectSettingsConfig } from 'src/services/project-settings';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';
import { ColorField } from 'src/components/project-settings/color-field';
import { ImageField } from 'src/components/project-settings/image-field';
import { PermissionButton } from 'src/components/permission-button/permission-button';
import { AppPreview, livePreviewAvailable } from 'src/components/flutter-preview/app-preview';
import { PhonePreview, statusColorFor } from 'src/components/phone-preview/phone-preview';
import { useProjectSettings } from 'src/components/project-settings/use-project-settings';

// ----------------------------------------------------------------------

// Mirrors the splash keys in the backend's EDITABLE_FIELDS. Only these are
// sent on save, so the App Branding page's fields are left untouched.
const SPLASH_FIELDS: (keyof ProjectSettingsConfig)[] = [
  'splash_logo_url',
  'splash_logo_size',
  'splash_background_color',
  'splash_background_image_url',
  'splash_tagline',
  'splash_tagline_color',
  'splash_animation',
  'splash_duration_ms',
  'splash_show_loader',
];

const ANIMATIONS = [
  { value: '', label: 'App default (fade + scale)' },
  { value: 'fade_scale', label: 'Fade + scale' },
  { value: 'fade', label: 'Fade only' },
  { value: 'scale', label: 'Scale only' },
  { value: 'none', label: 'No animation' },
];

const DEFAULT_LOGO_SIZE = 300;
const DEFAULT_DURATION_MS = 2000;

// Kept in sync with NUMERIC_FIELDS in routes/admin/project-settings.js so the
// panel rejects out-of-range values before the request goes out.
const LOGO_SIZE_RANGE = { min: 40, max: 600 };
const DURATION_RANGE = { min: 0, max: 10000 };

function numberError(value: string, { min, max }: { min: number; max: number }): boolean {
  if (!value) return false;
  const parsed = Number(value);
  return !Number.isFinite(parsed) || parsed < min || parsed > max;
}

// ----------------------------------------------------------------------

export default function Page() {
  const {
    config,
    clientName,
    projectCode,
    loading,
    saving,
    error,
    saved,
    set,
    setText,
    save,
    dismissSaved,
  } = useProjectSettings();

  const [liveMode, setLiveMode] = useState(false);
  const liveAvailable = livePreviewAvailable();

  const logoSizeInvalid = numberError(config.splash_logo_size ?? '', LOGO_SIZE_RANGE);
  const durationInvalid = numberError(config.splash_duration_ms ?? '', DURATION_RANGE);

  const previewLogoSize = Number(config.splash_logo_size) || DEFAULT_LOGO_SIZE;
  const previewDuration = Number(config.splash_duration_ms ?? '') || DEFAULT_DURATION_MS;

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
          <Typography variant="h4">Splash Screen</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {clientName} ({projectCode}) — shown while the mobile app starts up. Changes apply on
            the app&apos;s next launch, no rebuild needed.
          </Typography>
        </Box>
        <PermissionButton section="dynamicSection" action="edit" fallback="disable">
          <Button
            variant="contained"
            disabled={saving || logoSizeInvalid || durationInvalid}
            onClick={() => save(SPLASH_FIELDS)}
            startIcon={
              saving ? (
                <CircularProgress size={16} />
              ) : (
                <Iconify icon={'solar:diskette-bold' as any} />
              )
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
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Splash Screen
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Leave a field empty to use the app&apos;s built-in default.
            </Typography>

            <Stack spacing={3}>
              <ImageField
                label="Splash Logo"
                value={config.splash_logo_url ?? ''}
                folder="branding"
                helperText="Falls back to the app logo when empty"
                onChange={set('splash_logo_url')}
              />

              <TextField
                fullWidth
                size="small"
                type="number"
                label="Logo Size"
                value={config.splash_logo_size ?? ''}
                error={logoSizeInvalid}
                helperText={
                  logoSizeInvalid
                    ? `Between ${LOGO_SIZE_RANGE.min} and ${LOGO_SIZE_RANGE.max}`
                    : `Height in dp — default ${DEFAULT_LOGO_SIZE}`
                }
                onChange={setText('splash_logo_size')}
              />

              <Divider />

              <ColorField
                label="Background"
                hint="Splash background — defaults to the app background colour"
                value={config.splash_background_color ?? ''}
                onChange={set('splash_background_color')}
              />

              <ImageField
                label="Background Image"
                value={config.splash_background_image_url ?? ''}
                folder="branding"
                helperText="Optional full-screen image drawn behind the logo"
                onChange={set('splash_background_image_url')}
              />

              <Divider />

              <TextField
                fullWidth
                size="small"
                label="Tagline"
                placeholder="Shown under the logo"
                value={config.splash_tagline ?? ''}
                helperText="Leave empty to show no tagline"
                onChange={setText('splash_tagline')}
              />

              <ColorField
                label="Tagline Colour"
                hint="Defaults to the app's secondary text colour"
                value={config.splash_tagline_color ?? ''}
                onChange={set('splash_tagline_color')}
              />

              <Divider />

              <TextField
                select
                fullWidth
                size="small"
                label="Animation"
                value={config.splash_animation ?? ''}
                helperText="How the logo enters"
                onChange={setText('splash_animation')}
              >
                {ANIMATIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                size="small"
                type="number"
                label="Minimum Duration (ms)"
                value={config.splash_duration_ms ?? ''}
                error={durationInvalid}
                helperText={
                  durationInvalid
                    ? `Between ${DURATION_RANGE.min} and ${DURATION_RANGE.max}`
                    : `How long the splash is held even if startup finishes sooner — default ${DEFAULT_DURATION_MS}`
                }
                onChange={setText('splash_duration_ms')}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={(config.splash_show_loader ?? 'true') !== 'false'}
                    onChange={(e) => set('splash_show_loader')(e.target.checked ? 'true' : 'false')}
                  />
                }
                label="Show loading spinner"
              />
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ p: 3, position: 'sticky', top: 24 }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
              <Box>
                <Typography variant="h6" sx={{ mb: 0.5 }}>
                  Preview
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                  {liveMode
                    ? "The app's own splash screen, with these settings applied."
                    : 'Approximate — the device renders at its own scale.'}
                </Typography>
              </Box>

              {liveAvailable && (
                <FormControlLabel
                  sx={{ mr: 0 }}
                  control={
                    <Switch
                      size="small"
                      checked={liveMode}
                      onChange={(e) => setLiveMode(e.target.checked)}
                    />
                  }
                  label={<Typography variant="caption">Live app</Typography>}
                />
              )}
            </Stack>

            {liveMode && liveAvailable ? (
              <AppPreview screen="splash" config={config} showStoreControls={false} />
            ) : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <PhonePreview
                    bgcolor={config.splash_background_color || '#ffffff'}
                    statusColor={statusColorFor(config.splash_background_color)}
                    backgroundImage={config.splash_background_image_url || undefined}
                  >
                    <Stack
                      spacing={3}
                      sx={{ flex: 1, alignItems: 'center', justifyContent: 'center', px: 3 }}
                    >
                      {config.splash_logo_url ? (
                        <Box
                          component="img"
                          alt="Splash logo"
                          src={config.splash_logo_url}
                          sx={{
                            maxWidth: '70%',
                            height: previewLogoSize / 3,
                            objectFit: 'contain',
                          }}
                        />
                      ) : (
                        <Iconify
                          icon={'solar:gallery-bold-duotone' as any}
                          width={64}
                          sx={{ color: 'text.disabled' }}
                        />
                      )}

                      {config.splash_tagline && (
                        <Typography
                          variant="body2"
                          sx={{
                            textAlign: 'center',
                            color: config.splash_tagline_color || 'text.secondary',
                          }}
                        >
                          {config.splash_tagline}
                        </Typography>
                      )}

                      {(config.splash_show_loader ?? 'true') !== 'false' && (
                        <CircularProgress size={24} />
                      )}
                    </Stack>
                  </PhonePreview>
                </Box>

                <Typography
                  variant="caption"
                  sx={{ display: 'block', mt: 2, color: 'text.secondary' }}
                >
                  Held for at least {previewDuration} ms on launch.
                </Typography>
              </>
            )}
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={saved}
        autoHideDuration={3000}
        onClose={dismissSaved}
        message="App settings saved — live for the app on next launch"
      />
    </Container>
  );
}
