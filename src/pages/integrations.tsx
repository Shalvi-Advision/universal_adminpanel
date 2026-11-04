import type { IntegrationValues } from 'src/services/project-settings';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/config-global';
import {
  updateSecrets,
  getIntegrations,
  revokeErpAccessKey,
  updateIntegrations,
  generateErpAccessKey,
} from 'src/services/project-settings';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const SECRET_FIELDS = [
  {
    key: 'razorpay_key_secret',
    label: 'Razorpay Key Secret',
    hint: 'Used server-side to create and verify payments. Never sent to the app.',
  },
  {
    key: 'razorpay_webhook_secret',
    label: 'Razorpay Webhook Secret',
    hint: 'Shown by Razorpay when the payment.captured webhook is created (Dashboard → Account & Settings → Webhooks). Verifies that payment-recovery alerts really came from Razorpay — a separate value from the Key Secret above.',
  },
  {
    key: 'sms_api_key',
    label: 'SMS API Key',
    hint: 'Used server-side to send login OTPs.',
  },
  {
    key: 'picker_webhook_secret',
    label: 'Picker Webhook Secret',
    hint: 'Sent as X-Webhook-Secret on every order handed off to SHALVI PICKER, and required on status updates it sends back.',
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
  const [firebaseFileName, setFirebaseFileName] = useState('');
  const [firebaseFileError, setFirebaseFileError] = useState('');
  // Shown once, right after generating — the server keeps only its hash.
  const [newErpKey, setNewErpKey] = useState('');

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

  const setPickerEnabled = (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, picker_integration_enabled: e.target.checked ? 'true' : 'false' }));

  const setErpIntegrated = (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, erp_integrated: e.target.checked ? 'true' : 'false' }));

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

  const handleGenerateErpKey = async () => {
    if (
      secretsSet.erp_access_key &&
      !window.confirm(
        'Generate a new key? The current key stops working immediately and the ERP partner must switch to the new one.'
      )
    ) {
      return;
    }
    try {
      setSaving(true);
      setError('');
      const response = await generateErpAccessKey();
      setNewErpKey(response.data.access_key);
      setSecretsSet((prev) => ({ ...prev, erp_access_key: true }));
    } catch (err: any) {
      setError(err.message || 'Failed to generate access key');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeErpKey = async () => {
    if (!window.confirm('Revoke the ERP access key? The ERP partner will no longer be able to pull or update orders.')) {
      return;
    }
    try {
      setSaving(true);
      setError('');
      await revokeErpAccessKey();
      setNewErpKey('');
      setSecretsSet((prev) => ({ ...prev, erp_access_key: false }));
      setToast('ERP access key revoked');
    } catch (err: any) {
      setError(err.message || 'Failed to revoke access key');
    } finally {
      setSaving(false);
    }
  };

  const copyErpKey = async () => {
    try {
      await navigator.clipboard.writeText(newErpKey);
      setToast('Access key copied');
    } catch {
      setToast('Copy failed — select the key and copy it manually');
    }
  };

  const handleSaveSecret = async (key: string) => {
    try {
      setSaving(true);
      setError('');
      await updateSecrets({ [key]: secretDrafts[key] ?? '' });
      setSecretDrafts((prev) => ({ ...prev, [key]: '' }));
      if (key === 'firebase_service_account_json') setFirebaseFileName('');
      setToast('Secret updated');
      await fetchIntegrations();
    } catch (err: any) {
      setError(err.message || 'Failed to save secret');
    } finally {
      setSaving(false);
    }
  };

  // A file input rather than a text field: a plain <input> mangles the
  // private key's embedded newlines on paste, which a copy from a file
  // picker's read-as-text never does.
  const handleFirebaseFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setFirebaseFileError('');
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      try {
        JSON.parse(text);
      } catch {
        setFirebaseFileError('That file is not valid JSON');
        setFirebaseFileName('');
        setSecretDrafts((prev) => ({ ...prev, firebase_service_account_json: '' }));
        return;
      }
      setFirebaseFileName(file.name);
      setSecretDrafts((prev) => ({ ...prev, firebase_service_account_json: text }));
    };
    reader.onerror = () => setFirebaseFileError('Could not read that file');
    reader.readAsText(file);
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

              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle2">Firebase Service Account (push notifications)</Typography>
                  <Chip
                    size="small"
                    color={secretsSet.firebase_service_account_json ? 'success' : 'default'}
                    label={secretsSet.firebase_service_account_json ? 'Set' : 'Not set'}
                  />
                </Stack>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  The Admin SDK service account JSON for this tenant&apos;s own Firebase project — needed
                  because each app flavor mints push tokens against its own project, not a shared one.
                  Leave unset to fall back to the shared project.
                </Typography>
                {firebaseFileError && <Alert severity="error">{firebaseFileError}</Alert>}
                <Stack direction="row" spacing={1}>
                  <Button component="label" variant="outlined" sx={{ height: 40, flexShrink: 0 }}>
                    {firebaseFileName || 'Choose JSON file'}
                    <input type="file" accept=".json" hidden onChange={handleFirebaseFileSelected} />
                  </Button>
                  <Button
                    variant="outlined"
                    disabled={saving || !(secretDrafts.firebase_service_account_json ?? '').trim()}
                    onClick={() => handleSaveSecret('firebase_service_account_json')}
                    sx={{ height: 40 }}
                  >
                    Update
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              ERP / SAP Integration
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Turn this on only if this tenant&apos;s fulfillment status is managed by their own
              external ERP or SAP system — it controls whether Accepted By Store and In Packaging
              appear as order-status tabs and choices in the Orders page. Unrelated to SHALVI
              PICKER below: a tenant can be ERP-integrated with no Picker involvement, or vice
              versa.
            </Typography>
            <FormControlLabel
              control={
                <Switch checked={values.erp_integrated === 'true'} onChange={setErpIntegrated} />
              }
              label="This tenant's fulfillment is ERP/SAP-integrated"
            />

            {values.erp_integrated === 'true' && (
              <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <Typography variant="subtitle1">ERP Partner API</Typography>
                  <Chip
                    size="small"
                    color={secretsSet.erp_access_key ? 'success' : 'default'}
                    label={secretsSet.erp_access_key ? 'Key set' : 'No key'}
                  />
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  The ERP partner pulls orders and marks them Accepted By Store / In Packaging with
                  this access key. Save the switch above first — the APIs only work while it is on.
                </Typography>

                <Stack spacing={0.5} sx={{ mb: 2 }}>
                  {['push_order_api', 'update_order_status_api'].map((path) => (
                    <Typography key={path} variant="caption" sx={{ fontFamily: 'monospace' }}>
                      POST {CONFIG.apiBaseUrl}/{path}
                    </Typography>
                  ))}
                </Stack>

                {newErpKey && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Copy this key now and share it with the ERP partner securely. It will not be
                      shown again.
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        fullWidth
                        size="small"
                        value={newErpKey}
                        slotProps={{ input: { readOnly: true, sx: { fontFamily: 'monospace' } } }}
                      />
                      <Button variant="contained" onClick={copyErpKey}>
                        Copy
                      </Button>
                    </Stack>
                  </Alert>
                )}

                <Stack direction="row" spacing={1}>
                  <Button variant="contained" disabled={saving} onClick={handleGenerateErpKey}>
                    {secretsSet.erp_access_key ? 'Regenerate key' : 'Generate key'}
                  </Button>
                  {secretsSet.erp_access_key && (
                    <Button color="error" disabled={saving} onClick={handleRevokeErpKey}>
                      Revoke
                    </Button>
                  )}
                </Stack>
              </Box>
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              SHALVI PICKER
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Warehouse picking + rider delivery. When enabled, an order is handed off the moment a
              store accepts it, and Picker reports picking/delivery progress back here automatically.
              Set the webhook URL and secret (below, under Server Secrets) first, confirm with a pilot
              order, then turn this on.
            </Typography>
            <Stack spacing={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={values.picker_integration_enabled === 'true'}
                    onChange={setPickerEnabled}
                  />
                }
                label="Enable SHALVI PICKER integration"
              />
              <TextField
                fullWidth
                size="small"
                label="Picker Webhook URL"
                placeholder="https://pickerapi.shalviadvision.com"
                helperText="Base URL of the Picker backend — orders are POSTed to <this>/api/webhook/order"
                value={values.picker_webhook_url ?? ''}
                onChange={setValue('picker_webhook_url')}
              />
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
