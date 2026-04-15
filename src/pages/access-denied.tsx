import { CONFIG } from 'src/config-global';

import { AccessDeniedView } from 'src/sections/error/access-denied-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Access Denied | ${CONFIG.appName}`}</title>

      <AccessDeniedView />
    </>
  );
}
