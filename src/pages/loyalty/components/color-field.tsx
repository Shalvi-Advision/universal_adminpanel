import { useRef } from 'react';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------
// Same swatch-plus-hex-field pattern as digital-cart-ui.tsx's ColorField,
// copied rather than imported since that one is a local, unexported
// component - kept here so every loyalty admin page uses one consistent
// color picker.

const HEX_COLOR = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

type Props = {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
};

export default function ColorField({ label, hint, value, onChange }: Props) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const valid = !value || HEX_COLOR.test(value);

  return (
    <TextField
      fullWidth
      label={label}
      value={value}
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
