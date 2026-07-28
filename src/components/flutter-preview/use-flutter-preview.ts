import { useRef, useState, useEffect, useCallback } from 'react';

import type { SectionMetrics, PreviewContextInput } from './preview-protocol';

import {
  Inbound,
  Outbound,
  PREVIEW_CHANNEL,
  isPreviewMessage,
  PREVIEW_PROTOCOL_VERSION,
} from './preview-protocol';

// ----------------------------------------------------------------------

interface Options {
  /** Origin the preview is served from; messages from anywhere else are ignored. */
  previewOrigin: string;
  onSectionTapped?: (id: string, type: string) => void;
  onNavigation?: (route: string) => void;
  onMetrics?: (metrics: SectionMetrics) => void;
  onError?: (id: string, message: string) => void;
}

/**
 * Owns the conversation with the embedded Flutter preview.
 *
 * The queue is the non-obvious part. `postMessage` to a frame that has not yet
 * run its `main()` is dropped silently, and a Flutter Web boot is slow enough
 * that the first few edits reliably land in that window. Without buffering,
 * the preview opens blank and only corrects itself on the next keystroke —
 * which reads as "the preview is broken", not "the preview is still loading".
 */
export function useFlutterPreview({
  previewOrigin,
  onSectionTapped,
  onNavigation,
  onMetrics,
  onError,
}: Options) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);
  const pending = useRef<{ type: string; payload: unknown }[]>([]);

  // Held in refs so the message listener never needs re-subscribing when a
  // caller passes a new inline closure.
  const handlers = useRef({ onSectionTapped, onNavigation, onMetrics, onError });
  handlers.current = { onSectionTapped, onNavigation, onMetrics, onError };

  const post = useCallback(
    (type: string, payload: unknown = {}) => {
      const frame = frameRef.current;
      const envelope = {
        channel: PREVIEW_CHANNEL,
        protocol_version: PREVIEW_PROTOCOL_VERSION,
        type,
        payload,
      };

      if (!frame?.contentWindow || !ready) {
        // Collapse repeats: only the newest value of a given message type
        // matters, so a fast typist does not build a queue of stale titles.
        pending.current = pending.current.filter((m) => m.type !== type);
        pending.current.push({ type, payload });
        return;
      }

      frame.contentWindow.postMessage(envelope, previewOrigin);
    },
    [ready, previewOrigin]
  );

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== previewOrigin) return;
      if (!isPreviewMessage(event.data)) return;

      const { type, payload } = event.data as {
        type: string;
        payload: Record<string, any>;
      };

      switch (type) {
        case Outbound.ready:
          setReady(true);
          break;
        case Outbound.sectionTapped:
          handlers.current.onSectionTapped?.(String(payload.id), String(payload.type));
          break;
        case Outbound.navigation:
          handlers.current.onNavigation?.(String(payload.route));
          break;
        case Outbound.metrics:
          handlers.current.onMetrics?.(payload as SectionMetrics);
          break;
        case Outbound.sectionError:
          handlers.current.onError?.(String(payload.id), String(payload.message));
          break;
        default:
          // A message from a newer preview build. Ignored, deliberately.
          break;
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [previewOrigin]);

  // Drain whatever accumulated during boot, in order.
  useEffect(() => {
    if (!ready) return;
    const queued = pending.current;
    pending.current = [];
    queued.forEach(({ type, payload }) => post(type, payload));
  }, [ready, post]);

  return {
    frameRef,
    ready,
    setScreen: useCallback((screen: string) => post(Inbound.setScreen, { screen }), [post]),
    setConfig: useCallback(
      (config: Record<string, unknown>, clientName?: string) =>
        post(Inbound.setConfig, { config, client_name: clientName }),
      [post]
    ),
    setSlides: useCallback(
      (slides: unknown[]) => post(Inbound.setSlides, { slides }),
      [post]
    ),
    setFeed: useCallback((feed: unknown) => post(Inbound.setFeed, feed), [post]),
    patchSection: useCallback(
      (section: unknown) => post(Inbound.patchSection, { section }),
      [post]
    ),
    setContext: useCallback(
      (context: PreviewContextInput) => post(Inbound.setContext, context),
      [post]
    ),
    setDevice: useCallback((device: unknown) => post(Inbound.setDevice, device), [post]),
    setClock: useCallback((instant: string | null) => post(Inbound.setClock, { instant }), [post]),
    setNetwork: useCallback((id: string) => post(Inbound.setNetwork, { id }), [post]),
    setDebug: useCallback(
      (flags: Record<string, boolean>) => post(Inbound.setDebug, flags),
      [post]
    ),
    selectSection: useCallback((id: string | null) => post(Inbound.selectSection, { id }), [post]),
    refresh: useCallback(() => post(Inbound.refresh), [post]),
  };
}
