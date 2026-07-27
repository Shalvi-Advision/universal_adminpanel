import type { SectionMetrics, PreviewContextInput } from './preview-protocol';

import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { DEVICES, USER_TIERS, DEFAULT_DEVICE, NETWORK_PROFILES } from './devices';
import { useFlutterPreview } from './use-flutter-preview';

// ----------------------------------------------------------------------

interface Props {
  /** Where the Flutter build is served from, e.g. https://preview.example.com */
  previewOrigin: string;
  /** The draft feed, in the exact shape POST /api/home/feed returns. */
  feed: unknown;
  /** Section ids in draft order, used to detect reorders vs edits. */
  storeCode: string;
  /** Row the admin has selected; scrolled to and highlighted in the preview. */
  selectedId?: string | null;
  /** Fired when a section is tapped inside the preview. */
  onSelect?: (id: string) => void;
}

/**
 * The mobile app, running inside the admin panel.
 *
 * This is not a rendering of the layout — it is the layout, drawn by the same
 * Flutter widgets the phone runs, compiled from the same source. Anything that
 * looks right here looks right on the device, which a hand-built HTML
 * approximation can never promise: the moment a rail's padding changes in
 * Dart, an HTML twin is wrong and nothing tells you.
 */
export function FlutterPreview({ previewOrigin, feed, storeCode, selectedId, onSelect }: Props) {
  const [device, setDevice] = useState(DEFAULT_DEVICE.id);
  const [network, setNetwork] = useState('wifi');
  const [tier, setTier] = useState<PreviewContextInput['user_tier']>('guest');
  const [clock, setClock] = useState('');
  const [debug, setDebug] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, SectionMetrics>>({});
  const [lastRoute, setLastRoute] = useState<string | null>(null);

  const bridge = useFlutterPreview({
    previewOrigin,
    onSectionTapped: (id) => onSelect?.(id),
    onNavigation: setLastRoute,
    onMetrics: (m) => setMetrics((prev) => ({ ...prev, [m.id]: m })),
  });

  const { setFeed, setContext, setDevice: pushDevice, setNetwork: pushNetwork } = bridge;
  const { setClock: pushClock, setDebug: pushDebug, selectSection } = bridge;

  // Each of these is its own effect so a device change does not resend the
  // feed, and a keystroke in the layout does not resend the device.
  useEffect(() => setFeed(feed), [feed, setFeed]);
  useEffect(() => pushDevice({ id: device }), [device, pushDevice]);
  useEffect(() => pushNetwork(network), [network, pushNetwork]);
  useEffect(() => pushDebug({ enabled: debug }), [debug, pushDebug]);
  useEffect(() => selectSection(selectedId ?? null), [selectedId, selectSection]);

  useEffect(() => {
    pushClock(clock ? new Date(clock).toISOString() : null);
  }, [clock, pushClock]);

  useEffect(() => {
    setContext({ store_code: storeCode, user_tier: tier });
  }, [storeCode, tier, setContext]);

  const frameSrc = useMemo(() => {
    // The preview pins its outbound messages to this origin, so the draft
    // layout cannot be read by anything else that manages to embed it.
    const parent = encodeURIComponent(window.location.origin);
    return `${previewOrigin}/index.html?parentOrigin=${parent}`;
  }, [previewOrigin]);

  const slowest = useMemo(() => {
    const all = Object.values(metrics);
    if (!all.length) return null;
    return all.reduce((worst, m) => (m.build_micros > worst.build_micros ? m : worst));
  }, [metrics]);

  const selectedDevice = DEVICES.find((d) => d.id === device) ?? DEFAULT_DEVICE;

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <TextField
          select
          size="small"
          label="Device"
          value={device}
          onChange={(e) => setDevice(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          {DEVICES.map((d) => (
            <MenuItem key={d.id} value={d.id}>
              {d.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Shopper"
          value={tier}
          onChange={(e) => setTier(e.target.value as PreviewContextInput['user_tier'])}
          sx={{ minWidth: 130 }}
        >
          {USER_TIERS.map((t) => (
            <MenuItem key={t.id} value={t.id}>
              {t.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Network"
          value={network}
          onChange={(e) => setNetwork(e.target.value)}
          sx={{ minWidth: 120 }}
        >
          {NETWORK_PROFILES.map((n) => (
            <MenuItem key={n.id} value={n.id}>
              {n.label}
            </MenuItem>
          ))}
        </TextField>

        <Tooltip title="Render the layout as it would appear at this moment">
          <TextField
            size="small"
            type="datetime-local"
            label="Preview time"
            value={clock}
            onChange={(e) => setClock(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 210 }}
          />
        </Tooltip>

        <FormControlLabel
          control={<Switch checked={debug} onChange={(e) => setDebug(e.target.checked)} />}
          label="Debug"
        />
      </Stack>

      {!bridge.ready && <LinearProgress />}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          bgcolor: 'background.neutral',
          borderRadius: 2,
          p: 2,
          minHeight: 520,
        }}
      >
        <Box
          component="iframe"
          ref={bridge.frameRef}
          src={frameSrc}
          title="Mobile app preview"
          // The Flutter build is first-party but still sandboxed: it should
          // never be able to navigate the admin panel out from under itself.
          sandbox="allow-scripts allow-same-origin"
          sx={{
            border: 0,
            width: '100%',
            maxWidth: selectedDevice.width + 48,
            height: selectedDevice.height + 48,
            display: 'block',
          }}
        />
      </Box>

      {debug && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            label={`${Object.keys(metrics).length} sections rendered`}
            variant="outlined"
          />
          {slowest && (
            <Chip
              size="small"
              color={slowest.build_micros > 16000 ? 'warning' : 'default'}
              variant="outlined"
              // 16ms is one frame at 60fps: past it, this section is what
              // drops frames while scrolling.
              label={`slowest ${slowest.id} · ${(slowest.build_micros / 1000).toFixed(1)}ms`}
            />
          )}
          {lastRoute && <Chip size="small" variant="outlined" label={`last tap → ${lastRoute}`} />}
        </Stack>
      )}

      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        Rendered by the app&apos;s own Flutter widgets, from the same feed the phone receives.
      </Typography>
    </Stack>
  );
}
