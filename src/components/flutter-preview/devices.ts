// Device frames the preview can imitate.
//
// Mirrors DeviceSpec in universal_mobile_app/lib/preview/preview_state.dart.
// Only `id` travels over the wire — the Flutter side owns the safe-area insets,
// because they have to match what SafeArea actually does on the device, and
// duplicating them here would be two sources of truth for one number.

export interface Device {
  id: string;
  label: string;
  width: number;
  height: number;
  /** Rough guide for the panel's own layout; Flutter renders at true scale. */
  group: 'phone' | 'tablet';
}

export const DEVICES: Device[] = [
  { id: 'iphone_15_pro', label: 'iPhone 15 Pro', width: 393, height: 852, group: 'phone' },
  { id: 'pixel_8', label: 'Pixel 8', width: 412, height: 915, group: 'phone' },
  { id: 'galaxy_s23', label: 'Galaxy S23', width: 360, height: 780, group: 'phone' },
  { id: 'ipad_mini', label: 'iPad mini', width: 744, height: 1133, group: 'tablet' },
];

export const DEFAULT_DEVICE = DEVICES[0];

export const NETWORK_PROFILES = [
  { id: 'wifi', label: 'WiFi' },
  { id: '4g', label: '4G' },
  { id: '3g', label: '3G' },
  { id: 'offline', label: 'Offline' },
];

export const USER_TIERS = [
  { id: 'guest', label: 'Guest' },
  { id: 'logged_in', label: 'Logged in' },
  { id: 'premium', label: 'Premium' },
] as const;
