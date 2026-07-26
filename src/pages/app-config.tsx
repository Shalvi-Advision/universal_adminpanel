import type { ProjectSettingsConfig } from 'src/services/project-settings';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Snackbar from '@mui/material/Snackbar';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';
import { PermissionButton } from 'src/components/permission-button/permission-button';
import { useProjectSettings } from 'src/components/project-settings/use-project-settings';

// ----------------------------------------------------------------------

// Non-visual app-wide settings. Theme tokens live on the Theme page and splash
// content under Screens; only these keys are sent on save.
const CONFIG_FIELDS: (keyof ProjectSettingsConfig)[] = [
  'min_app_version',
  'latest_app_version',
  'android_store_url',
  'ios_store_url',
  'force_update_message',
  'contact_email',
  'contact_phone',
  'home_feed_enabled',
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
    setText,
    save,
    dismissSaved,
  } = useProjectSettings();

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
          <Typography variant="h4">App Config</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {clientName} ({projectCode}) — release policy and support details the mobile app reads
            at launch.
          </Typography>
        </Box>
        <PermissionButton section="dynamicSection" action="edit" fallback="disable">
          <Button
            variant="contained"
            disabled={saving}
            onClick={() => save(CONFIG_FIELDS)}
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
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              App Updates
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Installs older than the minimum version are blocked at launch until the user updates.
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

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Support Contact
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Shown to users on the help and support screens.
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
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Home Screen
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              With this on, the home screen&apos;s sections and their order come from the server
              instead of being fixed in the app. Turning it off restores the built-in layout on the
              app&apos;s next launch — no release needed either way.
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={config.home_feed_enabled === 'true'}
                  onChange={(e) => set('home_feed_enabled')(e.target.checked ? 'true' : 'false')}
                />
              }
              label="Server-driven home layout"
            />
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={saved}
        autoHideDuration={3000}
        onClose={dismissSaved}
        message="App config saved"
      />
    </Container>
  );
}
