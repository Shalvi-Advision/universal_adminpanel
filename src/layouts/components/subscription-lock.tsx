import type { ReactNode } from 'react';
import type { MySubscriptionStatus } from 'src/services/subscriptions';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';

import { useProject } from 'src/contexts/project-context';
import { usePermissions } from 'src/contexts/permissions-context';
import { getMySubscriptionStatus } from 'src/services/subscriptions';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

// The backend locks an expired tenant out of the whole /api/admin surface
// (routes/admin.js), so without this every page would render its own shell and
// then fill with 403s. Replacing the page content with one explanation is both
// clearer and honest about what has happened.
//
// The header stays mounted around this, so a locked-out admin can still switch
// project or sign out. /api/subscriptions/status sits outside /api/admin
// precisely so it keeps answering while the rest is blocked.
//
// Super admins are exempt here for the same reason they are exempt in the
// middleware — they are the ones who renew.
export function SubscriptionLock({ children }: { children: ReactNode }) {
  const { projectCode } = useProject();
  const { isSuperAdmin } = usePermissions();
  const [status, setStatus] = useState<MySubscriptionStatus | null>(null);

  useEffect(() => {
    let active = true;

    getMySubscriptionStatus()
      .then((response) => {
        if (active && response.success) setStatus(response.data);
      })
      .catch(() => {
        // Fail-open, mirroring the middleware: a status call that fails must
        // never be what locks someone out of their own panel.
        if (active) setStatus(null);
      });

    return () => {
      active = false;
    };
  }, [projectCode]);

  const locked = !isSuperAdmin && !!status?.hasSubscription && status.isExpired;

  if (!locked) {
    return <>{children}</>;
  }

  const endDate = status?.subscription?.end_date;

  return (
    <Container
      sx={{
        py: 10,
        flexGrow: 1,
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ mb: 3, color: 'error.main' }}>
        <Iconify icon={'solar:calendar-mark-bold-duotone' as any} width={80} />
      </Box>

      <Typography variant="h3" sx={{ mb: 2 }}>
        Subscription expired
      </Typography>

      <Typography sx={{ color: 'text.secondary', maxWidth: 520, textAlign: 'center' }}>
        {endDate
          ? `The subscription for ${projectCode} ended on ${fDate(endDate)}.`
          : `The subscription for ${projectCode} has ended.`}{' '}
        Access to orders, products, reports and settings is paused until it is renewed.
        Please contact your administrator.
      </Typography>
    </Container>
  );
}
