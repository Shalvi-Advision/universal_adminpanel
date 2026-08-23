import type { LoyaltyCardBenefit } from 'src/types/loyalty';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

// Mirrors _iconFor() in the Flutter app's loyalty_membership_card.dart -
// same source names (ICON_OPTIONS above the settings form), mapped to an
// Iconify glyph instead of a Material IconData.
const ICON_MAP: Record<string, string> = {
  card_giftcard: 'solar:gift-bold-duotone',
  star: 'solar:star-bold-duotone',
  local_offer: 'solar:tag-price-bold-duotone',
  favorite: 'solar:heart-bold-duotone',
  bolt: 'solar:bolt-bold-duotone',
  verified: 'solar:verified-check-bold-duotone',
  local_shipping: 'solar:delivery-bold-duotone',
  redeem: 'solar:ticket-bold-duotone',
  diamond: 'solar:diamond-bold-duotone',
  workspace_premium: 'solar:medal-ribbons-star-bold-duotone',
};

const iconFor = (name: string) => (ICON_MAP[name] || ICON_MAP.card_giftcard) as any;

// Picks readable text over an arbitrary accent color, same idea as the
// footer bar in the Flutter card.
function textOn(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length < 6) return '#000000';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1A1A1A' : '#FFFFFF';
}

export type LoyaltyCardPreviewProps = {
  brandTitle: string;
  brandSubtitle: string;
  memberLabel: string;
  cardNumberPrefix: string;
  thankYouMessage: string;
  benefits: LoyaltyCardBenefit[];
  supportPhone: string;
  website: string;
  termsText: string;
  primaryColor: string;
  accentColor: string;
  tierName: string;
};

// Sample-only content - this page has no real customer in scope, so the
// preview stands in a representative member so admins can judge layout,
// contrast, and content length without needing the mobile app.
const SAMPLE_NAME = 'JANE DOE';
const SAMPLE_POINTS = '1,250';
const SAMPLE_PENDING = 150;
const SAMPLE_NUMBER = '4821 6039 1157';

export function LoyaltyCardPreview({
  brandTitle,
  brandSubtitle,
  memberLabel,
  cardNumberPrefix,
  thankYouMessage,
  benefits,
  supportPhone,
  website,
  termsText,
  primaryColor,
  accentColor,
  tierName,
}: LoyaltyCardPreviewProps) {
  const [flipped, setFlipped] = useState(false);
  const footerText = textOn(accentColor);
  const visibleBenefits = benefits.filter((b) => b.title.trim()).slice(0, 4);

  return (
    <Stack spacing={1.5} alignItems="center">
      <Box
        onClick={() => setFlipped((f) => !f)}
        sx={{
          width: '100%',
          maxWidth: 360,
          aspectRatio: '1.586',
          perspective: 1200,
          cursor: 'pointer',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: 1,
            height: 1,
            transition: 'transform 0.6s',
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              borderRadius: 3,
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor} 60%, ${accentColor}33 100%)`,
              boxShadow: '0 12px 24px -8px rgba(0,0,0,0.45)',
              p: 2.5,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              color: '#FFFFFF',
            }}
          >
            {/* Diagonal accent sweep, approximating the reference card's gold ribbon */}
            <Box
              sx={{
                position: 'absolute',
                top: -60,
                right: -80,
                width: 220,
                height: 220,
                bgcolor: accentColor,
                opacity: 0.18,
                transform: 'rotate(-35deg)',
              }}
            />

            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Stack direction="row" spacing={1} alignItems="center">
                <Iconify icon={'solar:medal-ribbons-star-bold-duotone' as any} width={26} sx={{ color: accentColor }} />
                <Box>
                  <Typography sx={{ fontWeight: 700, letterSpacing: 1, lineHeight: 1.2 }}>
                    {brandTitle || 'LOYALTY'}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.75, letterSpacing: 1 }}>
                    {brandSubtitle || 'MEMBER'}
                  </Typography>
                </Box>
              </Stack>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ fontWeight: 700, color: accentColor, lineHeight: 1.1 }}>
                  {SAMPLE_POINTS}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.75 }}>PTS</Typography>
                {SAMPLE_PENDING > 0 && (
                  <Typography variant="caption" display="block" sx={{ opacity: 0.6, fontSize: 10 }}>
                    +{SAMPLE_PENDING} pending
                  </Typography>
                )}
              </Box>
            </Stack>

            <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
              <Box>
                <Typography sx={{ fontWeight: 700, letterSpacing: 0.5 }}>{SAMPLE_NAME}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.75, display: 'block' }}>
                  {memberLabel || 'MEMBER'}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.85, fontFamily: 'monospace', letterSpacing: 1 }}>
                  {(cardNumberPrefix || '').toUpperCase()} {SAMPLE_NUMBER}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: accentColor, fontWeight: 700, letterSpacing: 0.5 }}>
                {tierName}
              </Typography>
            </Stack>
          </Box>

          {/* Back */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              borderRadius: 3,
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor} 60%, ${accentColor}33 100%)`,
              boxShadow: '0 12px 24px -8px rgba(0,0,0,0.45)',
              display: 'flex',
              flexDirection: 'column',
              color: '#FFFFFF',
            }}
          >
            <Box sx={{ p: 2, pb: 1, flexGrow: 1, overflow: 'hidden' }}>
              {thankYouMessage && (
                <Typography variant="caption" sx={{ opacity: 0.85, display: 'block', mb: 1 }}>
                  {thankYouMessage}
                </Typography>
              )}
              <Stack spacing={0.75}>
                {visibleBenefits.length === 0 && (
                  <Typography variant="caption" sx={{ opacity: 0.5 }}>
                    Add benefits below to show them here
                  </Typography>
                )}
                {visibleBenefits.map((b, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="center">
                    <Iconify icon={iconFor(b.icon)} width={16} sx={{ color: accentColor, flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', lineHeight: 1.3 }}>
                        {b.title}
                      </Typography>
                      {b.subtitle && (
                        <Typography variant="caption" sx={{ opacity: 0.7, fontSize: 10, lineHeight: 1.2 }} noWrap>
                          {b.subtitle}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                ))}
              </Stack>
              {supportPhone && (
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 1 }}>
                  <Iconify icon={'solar:phone-bold-duotone' as any} width={14} sx={{ color: accentColor }} />
                  <Typography variant="caption" sx={{ opacity: 0.8, fontSize: 10 }}>{supportPhone}</Typography>
                </Stack>
              )}
            </Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ bgcolor: accentColor, color: footerText, px: 2, py: 0.75 }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 10 }} noWrap>
                {website}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: 9, opacity: 0.85, ml: 1 }} noWrap>
                {termsText}
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary">
        Tap the card to flip &middot; sample content, not a real member
      </Typography>
    </Stack>
  );
}
