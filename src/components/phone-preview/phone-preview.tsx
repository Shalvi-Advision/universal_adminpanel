import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

// The device shell every screen preview sits inside. Purely chrome — the
// caller owns everything between the status bar and the home indicator.
//
// Sizes match the Digital Cart UI preview so the two read as the same device.

type PhonePreviewProps = {
  children: ReactNode;
  /** Screen background — anything the `bgcolor` sx prop accepts. */
  bgcolor?: string;
  /** Status bar glyph colour. Set this when the screen background is dark. */
  statusColor?: string;
  /** Background image drawn behind `children`, e.g. the splash backdrop. */
  backgroundImage?: string;
  width?: number;
  height?: number;
};

export function PhonePreview({
  children,
  bgcolor = '#ffffff',
  statusColor = 'rgba(0,0,0,0.85)',
  backgroundImage,
  width = 310,
  height = 590,
}: PhonePreviewProps) {
  return (
    <Box
      sx={{
        width,
        bgcolor: '#17171c',
        borderRadius: '44px',
        p: '11px',
        position: 'relative',
        boxShadow: '0 18px 44px rgba(0,0,0,0.35), inset 0 0 0 2px #3c3c46, inset 0 0 0 5px #101014',
      }}
    >
      {/* Side buttons */}
      <Box
        sx={{
          position: 'absolute',
          right: -3,
          top: 130,
          width: 3,
          height: 62,
          bgcolor: '#3c3c46',
          borderRadius: 1,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          left: -3,
          top: 104,
          width: 3,
          height: 26,
          bgcolor: '#3c3c46',
          borderRadius: 1,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          left: -3,
          top: 142,
          width: 3,
          height: 44,
          bgcolor: '#3c3c46',
          borderRadius: 1,
        }}
      />

      {/* Screen */}
      <Box
        sx={{
          borderRadius: '33px',
          overflow: 'hidden',
          bgcolor,
          height,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
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

        <PhoneStatusBar color={statusColor} />

        {children}

        {/* Home indicator */}
        <Box sx={{ py: 0.75, display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ width: 104, height: 4, bgcolor: 'rgba(0,0,0,0.35)', borderRadius: 999 }} />
        </Box>
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

/**
 * Status bar glyph colour that stays legible on `background`. Falls back to
 * dark glyphs for anything that isn't a hex colour — including empty values,
 * where the app's own light default applies.
 */
export function statusColorFor(background?: string): string {
  const hex = (background ?? '').trim();
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return 'rgba(0,0,0,0.85)';

  const full = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;

  const r = parseInt(full.slice(1, 3), 16);
  const g = parseInt(full.slice(3, 5), 16);
  const b = parseInt(full.slice(5, 7), 16);

  // Perceived brightness — the usual weighting, good enough to pick a side.
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 140 ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.85)';
}

// ----------------------------------------------------------------------

function PhoneStatusBar({ color }: { color: string }) {
  return (
    <Box
      sx={{
        pt: '14px',
        pb: 0.5,
        px: 2.75,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color,
      }}
    >
      <Typography sx={{ fontSize: 12, fontWeight: 700 }}>9:41</Typography>
      <Stack direction="row" spacing={0.75} alignItems="center">
        <Stack direction="row" spacing="2px" alignItems="flex-end">
          {[4, 6, 8, 10].map((h) => (
            <Box
              key={h}
              sx={{ width: 3, height: h, bgcolor: 'currentColor', borderRadius: 0.25 }}
            />
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
}
