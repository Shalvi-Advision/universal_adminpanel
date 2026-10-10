import type { PromoBullet, PromoBulletIcon, PromoPageValues } from 'src/services/promo-page';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { getSelectedProjectCode } from 'src/utils/project-code';
import { PROMO_BULLET_ICON_META } from 'src/utils/promo-bullet-icons';

import { getPromoPage, updatePromoPage, PROMO_BULLET_ICONS } from 'src/services/promo-page';

import { Iconify } from 'src/components/iconify';
import { ImageField } from 'src/components/project-settings/image-field';

// ----------------------------------------------------------------------

const MAX_BULLETS = 4;

const emptyBullet = (): PromoBullet => ({ icon: 'star', title: '', subtitle: '' });

const defaultValues: PromoPageValues = {
  is_enabled: false,
  headline: '',
  subheadline: '',
  hero_image_url: '',
  bullets: [],
  android_url: '',
  ios_url: ''
};

export default function Page() {
  const [values, setValues] = useState<PromoPageValues>(defaultValues);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const fetchPromoPage = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getPromoPage();
      if (response.success) {
        setValues({ ...defaultValues, ...response.data });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load promo page settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromoPage();
  }, [fetchPromoPage]);

  const setField =
    (key: keyof Omit<PromoPageValues, 'is_enabled' | 'bullets'>) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((prev) => ({ ...prev, [key]: e.target.value }));

  const setEnabled = (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, is_enabled: e.target.checked }));

  const updateBullet = (index: number, patch: Partial<PromoBullet>) =>
    setValues((prev) => {
      const bullets = [...prev.bullets];
      bullets[index] = { ...(bullets[index] ?? emptyBullet()), ...patch };
      return { ...prev, bullets };
    });

  const addBullet = () =>
    setValues((prev) => ({ ...prev, bullets: [...prev.bullets, emptyBullet()] }));

  const removeBullet = (index: number) =>
    setValues((prev) => ({ ...prev, bullets: prev.bullets.filter((_, i) => i !== index) }));

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      const response = await updatePromoPage(values);
      if (response.success) {
        setValues({ ...defaultValues, ...response.data });
        setToast('Promo page saved');
      } else {
        setError(response.message || 'Failed to save');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save promo page settings');
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

  const projectCode = getSelectedProjectCode();

  return (
    <Container maxWidth="lg">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4">Promo Page</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Public download/offer landing page for this project — shown at /{projectCode || '<project>'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            component="a"
            href={projectCode ? `/${projectCode}` : undefined}
            target="_blank"
            rel="noopener"
            disabled={!projectCode}
            startIcon={<Iconify icon={'solar:eye-bold' as any} />}
          >
            Preview
          </Button>
          <Button
            variant="contained"
            disabled={saving}
            onClick={handleSave}
            startIcon={
              saving ? <CircularProgress size={16} /> : <Iconify icon={'solar:diskette-bold' as any} />
            }
          >
            Save Changes
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3 }}>
            <FormControlLabel
              control={<Switch checked={values.is_enabled} onChange={setEnabled} />}
              label="Publish this page"
            />
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              When off, /{projectCode || '<project>'} shows &quot;Page not found&quot; to visitors.
            </Typography>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Hero
            </Typography>
            <Stack spacing={3}>
              <ImageField
                label="Hero Image"
                folder="promo-page"
                value={values.hero_image_url}
                onChange={(url) => setValues((prev) => ({ ...prev, hero_image_url: url }))}
                helperText="Shown at the top of the page"
              />
              <TextField
                fullWidth
                size="small"
                label="Headline"
                placeholder="Shop More. Save More."
                value={values.headline}
                onChange={setField('headline')}
              />
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={2}
                label="Subheadline"
                placeholder="Your premium shopping destination"
                value={values.subheadline}
                onChange={setField('subheadline')}
              />
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Download Links
            </Typography>
            <Stack spacing={3}>
              <TextField
                fullWidth
                size="small"
                label="Android (Play Store) URL"
                placeholder="https://play.google.com/store/apps/details?id=…"
                value={values.android_url}
                onChange={setField('android_url')}
              />
              <TextField
                fullWidth
                size="small"
                label="iOS (App Store) URL"
                placeholder="https://apps.apple.com/app/…"
                value={values.ios_url}
                onChange={setField('ios_url')}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Leave either blank to hide that store&apos;s download button on the page.
              </Typography>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h6">Highlights</Typography>
              <Button
                size="small"
                disabled={values.bullets.length >= MAX_BULLETS}
                onClick={addBullet}
                startIcon={<Iconify icon={'solar:add-circle-bold' as any} />}
              >
                Add highlight ({values.bullets.length}/{MAX_BULLETS})
              </Button>
            </Stack>
            <Grid container spacing={2}>
              {values.bullets.map((bullet, index) => (
                 
                <Grid key={index} size={{ xs: 12, sm: 6 }}>
                  <Stack spacing={1.5} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Icon</InputLabel>
                        <Select
                          label="Icon"
                          value={bullet.icon}
                          onChange={(e) => updateBullet(index, { icon: e.target.value as PromoBulletIcon })}
                        >
                          {PROMO_BULLET_ICONS.map((key) => (
                            <MenuItem key={key} value={key}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Iconify icon={PROMO_BULLET_ICON_META[key].iconify as any} width={18} />
                                <span>{PROMO_BULLET_ICON_META[key].label}</span>
                              </Stack>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Box sx={{ flex: 1 }} />
                      <Button size="small" color="inherit" onClick={() => removeBullet(index)}>
                        Remove
                      </Button>
                    </Stack>
                    <TextField
                      fullWidth
                      size="small"
                      label="Title"
                      placeholder="More Luxury, More Value."
                      value={bullet.title}
                      onChange={(e) => updateBullet(index, { title: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Subtitle"
                      placeholder="Discover More. Save More."
                      value={bullet.subtitle}
                      onChange={(e) => updateBullet(index, { subtitle: e.target.value })}
                    />
                  </Stack>
                </Grid>
              ))}
              {values.bullets.length === 0 && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No highlights yet — add up to {MAX_BULLETS}.
                  </Typography>
                </Grid>
              )}
            </Grid>
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
