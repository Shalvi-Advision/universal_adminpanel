import type { LoyaltyTier, LoyaltyCardBenefit } from 'src/types/loyalty';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/config-global';
import { usePermissions } from 'src/contexts/permissions-context';
import { getLoyaltyTiers, getLoyaltyCardSettings, updateLoyaltyCardSettings } from 'src/services/loyalty';

import { Iconify } from 'src/components/iconify';

import ColorField from './components/color-field';
import { LoyaltyCardPreview } from './components/card-preview';

// ----------------------------------------------------------------------

// Names the mobile app maps to a Material icon glyph - kept to a small,
// known set so the app never has to fall back for an icon it doesn't
// recognize.
const ICON_OPTIONS = [
  'card_giftcard', 'star', 'local_offer', 'favorite', 'bolt',
  'verified', 'local_shipping', 'redeem', 'diamond', 'workspace_premium',
];

const emptyBenefit: LoyaltyCardBenefit = { icon: 'card_giftcard', title: '', subtitle: '' };

// Sentinel previewTierId meaning "show the tenant's default colors below,
// not a real tier" - distinct from '' so it can't collide with a tier that
// somehow has an empty _id.
const DEFAULT_PREVIEW = '__default__';

export default function Page() {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission('loyalty', 'edit');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [previewTierId, setPreviewTierId] = useState(DEFAULT_PREVIEW);

  const [brandTitle, setBrandTitle] = useState('');
  const [brandSubtitle, setBrandSubtitle] = useState('');
  const [memberLabel, setMemberLabel] = useState('');
  const [cardNumberPrefix, setCardNumberPrefix] = useState('');
  const [thankYouMessage, setThankYouMessage] = useState('');
  const [benefits, setBenefits] = useState<LoyaltyCardBenefit[]>([emptyBenefit, emptyBenefit, emptyBenefit]);
  const [supportPhone, setSupportPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [termsText, setTermsText] = useState('');
  const [cardPrimaryColor, setCardPrimaryColor] = useState('#1A1A1A');
  const [cardAccentColor, setCardAccentColor] = useState('#D4AF37');

  useEffect(() => {
    getLoyaltyCardSettings()
      .then((res) => {
        if (!res.success) return;
        const d = res.data;
        setBrandTitle(d.brand_title);
        setBrandSubtitle(d.brand_subtitle);
        setMemberLabel(d.member_label);
        setCardNumberPrefix(d.card_number_prefix);
        setThankYouMessage(d.thank_you_message);
        setBenefits(d.benefits.length ? d.benefits : [emptyBenefit, emptyBenefit, emptyBenefit]);
        setSupportPhone(d.support_phone);
        setWebsite(d.website);
        setTermsText(d.terms_text);
        setCardPrimaryColor(d.card_primary_color || '#1A1A1A');
        setCardAccentColor(d.card_accent_color || '#D4AF37');
      })
      .catch((err: any) => setError(err.message || 'Failed to load loyalty card settings'))
      .finally(() => setLoading(false));

    getLoyaltyTiers()
      .then((res) => {
        if (!res.success) return;
        setTiers([...res.data].sort((a, b) => a.rank - b.rank));
      })
      .catch(() => {
        // Non-fatal - the preview just falls back to the Default chip above.
      });
  }, []);

  const previewTier = tiers.find((t) => t._id === previewTierId);

  const updateBenefit = (index: number, patch: Partial<LoyaltyCardBenefit>) => {
    setBenefits((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  };
  const addBenefit = () => setBenefits((prev) => [...prev, { ...emptyBenefit }]);
  const removeBenefit = (index: number) => setBenefits((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await updateLoyaltyCardSettings({
        brand_title: brandTitle,
        brand_subtitle: brandSubtitle,
        member_label: memberLabel,
        card_number_prefix: cardNumberPrefix,
        thank_you_message: thankYouMessage,
        benefits: benefits.filter((b) => b.title.trim()),
        support_phone: supportPhone,
        website,
        terms_text: termsText,
        card_primary_color: cardPrimaryColor,
        card_accent_color: cardAccentColor,
      });
      setSuccess('Loyalty card settings saved');
    } catch (err: any) {
      setError(err.message || 'Failed to save loyalty card settings');
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
    <>
      <title>{`Loyalty · Card - ${CONFIG.appName}`}</title>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Loyalty Card</Typography>
            <Typography variant="body2" color="text.secondary">
              Content shared across every tier&apos;s membership card, plus the default colors used before a member
              reaches a tier. Per-tier colors are set on each tier under Loyalty &gt; Tiers.
            </Typography>
          </Box>

          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}

          <Card sx={{ p: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1.5} sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Preview</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  label="Default"
                  size="small"
                  onClick={() => setPreviewTierId(DEFAULT_PREVIEW)}
                  variant={previewTierId === DEFAULT_PREVIEW ? 'filled' : 'outlined'}
                  sx={{
                    borderColor: cardAccentColor,
                    ...(previewTierId === DEFAULT_PREVIEW && {
                      bgcolor: cardPrimaryColor,
                      color: cardAccentColor,
                    }),
                  }}
                />
                {tiers.map((tier) => (
                  <Chip
                    key={tier._id}
                    label={tier.name}
                    size="small"
                    onClick={() => setPreviewTierId(tier._id)}
                    variant={tier._id === previewTierId ? 'filled' : 'outlined'}
                    sx={{
                      borderColor: tier.cardAccentColor,
                      ...(tier._id === previewTierId && {
                        bgcolor: tier.cardPrimaryColor,
                        color: tier.cardAccentColor,
                      }),
                    }}
                  />
                ))}
              </Stack>
            </Stack>
            <LoyaltyCardPreview
              brandTitle={brandTitle}
              brandSubtitle={brandSubtitle}
              memberLabel={memberLabel}
              cardNumberPrefix={cardNumberPrefix}
              thankYouMessage={thankYouMessage}
              benefits={benefits}
              supportPhone={supportPhone}
              website={website}
              termsText={termsText}
              primaryColor={previewTier?.cardPrimaryColor || cardPrimaryColor}
              accentColor={previewTier?.cardAccentColor || cardAccentColor}
              tierName={previewTier?.name || 'MEMBER'}
            />
          </Card>

          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Default Card Colors</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Used for a member&apos;s card before they reach any tier. Once a customer qualifies for a tier, its
              colors (Loyalty &gt; Tiers) take over.
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ColorField label="Primary Color" value={cardPrimaryColor} onChange={setCardPrimaryColor} hint="Card background" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <ColorField label="Accent Color" value={cardAccentColor} onChange={setCardAccentColor} hint="Text, icons, footer bar" />
              </Grid>
            </Grid>
          </Card>

          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Front of Card</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Brand Title" fullWidth value={brandTitle} onChange={(e) => setBrandTitle(e.target.value)} helperText='e.g. "LOYALTY"' disabled={!canEdit} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Brand Subtitle" fullWidth value={brandSubtitle} onChange={(e) => setBrandSubtitle(e.target.value)} helperText='e.g. "MEMBER" or "PREMIUM"' disabled={!canEdit} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Member Label" fullWidth value={memberLabel} onChange={(e) => setMemberLabel(e.target.value)} helperText="Shown under the customer's name" disabled={!canEdit} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Card Number Prefix" fullWidth value={cardNumberPrefix} onChange={(e) => setCardNumberPrefix(e.target.value)} helperText='e.g. "LP" - the card number itself is generated automatically' disabled={!canEdit} />
              </Grid>
            </Grid>
          </Card>

          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Back of Card</Typography>
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField label="Thank-You Message" fullWidth value={thankYouMessage} onChange={(e) => setThankYouMessage(e.target.value)} disabled={!canEdit} />
              </Grid>

              <Grid size={12}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
                  <Typography variant="subtitle2">Benefits</Typography>
                  {canEdit && (
                    <Button size="small" startIcon={<Iconify icon={'solar:add-circle-bold' as any} />} onClick={addBenefit}>
                      Add Benefit
                    </Button>
                  )}
                </Stack>
              </Grid>
              {benefits.map((benefit, i) => (
                <Grid size={12} key={i}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <TextField
                      select
                      label="Icon"
                      value={benefit.icon}
                      onChange={(e) => updateBenefit(i, { icon: e.target.value })}
                      disabled={!canEdit}
                      sx={{ minWidth: 160 }}
                    >
                      {ICON_OPTIONS.map((icon) => (
                        <MenuItem key={icon} value={icon}>{icon.replace(/_/g, ' ')}</MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label="Title"
                      value={benefit.title}
                      onChange={(e) => updateBenefit(i, { title: e.target.value })}
                      disabled={!canEdit}
                      fullWidth
                    />
                    <TextField
                      label="Subtitle"
                      value={benefit.subtitle}
                      onChange={(e) => updateBenefit(i, { subtitle: e.target.value })}
                      disabled={!canEdit}
                      fullWidth
                    />
                    {canEdit && (
                      <IconButton color="error" onClick={() => removeBenefit(i)}>
                        <Iconify icon={'solar:trash-bin-trash-bold-duotone' as any} width={20} />
                      </IconButton>
                    )}
                  </Stack>
                </Grid>
              ))}

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Support Phone" fullWidth value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} disabled={!canEdit} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Website" fullWidth value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="www.yourbrand.com" disabled={!canEdit} />
              </Grid>
              <Grid size={12}>
                <TextField label="Terms Text" fullWidth value={termsText} onChange={(e) => setTermsText(e.target.value)} disabled={!canEdit} />
              </Grid>
            </Grid>
          </Card>

          {canEdit && (
            <Stack direction="row" justifyContent="flex-end">
              <Button variant="contained" onClick={handleSave} disabled={saving}>
                {saving ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </Stack>
          )}
        </Stack>
      </Container>
    </>
  );
}
