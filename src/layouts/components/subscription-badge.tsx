import type { MySubscriptionStatus } from 'src/services/subscriptions';

import { useState, useEffect } from 'react';

import Tooltip from '@mui/material/Tooltip';

import { fDate } from 'src/utils/format-time';

import { useProject } from 'src/contexts/project-context';
import { getMySubscriptionStatus } from 'src/services/subscriptions';

import { Label } from 'src/components/label';

// Re-fetches occasionally to pick up a renewal made elsewhere (e.g. by a
// super admin on another tab) — not meant to recompute the countdown live.
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function SubscriptionBadge() {
  const { projectCode } = useProject();
  const [status, setStatus] = useState<MySubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchStatus = async () => {
      try {
        const response = await getMySubscriptionStatus();
        if (active && response.success) {
          setStatus(response.data);
        }
      } catch {
        // Defensive: a subscription-status hiccup should never break the
        // header — just render nothing.
        if (active) setStatus(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    setLoading(true);
    fetchStatus();
    const interval = setInterval(fetchStatus, REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [projectCode]);

  if (loading || !status || !status.hasSubscription) {
    return null;
  }

  const { isExpired, daysRemaining, subscription } = status;

  const color = isExpired || daysRemaining <= 0 ? 'error' : daysRemaining <= 7 ? 'warning' : 'success';

  const text =
    isExpired || daysRemaining <= 0 ? 'Subscription expired' : `Expires in ${daysRemaining}d`;

  const tooltipTitle = subscription
    ? `${fDate(subscription.start_date)} – ${fDate(subscription.end_date)}`
    : text;

  return (
    <Tooltip title={tooltipTitle}>
      <Label color={color} variant="soft">
        {text}
      </Label>
    </Tooltip>
  );
}
