import type { DigitalCartUiSettings } from 'src/services/digital-cart';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Slider from '@mui/material/Slider';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { uploadImage } from 'src/services/upload';
import {
  getDigitalCartUiSettings,
  updateDigitalCartUiSettings,
} from 'src/services/digital-cart';

import { Iconify } from 'src/components/iconify';
import { PermissionButton } from 'src/components/permission-button/permission-button';

// ----------------------------------------------------------------------

const HEX_COLOR = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

type ColorKey = 'primary_color' | 'accent_color' | 'background_color' | 'card_color' | 'text_color';

const COLOR_FIELDS: { key: ColorKey; label: string; hint: string }[] = [
  { key: 'primary_color', label: 'Primary', hint: 'Header background + offer price' },
  { key: 'accent_color', label: 'Accent', hint: 'Offer badge color' },
  { key: 'background_color', label: 'Background', hint: 'Page background' },
  { key: 'card_color', label: 'Card', hint: 'Product card background' },
  { key: 'text_color', label: 'Text', hint: 'Product name / body text' },
];

const TOGGLE_FIELDS: { key: keyof DigitalCartUiSettings; label: string }[] = [
  { key: 'show_logo', label: 'Show logo in header' },
  { key: 'show_discount_percent', label: 'Show "% OFF" chip' },
  { key: 'show_product_code', label: 'Show product code' },
  { key: 'show_search', label: 'Show search bar' },
  { key: 'show_last_updated', label: 'Show "Updated on" date' },
];

// Empty color = fall back to App Branding / built-in theme on the website
const PREVIEW_FALLBACKS: Record<ColorKey, string> = {
  primary_color: '#e53935',
  accent_color: '#ff8f00',
  background_color: '#f7f7f9',
  card_color: '#ffffff',
  text_color: '#1c1c28',
};

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
      placeholder="Use branding default"
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
              icon={'mingcute:close-line' as any}
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
  value: string;
  onChange: (url: string) => void;
};

function LogoField({ value, onChange }: LogoFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setUploading(true);
      setUploadError('');
      const result = await uploadImage(file, 'digital-cart');
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
          <Typography variant="subtitle2">Header logo</Typography>
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
        label="Logo URL"
        placeholder="Project branding logo (default)"
        helperText="Leave empty to use the logo from App Branding"
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
      />
      {uploadError && <Alert severity="error">{uploadError}</Alert>}
    </Stack>
  );
}

// ----------------------------------------------------------------------

