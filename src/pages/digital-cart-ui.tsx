import type { DigitalCartUiSettings, DigitalCartGroupDefaults } from 'src/services/digital-cart';

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
import ToggleButton from '@mui/material/ToggleButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

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
  { key: 'primary_color', label: 'Primary', hint: 'Logo text + offer price accents' },
  { key: 'accent_color', label: 'Accent', hint: 'Highlight color' },
  { key: 'background_color', label: 'Background', hint: 'Page background' },
  { key: 'card_color', label: 'Card', hint: 'Product card background' },
  { key: 'text_color', label: 'Text', hint: 'Headings / body text' },
];

const TOGGLE_FIELDS: { key: keyof DigitalCartUiSettings; label: string }[] = [
  { key: 'show_logo', label: 'Show logo on home screen' },
  { key: 'show_discount_percent', label: 'Show "% OFF" pill on products' },
  { key: 'show_product_code', label: 'Show product code' },
  { key: 'show_search', label: 'Show search icon' },
  { key: 'show_last_updated', label: 'Show "Updated on" date' },
  { key: 'show_bottom_nav', label: 'Show bottom navigation on offer page' },
];

// Empty color = fall back to App Branding / built-in theme on the website
const PREVIEW_FALLBACKS: Record<ColorKey, string> = {
  primary_color: '#e53935',
  accent_color: '#ff8f00',
  background_color: '#faf9f7',
  card_color: '#ffffff',
  text_color: '#1c1c28',
};

// Display order of the offer groups. The actual default visuals come from
// the backend (group_style_defaults in the settings response); this local
// copy is only a fallback while loading / for older backends.
const GROUP_ORDER = ['percent_off', 'buy_1_get_1', 'buy_2_get_1', 'rs_off', 'special_price', 'other_offers'];

const FALLBACK_GROUP_DEFAULTS: Record<string, DigitalCartGroupDefaults> = {
  percent_off: { name: '% Off', color: '#e53935', label: 'BIG SAVINGS!', line1: '%', line2: 'OFF', ribbon: '' },
  buy_1_get_1: { name: 'Buy 1 Get 1', color: '#8e24aa', label: 'LIMITED TIME OFFER!', line1: 'BUY 1', line2: 'GET 1', ribbon: 'FREE' },
  buy_2_get_1: { name: 'Buy 2 Get 1', color: '#43a047', label: "DON'T MISS OUT!", line1: 'BUY 2', line2: 'GET 1', ribbon: 'FREE' },
  rs_off: { name: 'Rs. Off', color: '#00897b', label: 'SHOP MORE SAVE MORE', line1: '₹', line2: 'OFF', ribbon: '' },
  special_price: { name: 'Special Price', color: '#1e88e5', label: 'BEST PRICES!', line1: 'SPECIAL', line2: 'PRICES', ribbon: '' },
  other_offers: { name: 'Other Offers', color: '#fb8c00', label: 'SPECIAL OFFER', line1: 'MEGA', line2: 'OFFERS', ribbon: '' },
};

const PREVIEW_PRODUCTS = [
  { name: 'CHINGS SCHEZWAN CHUTNEY 250G', code: '17457', mrp: '₹180', price: '₹99', off: '45% OFF' },
  { name: 'D LECTA CHEESE SPREAD 150G', code: '37674', mrp: '₹99', price: '₹49.50', off: '50% OFF' },
  { name: 'RED LABEL TEA 500GM', code: '7437', mrp: '₹330', price: '₹249', off: '25% OFF' },
];

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

type BannerImageFieldProps = {
  value: string;
  onChange: (url: string) => void;
};

