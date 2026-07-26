import type { IntegrationValues } from 'src/services/project-settings';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { getIntegrations, updateSecrets, updateIntegrations } from 'src/services/project-settings';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const SECRET_FIELDS = [
  {
    key: 'razorpay_key_secret',
    label: 'Razorpay Key Secret',
    hint: 'Used server-side to create and verify payments. Never sent to the app.',
  },
  {
    key: 'sms_api_key',
    label: 'SMS API Key',
    hint: 'Used server-side to send login OTPs.',
  },
];

// ----------------------------------------------------------------------

export default function Page() {
  const [values, setValues] = useState<Partial<IntegrationValues>>({});
  const [secretsSet, setSecretsSet] = useState<Record<string, boolean>>({});
  const [secretDrafts, setSecretDrafts] = useState<Record<string, string>>({});
  const [projectCode, setProjectCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getIntegrations();
      if (response.success) {
        setValues(response.data.integrations);
        setSecretsSet(response.data.secrets_set ?? {});
        setProjectCode(response.data.project_code);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const setValue = (key: keyof IntegrationValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [key]: e.target.value.trim() }));

  const handleSavePublishable = async () => {
    try {
      setSaving(true);
      setError('');
      const response = await updateIntegrations(values);
      if (response.success) {
        setValues(response.data.integrations);
        setToast('Integrations saved');
      } else {
        setError(response.message || 'Failed to save');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save integrations');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecret = async (key: string) => {
    try {
      setSaving(true);
      setError('');
      await updateSecrets({ [key]: secretDrafts[key] ?? '' });
      setSecretDrafts((prev) => ({ ...prev, [key]: '' }));
      setToast('Secret updated');
      await fetchIntegrations();
    } catch (err: any) {
      setError(err.message || 'Failed to save secret');
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
          <Typography variant="h4">Integrations</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {projectCode} — payment and maps credentials. Super admin only.
          </Typography>
        </Box>
        <Button
          variant="contained"
          disabled={saving}
          onClick={handleSavePublishable}
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
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Publishable Values
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Served to the mobile app at launch. These are safe to expose — a maps key ships inside
              the app binary regardless, so restrict it by bundle id in Google Cloud.
            </Typography>
            <Stack spacing={3}>
              <TextField
                fullWidth
                size="small"
                label="Razorpay Key ID"
                placeholder="rzp_live_…"
                helperText="The publishable half of the Razorpay key pair"
                value={values.razorpay_key_id ?? ''}
                onChange={setValue('razorpay_key_id')}
              />
              <TextField
                fullWidth
                size="small"
                label="Currency"
                placeholder="INR"
                helperText="3-letter ISO code"
                value={values.currency ?? ''}
                onChange={setValue('currency')}
              />
              <TextField
                fullWidth
                size="small"
                label="Google Maps API Key"
                helperText="Used for address lookup and delivery distance"
                value={values.google_maps_api_key ?? ''}
                onChange={setValue('google_maps_api_key')}
              />
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Server Secrets
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Write-only. Stored server-side and never returned by any endpoint, so an existing
              secret can be replaced but not read back.
            </Typography>
            <Stack spacing={4}>
              {SECRET_FIELDS.map(({ key, label, hint }) => (
                <Stack key={key} spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2">{label}</Typography>
                    <Chip
                      size="small"
                      color={secretsSet[key] ? 'success' : 'default'}
                      label={secretsSet[key] ? 'Set' : 'Not set'}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      fullWidth
                      size="small"
                      type="password"
                      autoComplete="new-password"
                      placeholder={secretsSet[key] ? 'Enter a new value to replace' : 'Enter value'}
                      helperText={hint}
                      value={secretDrafts[key] ?? ''}
                      onChange={(e) =>
                        setSecretDrafts((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                    />
                    <Button
                      variant="outlined"
                      disabled={saving || !(secretDrafts[key] ?? '').trim()}
                      onClick={() => handleSaveSecret(key)}
                      sx={{ height: 40 }}
                    >
                      Update
                    </Button>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={() => setToast('')}
        message={toast}
      />
    </Container>
  );
}
