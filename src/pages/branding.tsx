import type { ProjectSettingsConfig } from 'src/services/project-settings';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';
import { ImageField } from 'src/components/project-settings/image-field';
import { HEX_COLOR, ColorField } from 'src/components/project-settings/color-field';
import { PermissionButton } from 'src/components/permission-button/permission-button';
import { useProjectSettings } from 'src/components/project-settings/use-project-settings';

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

// Theme tokens only. Splash content belongs to Screens > Splash, release and
// contact details to App Config, and a save sends just the keys listed here.
const BRANDING_FIELDS: (keyof ProjectSettingsConfig)[] = [
  'app_name',
  'font_family',
  'logo_url',
  ...COLOR_FIELDS.map(({ key }) => key),
];

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

  const invalidColor = COLOR_FIELDS.some(({ key }) => {
    const v = config[key];
    return v && !HEX_COLOR.test(v);
  });

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
          <Typography variant="h4">Theme</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {clientName} ({projectCode}) — design tokens applied across every screen of the mobile
            app. Changes land on next launch, no rebuild needed.
          </Typography>
        </Box>
        <PermissionButton section="dynamicSection" action="edit" fallback="disable">
          <Button
            variant="contained"
            disabled={saving || invalidColor}
            onClick={() => save(BRANDING_FIELDS)}
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
              <ImageField
                label="App Logo"
                value={config.logo_url ?? ''}
                folder="branding"
                onChange={set('logo_url')}
              />
              <Alert severity="info" sx={{ py: 0.5 }}>
                The splash logo and the rest of the splash screen live under Mobile App &gt; App
                Settings.
              </Alert>
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
      </Grid>

      <Snackbar
        open={saved}
        autoHideDuration={3000}
        onClose={dismissSaved}
        message="Branding saved — live for the app immediately"
      />
    </Container>
  );
}