function BannerImageField({ value, onChange }: BannerImageFieldProps) {
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
    <Stack spacing={0.5}>
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          fullWidth
          size="small"
          label="Banner image"
          placeholder="Optional — replaces the text banner on the offer page"
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
        />
        <Button
          size="small"
          variant="outlined"
          sx={{ flexShrink: 0 }}
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? <CircularProgress size={14} /> : 'Upload'}
        </Button>
        {value && (
          <Button size="small" color="inherit" onClick={() => onChange('')}>
            Clear
          </Button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </Stack>
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
  const [previewScreen, setPreviewScreen] = useState<'home' | 'offer'>('home');
  const [groupDefaults, setGroupDefaults] =
    useState<Record<string, DigitalCartGroupDefaults>>(FALLBACK_GROUP_DEFAULTS);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getDigitalCartUiSettings();
      if (response.success) {
        setSettings(response.data);
        if (response.group_style_defaults) {
          setGroupDefaults({ ...FALLBACK_GROUP_DEFAULTS, ...response.group_style_defaults });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  // Effective (backend default + admin override) style for one offer group
  const mergedStyle = (s: DigitalCartUiSettings, slug: string) => {
    const d = groupDefaults[slug] || FALLBACK_GROUP_DEFAULTS[slug];
    const over = s.group_styles?.[slug] || {};
    const line1 = over.line1 || d.line1;
    return {
      name: d.name,
      color: over.color && HEX_COLOR.test(over.color) ? over.color : d.color,
      label: over.label || d.label,
      line1,
      line2: over.line2 || d.line2,
      ribbon: over.ribbon || d.ribbon,
      banner: over.banner_image_url || '',
      numeric: line1.length <= 3,
    };
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const setField = <K extends keyof DigitalCartUiSettings>(
    key: K,
    value: DigitalCartUiSettings[K]
  ) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const setGroupField = (slug: string, field: string, value: string) => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            group_styles: {
              ...prev.group_styles,
              [slug]: { ...prev.group_styles?.[slug], [field]: value },
            },
          }
        : prev
    );
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

    const invalidGroup = GROUP_ORDER.find((slug) => {
      const color = settings.group_styles?.[slug]?.color;
      return color && !HEX_COLOR.test(color);
    });
    if (invalidGroup) {
      setError(
        `${(groupDefaults[invalidGroup] || FALLBACK_GROUP_DEFAULTS[invalidGroup]).name} tile color must be hex like #RRGGBB`
      );
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

  const radius = settings ? `${settings.card_radius ?? 14}px` : '14px';

  const renderStatusBar = () => (
    <Box
      sx={{
        pt: '14px',
        pb: 0.5,
        px: 2.75,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: previewColor('text_color'),
      }}
    >
      <Typography sx={{ fontSize: 12, fontWeight: 700 }}>9:41</Typography>
      <Stack direction="row" spacing={0.75} alignItems="center">
        <Stack direction="row" spacing="2px" alignItems="flex-end">
          {[4, 6, 8, 10].map((h) => (
            <Box key={h} sx={{ width: 3, height: h, bgcolor: 'currentColor', borderRadius: 0.25 }} />
          ))}
        </Stack>
        <Box
          sx={{
            width: 22,
            height: 11,
            border: '1.5px solid currentColor',
            borderRadius: '3px',
            p: '1.5px',
            display: 'flex',
          }}
        >
          <Box sx={{ width: '70%', bgcolor: 'currentColor', borderRadius: '1px' }} />
        </Box>
      </Stack>
    </Box>
  );

  const renderHomePreview = (s: DigitalCartUiSettings) => (
    <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, pb: 1.5 }}>
      {/* Centered logo */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, mb: 1.25 }}>
        {s.show_logo && s.logo_url ? (
          <Box component="img" src={s.logo_url} sx={{ height: 34, maxWidth: 150, objectFit: 'contain' }} />
        ) : (
          <Typography
            sx={{
              fontSize: 17,
              fontWeight: 900,
              letterSpacing: 0.5,
              color: previewColor('primary_color'),
              textTransform: 'uppercase',
            }}
          >
            {s.header_title || 'Store Name'} 🛒
          </Typography>
        )}
      </Box>

      {/* Heading + search icon */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 800, color: previewColor('text_color') }}>
            {s.home_heading || 'Exclusive Offers'}
          </Typography>
          {s.tagline && (
            <Typography noWrap sx={{ fontSize: 10, color: 'text.disabled' }}>
              {s.tagline}
            </Typography>
          )}
          {s.show_last_updated && (
            <Typography sx={{ fontSize: 8.5, color: 'text.disabled', opacity: 0.8 }}>
              Updated 20 July 2026
            </Typography>
          )}
        </Box>
        {s.show_search && (
          <Iconify
            icon="eva:search-fill"
            width={18}
            sx={{ color: previewColor('text_color'), mt: 0.25, flexShrink: 0 }}
          />
        )}
      </Stack>

      {/* Offer tiles */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25 }}>
        {GROUP_ORDER.slice(0, 4).map((slug) => {
          const tile = mergedStyle(s, slug);
          return (
          <Box
            key={slug}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              bgcolor: tile.color,
              borderRadius: radius,
              aspectRatio: '4 / 5',
              p: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: '#fff',
              backgroundImage:
                'radial-gradient(circle at 50% 20%, rgba(255,255,255,0.22), transparent 65%)',
            }}
          >
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {tile.numeric ? (
                <>
                  <Typography sx={{ fontSize: 34, fontWeight: 900, lineHeight: 1 }}>
                    {tile.line1}
                  </Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 800, letterSpacing: 2 }}>
                    {tile.line2}
                  </Typography>
                </>
              ) : (
                [tile.line1, tile.line2].filter(Boolean).map((word) => (
                  <Typography key={word} sx={{ fontSize: 14, fontWeight: 900, lineHeight: 1.2, textTransform: 'uppercase' }}>
                    {word}
                  </Typography>
                ))
              )}
              {tile.ribbon && (
                <Box
                  sx={{
                    mt: 0.5,
                    bgcolor: '#ffc928',
                    color: '#5d3a00',
                    fontSize: 10,
                    fontWeight: 900,
                    px: 1.25,
                    py: 0.1,
                    borderRadius: 0.5,
                    transform: 'skewX(-6deg) rotate(-2deg)',
                  }}
                >
                  {tile.ribbon}
                </Box>
              )}
            </Box>
            <Box
              sx={{
                width: '100%',
                bgcolor: 'rgba(0,0,0,0.26)',
                borderRadius: 1,
                py: 0.5,
                px: 0.5,
                fontSize: 6.5,
                fontWeight: 700,
                letterSpacing: 0.4,
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {tile.label}
            </Box>
          </Box>
          );
        })}
      </Box>

      {/* Info card */}
      {s.footer_note && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 1.5, bgcolor: '#ecf2fc', borderRadius: radius, p: 1.25 }}
        >
          <Iconify
            icon={'solar:clock-circle-outline' as any}
            width={16}
            sx={{ color: '#e53935', flexShrink: 0, mt: '1px' }}
          />
          <Box>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: previewColor('text_color') }}>
              {s.footer_note}
            </Typography>
            {s.info_sub_text && (
              <Typography sx={{ fontSize: 9, color: 'text.disabled' }}>{s.info_sub_text}</Typography>
            )}
          </Box>
        </Stack>
      )}
    </Box>
  );

  const renderOfferPreview = (s: DigitalCartUiSettings) => {
    const offerStyle = mergedStyle(s, GROUP_ORDER[0]);
    const offer = offerStyle.color;
    return (
      <>
        <Box sx={{ flex: 1, overflowY: 'auto', pb: 1 }}>
          {/* Topbar */}
          <Stack direction="row" alignItems="center" sx={{ px: 1.5, py: 0.75 }}>
            <Typography sx={{ fontSize: 16, color: previewColor('text_color') }}>←</Typography>
            <Typography
              sx={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 800, color: offer }}
            >
              {offerStyle.name.toUpperCase()}
            </Typography>
            {s.show_search ? (
              <Iconify icon="eva:search-fill" width={16} sx={{ color: previewColor('text_color') }} />
            ) : (
              <Box sx={{ width: 16 }} />
            )}
          </Stack>

          {/* Hero: uploaded banner image wins over the text banner */}
          {offerStyle.banner ? (
            <Box
              component="img"
              src={offerStyle.banner}
              sx={{ display: 'block', width: '100%', maxHeight: 110, objectFit: 'cover' }}
            />
          ) : (
          <Box
            sx={{
              position: 'relative',
              overflow: 'hidden',
              bgcolor: `${offer}1a`,
              color: offer,
              py: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                width: 54,
                height: 54,
                borderRadius: '50%',
                bgcolor: offer,
                opacity: 0.14,
                top: -18,
                left: -14,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: offer,
                opacity: 0.14,
                bottom: -14,
                right: -10,
              }}
            />
            {offerStyle.numeric ? (
              <>
                <Typography sx={{ fontSize: 38, fontWeight: 900, lineHeight: 0.95 }}>
                  {offerStyle.line1}
                </Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 800, letterSpacing: 2 }}>
                  {offerStyle.line2}
                </Typography>
              </>
            ) : (
              [offerStyle.line1, offerStyle.line2].filter(Boolean).map((word) => (
                <Typography
                  key={word}
                  sx={{ fontSize: 19, fontWeight: 900, lineHeight: 1.15, textTransform: 'uppercase' }}
                >
                  {word}
                </Typography>
              ))
            )}
            <Box
              sx={{
                mt: 1,
                bgcolor: offer,
                color: '#fff',
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: 0.6,
                px: 1.5,
                py: 0.4,
              }}
            >
              {offerStyle.label}
            </Box>
          </Box>
          )}

          <Box sx={{ px: 1.5, pt: 1.25 }}>
            {/* Valid till */}
            {(s.valid_till_text || s.show_last_updated) && (
              <Typography
                sx={{
                  textAlign: 'center',
                  fontSize: 9.5,
                  fontWeight: 600,
                  color: offer,
                  mb: 1,
                }}
              >
                🗓 {s.valid_till_text || 'Offers updated on 20 July 2026'}
              </Typography>
            )}

            {/* Section divider */}
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 1.25 }}>
              <Box sx={{ width: 20, height: 2, borderRadius: 1, bgcolor: offer, opacity: 0.7 }} />
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: previewColor('text_color') }}>
                Products on Offer
              </Typography>
              <Box sx={{ width: 20, height: 2, borderRadius: 1, bgcolor: offer, opacity: 0.7 }} />
            </Stack>

            {/* Product cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0.75 }}>
              {PREVIEW_PRODUCTS.map((item) => (
                <Box
                  key={item.code}
                  sx={{
                    bgcolor: previewColor('card_color'),
                    borderRadius: radius,
                    p: 0.75,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: 0.4,
                    boxShadow: '0 1px 4px rgba(20,20,40,0.07)',
                  }}
                >
                  <Box
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: 1,
                      bgcolor: `${offer}12`,
                      color: offer,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    {item.name.charAt(0)}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 7.5,
                      fontWeight: 600,
                      lineHeight: 1.3,
                      color: previewColor('text_color'),
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.name}
                  </Typography>
                  {s.show_product_code && (
                    <Typography sx={{ fontSize: 6.5, color: 'text.disabled' }}>
                      Code: {item.code}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={0.5} alignItems="baseline">
                    <Typography
                      sx={{ fontSize: 7, textDecoration: 'line-through', color: 'text.disabled' }}
                    >
                      {item.mrp}
                    </Typography>
                    <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: offer }}>
                      {item.price}
                    </Typography>
                  </Stack>
                  {s.show_discount_percent && (
                    <Box
                      sx={{
                        width: '100%',
                        bgcolor: `${offer}14`,
                        color: offer,
                        fontSize: 6.5,
                        fontWeight: 700,
                        py: 0.4,
                        borderRadius: 0.75,
                      }}
                    >
                      {item.off}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Bottom nav */}
        {s.show_bottom_nav && (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-around"
            sx={{
              px: 2,
              py: 0.75,
              bgcolor: '#fff',
              borderTop: '1px solid rgba(20,20,40,0.07)',
            }}
          >
            <Typography sx={{ fontSize: 15, color: previewColor('text_color') }}>←</Typography>
            <Stack alignItems="center" spacing={0.1}>
              <Iconify icon={'solar:home-2-bold' as any} width={14} sx={{ color: offer }} />
              <Typography sx={{ fontSize: 7, fontWeight: 700, color: offer }}>Offers</Typography>
            </Stack>
            {s.about_url && (
              <Stack alignItems="center" spacing={0.1}>
                <Iconify
                  icon={'solar:info-circle-outline' as any}
                  width={14}
                  sx={{ color: 'text.disabled' }}
                />
                <Typography sx={{ fontSize: 7, fontWeight: 600, color: 'text.disabled' }}>
                  About Us
                </Typography>
              </Stack>
            )}
          </Stack>
        )}
      </>
    );
  };

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
                      label="Store name"
                      placeholder="Project name (default)"
                      helperText="Shown as the logo text when no logo image is set"
                      value={settings.header_title}
                      onChange={(e) => setField('header_title', e.target.value)}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Home heading"
                      placeholder="Exclusive Offers"
                      helperText="Big heading on the home screen"
                      value={settings.home_heading ?? ''}
                      onChange={(e) => setField('home_heading', e.target.value)}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Tagline"
                      helperText="Subtitle under the home heading"
                      value={settings.tagline}
                      onChange={(e) => setField('tagline', e.target.value)}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Info card title"
                      helperText="Bold first line of the info card (also used in the page footer)"
                      value={settings.footer_note}
                      onChange={(e) => setField('footer_note', e.target.value)}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Info card subtitle"
                      placeholder="Hurry up and grab the best deals."
                      value={settings.info_sub_text ?? ''}
                      onChange={(e) => setField('info_sub_text', e.target.value)}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Offer validity text"
                      placeholder="e.g. Offer valid till 31st July"
                      helperText='Shown under the offer banner. Empty = "Offers updated on <date>"'
                      value={settings.valid_till_text ?? ''}
                      onChange={(e) => setField('valid_till_text', e.target.value)}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="About Us link"
                      placeholder="https://…"
                      helperText="Adds an About Us button to the bottom navigation. Empty = hidden"
                      value={settings.about_url ?? ''}
                      onChange={(e) => setField('about_url', e.target.value.trim())}
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
                <CardHeader
                  title="Offer group tiles"
                  subheader="Tile & banner of each offer group on the website. Empty fields use the defaults shown."
                />
                <CardContent>
                  <Stack spacing={3}>
                    {GROUP_ORDER.map((slug) => {
                      const defaults = groupDefaults[slug] || FALLBACK_GROUP_DEFAULTS[slug];
                      const over = settings.group_styles?.[slug] || {};
                      const merged = mergedStyle(settings, slug);
                      return (
                        <Box key={slug}>
                          <Stack direction="row" spacing={1} alignItems="center" mb={1.25}>
                            <Box
                              sx={{
                                width: 14,
                                height: 14,
                                borderRadius: 0.5,
                                bgcolor: merged.color,
                              }}
                            />
                            <Typography variant="subtitle2">{defaults.name}</Typography>
                          </Stack>
                          <Grid container spacing={1.5}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                              <ColorField
                                label="Tile color"
                                hint=""
                                value={over.color || ''}
                                onChange={(value) => setGroupField(slug, 'color', value)}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 8 }}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Banner label"
                                placeholder={defaults.label}
                                value={over.label || ''}
                                onChange={(e) => setGroupField(slug, 'label', e.target.value)}
                              />
                            </Grid>
                            <Grid size={{ xs: 4 }}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Big text 1"
                                placeholder={defaults.line1}
                                value={over.line1 || ''}
                                onChange={(e) => setGroupField(slug, 'line1', e.target.value)}
                              />
                            </Grid>
                            <Grid size={{ xs: 4 }}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Big text 2"
                                placeholder={defaults.line2}
                                value={over.line2 || ''}
                                onChange={(e) => setGroupField(slug, 'line2', e.target.value)}
                              />
                            </Grid>
                            <Grid size={{ xs: 4 }}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Ribbon"
                                placeholder={defaults.ribbon || '—'}
                                value={over.ribbon || ''}
                                onChange={(e) => setGroupField(slug, 'ribbon', e.target.value)}
                              />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <BannerImageField
                                value={over.banner_image_url || ''}
                                onChange={(url) => setGroupField(slug, 'banner_image_url', url)}
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      );
                    })}
                  </Stack>
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
              <CardHeader
                title="Live preview"
                action={
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={previewScreen}
                    onChange={(_, value) => value && setPreviewScreen(value)}
                  >
                    <ToggleButton value="home">Home</ToggleButton>
                    <ToggleButton value="offer">Offer page</ToggleButton>
                  </ToggleButtonGroup>
                }
              />
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

                    {renderStatusBar()}

                    {previewScreen === 'home'
                      ? renderHomePreview(settings)
                      : renderOfferPreview(settings)}

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
