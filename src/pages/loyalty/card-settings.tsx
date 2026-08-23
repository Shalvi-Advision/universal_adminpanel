import type { LoyaltyCardBenefit } from 'src/types/loyalty';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
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
import { getLoyaltyCardSettings, updateLoyaltyCardSettings } from 'src/services/loyalty';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

// Names the mobile app maps to a Material icon glyph - kept to a small,
// known set so the app never has to fall back for an icon it doesn't
// recognize.
const ICON_OPTIONS = [
  'card_giftcard', 'star', 'local_offer', 'favorite', 'bolt',
  'verified', 'local_shipping', 'redeem', 'diamond', 'workspace_premium',
];

const emptyBenefit: LoyaltyCardBenefit = { icon: 'card_giftcard', title: '', subtitle: '' };

export default function Page() {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission('loyalty', 'edit');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [brandTitle, setBrandTitle] = useState('');
  const [brandSubtitle, setBrandSubtitle] = useState('');
  const [memberLabel, setMemberLabel] = useState('');
  const [cardNumberPrefix, setCardNumberPrefix] = useState('');
  const [thankYouMessage, setThankYouMessage] = useState('');
  const [benefits, setBenefits] = useState<LoyaltyCardBenefit[]>([emptyBenefit, emptyBenefit, emptyBenefit]);
  const [supportPhone, setSupportPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [termsText, setTermsText] = useState('');

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
      })
      .catch((err: any) => setError(err.message || 'Failed to load loyalty card settings'))
      .finally(() => setLoading(false));
  }, []);

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
              Content shared across every tier&apos;s membership card. Per-tier colors are set on each tier under
              Loyalty &gt; Tiers.
            </Typography>
          </Box>

          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}

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
