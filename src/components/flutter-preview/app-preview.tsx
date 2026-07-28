import type { PreviewScreen, SectionMetrics } from './preview-protocol';

import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { CONFIG } from 'src/config-global';

import { DEVICES, USER_TIERS, DEFAULT_DEVICE, NETWORK_PROFILES } from './devices';
import { useFlutterPreview } from './use-flutter-preview';

// ----------------------------------------------------------------------

interface Props {
  /** Which app screen to show. */
  screen: PreviewScreen;

  /** Draft project config — branding, splash settings. Sent for every screen. */
  config?: Record<string, unknown>;
  clientName?: string;

  /** Draft onboarding slides. Only read by the onboarding screen. */
  slides?: unknown[];

  /** Draft home feed, in the shape POST /api/home/feed returns. */
  feed?: unknown;

  /** Store the preview resolves content for. */
  storeCode?: string;

  /** Section highlighted in the preview, and the tap-back handler. */
  selectedId?: string | null;
  onSelect?: (id: string) => void;

  /** Controls that make no sense for a given screen can be hidden. */
  showStoreControls?: boolean;
}

/** Whether a live preview is deployed for this environment. */
export const livePreviewAvailable = () => Boolean(CONFIG.previewOrigin);

/**
 * The mobile app, running inside the admin panel.
 *
 * One surface for every screen. Each screen page used to build its own phone
 * mock-up in HTML, which meant three separate approximations that each drifted
 * from the app on their own schedule — a splash tagline could look right in
 * the panel and wrong on the device with nothing to catch it. This renders the
 * real widgets, so there is nothing left to drift.
 */
export function AppPreview({
  screen,
  config,
  clientName,
  slides,
  feed,
  storeCode = '',
  selectedId,
  onSelect,
  showStoreControls = true,
}: Props) {
  const [device, setDevice] = useState(DEFAULT_DEVICE.id);
  const [network, setNetwork] = useState('wifi');
  const [tier, setTier] = useState('guest');
  const [clock, setClock] = useState('');
  const [debug, setDebug] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, SectionMetrics>>({});
  const [lastRoute, setLastRoute] = useState<string | null>(null);

  const bridge = useFlutterPreview({
    previewOrigin: CONFIG.previewOrigin,
    onSectionTapped: (id) => onSelect?.(id),
    onNavigation: setLastRoute,
    onMetrics: (m) => setMetrics((prev) => ({ ...prev, [m.id]: m })),
  });

  const {
    setScreen,
    setConfig,
    setSlides,
    setFeed,
    setContext,
    setDevice: pushDevice,
    setNetwork: pushNetwork,
    setClock: pushClock,
    setDebug: pushDebug,
    selectSection,
  } = bridge;

  // One effect per concern, so a device change does not resend the feed and a
  // keystroke in a title does not resend the device.
  useEffect(() => setScreen(screen), [screen, setScreen]);
  useEffect(() => pushDevice({ id: device }), [device, pushDevice]);
  useEffect(() => pushNetwork(network), [network, pushNetwork]);
  useEffect(() => pushDebug({ enabled: debug }), [debug, pushDebug]);
  useEffect(() => selectSection(selectedId ?? null), [selectedId, selectSection]);

  useEffect(() => {
    if (config) setConfig(config, clientName);
  }, [config, clientName, setConfig]);

  useEffect(() => {
    if (slides) setSlides(slides);
  }, [slides, setSlides]);

  useEffect(() => {
    if (feed) setFeed(feed);
  }, [feed, setFeed]);

  useEffect(() => {
    pushClock(clock ? new Date(clock).toISOString() : null);
  }, [clock, pushClock]);

  useEffect(() => {
    setContext({ store_code: storeCode, user_tier: tier as never });
  }, [storeCode, tier, setContext]);

  const frameSrc = useMemo(() => {
    // The preview pins its outbound messages to this origin, so the draft
    // layout cannot be read by anything else that manages to embed it.
    const parent = encodeURIComponent(window.location.origin);
    return `${CONFIG.previewOrigin}/index.html?parentOrigin=${parent}`;
  }, []);

  const slowest = useMemo(() => {
    const all = Object.values(metrics);
    if (!all.length) return null;
    return all.reduce((worst, m) => (m.build_micros > worst.build_micros ? m : worst));
  }, [metrics]);

  const selectedDevice = DEVICES.find((d) => d.id === device) ?? DEFAULT_DEVICE;

  if (!livePreviewAvailable()) {
    return (
      <Alert severity="info">
        The live preview is not configured for this environment. Set{' '}
        <code>VITE_PREVIEW_ORIGIN</code> to the address serving the app&apos;s web build.
      </Alert>
    );
  }

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

        {showStoreControls && (
          <TextField
            select
            size="small"
            label="Shopper"
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            sx={{ minWidth: 130 }}
          >
            {USER_TIERS.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>
        )}

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

        {/* Scheduling only exists on the home layout. */}
        {screen === 'home' && (
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
        )}

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
        }}
      >
        <Box
          component="iframe"
          ref={bridge.frameRef}
          src={frameSrc}
          title={`${screen} preview`}
          // First-party, but still sandboxed: it should never be able to
          // navigate the admin panel out from under itself.
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
          {screen === 'home' && (
            <Chip
              size="small"
              variant="outlined"
              label={`${Object.keys(metrics).length} sections rendered`}
            />
          )}
          {slowest && (
            <Chip
              size="small"
              variant="outlined"
              // 16ms is one frame at 60fps: past it, this section is what
              // drops frames while scrolling.
              color={slowest.build_micros > 16000 ? 'warning' : 'default'}
              label={`slowest ${slowest.id} · ${(slowest.build_micros / 1000).toFixed(1)}ms`}
            />
          )}
          {lastRoute && <Chip size="small" variant="outlined" label={`last tap → ${lastRoute}`} />}
        </Stack>
      )}

      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        Rendered by the app&apos;s own widgets, from the same data the phone receives.
      </Typography>
    </Stack>
  );
}
