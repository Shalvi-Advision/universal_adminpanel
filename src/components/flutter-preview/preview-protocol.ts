// Message contract between the admin panel and the Flutter Web preview.
//
// Mirrored in universal_mobile_app/lib/preview/preview_protocol.dart. The two
// must change together — this is a wire format between separately deployed
// builds, so both sides ignore what they do not recognise rather than failing.

export const PREVIEW_CHANNEL = 'bdui-preview';
export const PREVIEW_PROTOCOL_VERSION = 1;

/** Admin → preview. */
export const Inbound = {
  setFeed: 'set_feed',
  patchSection: 'patch_section',
  setContext: 'set_context',
  setDevice: 'set_device',
  setClock: 'set_clock',
  setNetwork: 'set_network',
  setDebug: 'set_debug',
  selectSection: 'select_section',
  refresh: 'refresh',
} as const;

/** Preview → admin. */
export const Outbound = {
  ready: 'preview_ready',
  sectionTapped: 'section_tapped',
  navigation: 'navigation',
  metrics: 'metrics',
  sectionError: 'section_error',
} as const;

export type InboundType = (typeof Inbound)[keyof typeof Inbound];
export type OutboundType = (typeof Outbound)[keyof typeof Outbound];

export interface PreviewEnvelope<T = Record<string, unknown>> {
  channel: typeof PREVIEW_CHANNEL;
  protocol_version: number;
  type: string;
  payload: T;
}

export interface PreviewContextInput {
  store_code: string;
  city?: string;
  language_code?: string;
  /** Matched against each section's audience rule, exactly as the device does. */
  user_tier: 'guest' | 'logged_in' | 'premium';
  profile_id?: string | null;
}

export interface SectionMetrics {
  id: string;
  build_micros: number;
  cache_status?: string;
}

/** Narrows an arbitrary window message to one of ours. */
export function isPreviewMessage(data: unknown): data is PreviewEnvelope {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as PreviewEnvelope).channel === PREVIEW_CHANNEL &&
    typeof (data as PreviewEnvelope).type === 'string'
  );
}
