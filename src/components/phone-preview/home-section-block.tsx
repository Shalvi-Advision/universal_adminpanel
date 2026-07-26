import type { HomeSection } from 'src/services/home-sections';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

// A wireframe of one home section as the app lays it out. Deliberately grey:
// it shows shape and order, not content — the real items come from whatever
// collection the section points at, which this page doesn't load.

const TINT = 'rgba(0,0,0,0.08)';
const TINT_STRONG = 'rgba(0,0,0,0.14)';

type Props = {
  section: HomeSection;
  /** Personalised sections arrive empty and are filled on the device. */
  personalized: boolean;
  label: string;
};

export function HomeSectionBlock({ section, personalized, label }: Props) {
  const background = section.style?.background_color || 'transparent';
  const heading = section.title || label;

  return (
    <Box sx={{ px: 1.5, py: 1.25, bgcolor: background }}>
      {heading && <SectionHeading title={heading} />}
      {personalized ? <PersonalizedBody label={label} /> : <SectionBody type={section.type} />}
    </Box>
  );
}

// ----------------------------------------------------------------------

function SectionHeading({ title }: { title: string }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.82)' }} noWrap>
        {title}
      </Typography>
      <Typography sx={{ fontSize: 9, color: 'rgba(0,0,0,0.4)' }}>See all</Typography>
    </Stack>
  );
}

/** The device fills these at runtime, so there is nothing to shape here. */
function PersonalizedBody({ label }: { label: string }) {
  return (
    <Box
      sx={{
        height: 46,
        borderRadius: 1.5,
        border: '1px dashed rgba(0,0,0,0.22)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography sx={{ fontSize: 9, color: 'rgba(0,0,0,0.42)' }}>
        {label} · filled on the device
      </Typography>
    </Box>
  );
}

function SectionBody({ type }: { type: string }) {
  switch (type) {
    case 'hero_carousel':
      return (
        <Box>
          <Box sx={{ height: 74, borderRadius: 1.5, bgcolor: TINT_STRONG }} />
          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center', mt: 0.75 }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: i === 0 ? 12 : 4,
                  height: 4,
                  borderRadius: 999,
                  bgcolor: i === 0 ? 'rgba(0,0,0,0.45)' : TINT_STRONG,
                }}
              />
            ))}
          </Stack>
        </Box>
      );

    case 'category_strip':
    case 'brand_strip':
      return (
        <Stack direction="row" spacing={1}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Stack key={i} spacing={0.5} alignItems="center" sx={{ flex: 1 }}>
              <Box sx={{ width: 34, height: 34, borderRadius: '50%', bgcolor: TINT_STRONG }} />
              <Box sx={{ width: '80%', height: 4, borderRadius: 999, bgcolor: TINT }} />
            </Stack>
          ))}
        </Stack>
      );

    case 'category_grid':
      return (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.75 }}>
          {Array.from({ length: 8 }, (_, i) => (
            <Stack key={i} spacing={0.5} alignItems="center">
              <Box sx={{ width: 1, height: 30, borderRadius: 1, bgcolor: TINT_STRONG }} />
              <Box sx={{ width: '75%', height: 4, borderRadius: 999, bgcolor: TINT }} />
            </Stack>
          ))}
        </Box>
      );

    case 'product_rail':
    case 'seasonal_picks':
      return (
        <Stack direction="row" spacing={1}>
          {[0, 1, 2].map((i) => (
            <Stack key={i} spacing={0.5} sx={{ flex: 1 }}>
              <Box sx={{ height: 52, borderRadius: 1, bgcolor: TINT_STRONG }} />
              <Box sx={{ width: '90%', height: 4, borderRadius: 999, bgcolor: TINT }} />
              <Box sx={{ width: '55%', height: 4, borderRadius: 999, bgcolor: TINT }} />
            </Stack>
          ))}
        </Stack>
      );

    case 'deal_of_day':
      return (
        <Stack direction="row" spacing={1} sx={{ height: 62 }}>
          <Box sx={{ width: 62, borderRadius: 1, bgcolor: TINT_STRONG }} />
          <Stack spacing={0.75} sx={{ flex: 1, justifyContent: 'center' }}>
            <Box sx={{ width: '85%', height: 5, borderRadius: 999, bgcolor: TINT_STRONG }} />
            <Box sx={{ width: '60%', height: 4, borderRadius: 999, bgcolor: TINT }} />
            <Box sx={{ width: 52, height: 12, borderRadius: 999, bgcolor: 'rgba(0,0,0,0.3)' }} />
          </Stack>
        </Stack>
      );

    case 'flash_sale':
      return (
        <Box sx={{ borderRadius: 1.5, bgcolor: TINT_STRONG, p: 1 }}>
          <Stack direction="row" spacing={0.5} sx={{ mb: 0.75 }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{ width: 16, height: 14, borderRadius: 0.5, bgcolor: 'rgba(0,0,0,0.35)' }}
              />
            ))}
          </Stack>
          <Stack direction="row" spacing={1}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{ flex: 1, height: 38, borderRadius: 1, bgcolor: 'rgba(0,0,0,0.1)' }}
              />
            ))}
          </Stack>
        </Box>
      );

    case 'coupon_strip':
      return (
        <Stack direction="row" spacing={1}>
          {[0, 1].map((i) => (
            <Box
              key={i}
              sx={{
                flex: 1,
                height: 34,
                borderRadius: 1,
                border: '1px dashed rgba(0,0,0,0.25)',
                bgcolor: TINT,
              }}
            />
          ))}
        </Stack>
      );

    case 'free_delivery_progress':
      return (
        <Stack spacing={0.75}>
          <Box sx={{ width: '70%', height: 5, borderRadius: 999, bgcolor: TINT }} />
          <Box sx={{ height: 6, borderRadius: 999, bgcolor: TINT, overflow: 'hidden' }}>
            <Box sx={{ width: '55%', height: 1, bgcolor: 'rgba(0,0,0,0.4)' }} />
          </Box>
        </Stack>
      );

    case 'usp_strip':
      return (
        <Stack direction="row" spacing={1}>
          {[0, 1, 2].map((i) => (
            <Stack key={i} spacing={0.5} alignItems="center" sx={{ flex: 1 }}>
              <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: TINT_STRONG }} />
              <Box sx={{ width: '85%', height: 4, borderRadius: 999, bgcolor: TINT }} />
            </Stack>
          ))}
        </Stack>
      );

    default:
      return <Box sx={{ height: 46, borderRadius: 1.5, bgcolor: TINT_STRONG }} />;
  }
}