export default function Page() {
  const [settings, setSettings] = useState<DigitalCartUiSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getDigitalCartUiSettings();
      if (response.success) setSettings(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const setField = <K extends keyof DigitalCartUiSettings>(
    key: K,
    value: DigitalCartUiSettings[K]
  ) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!settings) return;

    const invalid = COLOR_FIELDS.find(
      (f) => settings[f.key] && !HEX_COLOR.test(settings[f.key])
    );
    if (invalid) {
      setError(`${invalid.label} color must be hex like #RRGGBB`);
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const response = await updateDigitalCartUiSettings(settings);
      setSettings(response.data);
      setSuccess('Saved — the public digital cart website updates on next refresh.');
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const previewColor = (key: ColorKey) =>
    settings && settings[key] && HEX_COLOR.test(settings[key])
      ? settings[key]
      : PREVIEW_FALLBACKS[key];

  return (
    <Container maxWidth="xl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="h4">Digital Cart UI</Typography>
        <PermissionButton section="digitalCart" action="edit">
          <Button
            variant="contained"
            disabled={saving || loading || !settings}
            onClick={handleSave}
            startIcon={
              saving ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <Iconify icon={'solar:diskette-bold' as any} />
              )
            }
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </PermissionButton>
      </Stack>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Appearance of the public digital cart website for the selected project. Colors left empty
        fall back to the project&apos;s App Branding colors.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {loading || !settings ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Stack spacing={3}>
              <Card>
                <CardHeader title="Logo" />
                <CardContent>
                  <LogoField
                    value={settings.logo_url}
                    onChange={(url) => setField('logo_url', url)}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Text" />
                <CardContent>
                  <Stack spacing={2.5}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Header title"
                      placeholder="Project name (default)"
                      helperText="Leave empty to show the client name from project branding"
                      value={settings.header_title}
                      onChange={(e) => setField('header_title', e.target.value)}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Tagline"
                      value={settings.tagline}
                      onChange={(e) => setField('tagline', e.target.value)}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Footer note"
                      value={settings.footer_note}
                      onChange={(e) => setField('footer_note', e.target.value)}
                    />
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Colors" />
                <CardContent>
                  <Grid container spacing={2.5}>
                    {COLOR_FIELDS.map((field) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={field.key}>
                        <ColorField
                          label={field.label}
                          hint={field.hint}
                          value={settings[field.key]}
                          onChange={(value) => setField(field.key, value)}
                        />
                      </Grid>
                    ))}
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Card corner radius: {settings.card_radius ?? 14}px
                      </Typography>
                      <Slider
                        value={settings.card_radius ?? 14}
                        min={0}
                        max={40}
                        step={1}
                        valueLabelDisplay="auto"
                        marks={[
                          { value: 0, label: 'Square' },
                          { value: 14, label: 'Default' },
                          { value: 40, label: 'Round' },
                        ]}
                        onChange={(_, value) => setField('card_radius', value as number)}
                        sx={{ maxWidth: 420, mx: 1 }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Elements" />
                <CardContent>
                  <Stack>
                    {TOGGLE_FIELDS.map((field) => (
                      <FormControlLabel
                        key={field.key}
                        label={field.label}
                        control={
                          <Switch
                            checked={Boolean(settings[field.key])}
                            onChange={(e) => setField(field.key, e.target.checked as any)}
                          />
                        }
                      />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ position: 'sticky', top: 24 }}>
              <CardHeader title="Live preview" />
              <CardContent sx={{ display: 'flex', justifyContent: 'center', pb: 4 }}>
                {/* Phone shell */}
                <Box
                  sx={{
                    width: 310,
                    bgcolor: '#17171c',
                    borderRadius: '44px',
                    p: '11px',
                    position: 'relative',
                    boxShadow:
                      '0 18px 44px rgba(0,0,0,0.35), inset 0 0 0 2px #3c3c46, inset 0 0 0 5px #101014',
                  }}
                >
                  {/* Side buttons */}
                  <Box sx={{ position: 'absolute', right: -3, top: 130, width: 3, height: 62, bgcolor: '#3c3c46', borderRadius: 1 }} />
                  <Box sx={{ position: 'absolute', left: -3, top: 104, width: 3, height: 26, bgcolor: '#3c3c46', borderRadius: 1 }} />
                  <Box sx={{ position: 'absolute', left: -3, top: 142, width: 3, height: 44, bgcolor: '#3c3c46', borderRadius: 1 }} />

                  {/* Screen */}
                  <Box
                    sx={{
                      borderRadius: '33px',
                      overflow: 'hidden',
                      bgcolor: previewColor('background_color'),
                      height: 590,
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                    }}
                  >
                    {/* Dynamic island */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 9,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 84,
                        height: 22,
                        bgcolor: '#000',
                        borderRadius: 999,
                        zIndex: 3,
                      }}
                    />

                    {/* Status bar */}
                    <Box
                      sx={{
                        bgcolor: previewColor('primary_color'),
                        color: '#fff',
                        pt: '12px',
                        pb: 0.5,
                        px: 2.75,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Typography sx={{ fontSize: 12, fontWeight: 700 }}>9:41</Typography>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        {/* Signal bars */}
                        <Stack direction="row" spacing="2px" alignItems="flex-end">
                          {[4, 6, 8, 10].map((h) => (
                            <Box key={h} sx={{ width: 3, height: h, bgcolor: '#fff', borderRadius: 0.25 }} />
                          ))}
                        </Stack>
                        {/* Battery */}
                        <Box
                          sx={{
                            width: 22,
                            height: 11,
                            border: '1.5px solid rgba(255,255,255,0.9)',
                            borderRadius: '3px',
                            p: '1.5px',
                            display: 'flex',
                          }}
                        >
                          <Box sx={{ width: '70%', bgcolor: '#fff', borderRadius: '1px' }} />
                        </Box>
                      </Stack>
                    </Box>

                    {/* App header */}
                    <Box sx={{ bgcolor: previewColor('primary_color'), color: '#fff', px: 2, pt: 1, pb: 1.75 }}>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        {settings.show_logo && (
                          <Avatar
                            variant="rounded"
                            src={settings.logo_url || undefined}
                            sx={{ width: 34, height: 34, bgcolor: '#fff', borderRadius: 1.5 }}
                          >
                            <Iconify
                              icon={'solar:gallery-bold-duotone' as any}
                              width={18}
                              sx={{ color: 'text.disabled' }}
                            />
                          </Avatar>
                        )}
                        <Box sx={{ minWidth: 0 }}>
                          <Typography noWrap sx={{ fontSize: 15, fontWeight: 700, lineHeight: 1.25 }}>
                            {settings.header_title || 'Store Name'}
                          </Typography>
                          {settings.tagline && (
                            <Typography noWrap sx={{ fontSize: 10.5, opacity: 0.9 }}>
                              {settings.tagline}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                      {settings.show_search && (
                        <Box
                          sx={{
                            mt: 1.25,
                            bgcolor: '#fff',
                            borderRadius: 1.5,
                            px: 1.5,
                            py: 0.6,
                            fontSize: 11.5,
                            color: 'text.disabled',
                          }}
                        >
                          Search products or offers…
                        </Box>
                      )}
                    </Box>

                    {/* Scrollable offer list */}
                    <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1.5 }}>
                      {settings.show_last_updated && (
                        <Typography sx={{ fontSize: 10, color: 'text.disabled', mb: 1 }}>
                          122 offers · Updated 20 July 2026
                        </Typography>
                      )}
                      <Stack spacing={1.25}>
                        {[
                          { badge: 'ONLY 99/-', name: 'CHINGS SCHEZAN CHUTNEY 590GM (BOTTLE)', price: '₹99', mrp: '₹180', off: '45% OFF', code: '17457' },
                          { badge: 'BUY1GET1', name: 'D LECTA CHEESE SPREAD 150G', price: '₹49.50', mrp: '₹99', off: '50% OFF', code: '37674' },
                          { badge: 'ON MRP 81 OFF', name: 'RED LABEL NATURAL TEA 500GM#', price: '₹249', mrp: '₹330', off: '25% OFF', code: '7437' },
                        ].map((item) => (
                          <Box
                            key={item.code}
                            sx={{
                              bgcolor: previewColor('card_color'),
                              borderRadius: `${settings.card_radius ?? 14}px`,
                              p: 1.5,
                              boxShadow: '0 1px 4px rgba(20,20,40,0.08)',
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                display: 'inline-block',
                                bgcolor: previewColor('accent_color'),
                                color: '#fff',
                                fontSize: 9.5,
                                fontWeight: 700,
                                px: 1,
                                py: 0.3,
                                borderRadius: 999,
                                mb: 0.75,
                              }}
                            >
                              {item.badge}
                            </Box>
                            <Typography
                              sx={{ fontSize: 12, fontWeight: 600, color: previewColor('text_color'), lineHeight: 1.35 }}
                            >
                              {item.name}
                            </Typography>
                            <Stack direction="row" spacing={0.75} alignItems="baseline" mt={0.5}>
                              <Typography sx={{ fontSize: 15, fontWeight: 800, color: previewColor('primary_color') }}>
                                {item.price}
                              </Typography>
                              <Typography
                                sx={{ fontSize: 10.5, textDecoration: 'line-through', color: 'text.disabled' }}
                              >
                                {item.mrp}
                              </Typography>
                              {settings.show_discount_percent && (
                                <Box
                                  component="span"
                                  sx={{
                                    fontSize: 9.5,
                                    fontWeight: 700,
                                    color: '#1b7a2f',
                                    bgcolor: '#e3f6e8',
                                    px: 0.75,
                                    py: 0.2,
                                    borderRadius: 999,
                                  }}
                                >
                                  {item.off}
                                </Box>
                              )}
                            </Stack>
                            {settings.show_product_code && (
                              <Typography sx={{ fontSize: 9.5, color: 'text.disabled', mt: 0.4 }}>
                                Code: {item.code}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Stack>

                      {settings.footer_note && (
                        <Typography
                          sx={{ fontSize: 9.5, color: 'text.disabled', textAlign: 'center', mt: 1.5 }}
                        >
                          {settings.footer_note}
                        </Typography>
                      )}
                    </Box>

                    {/* Home indicator */}
                    <Box sx={{ py: 0.75, display: 'flex', justifyContent: 'center' }}>
                      <Box sx={{ width: 104, height: 4, bgcolor: 'rgba(0,0,0,0.35)', borderRadius: 999 }} />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}
