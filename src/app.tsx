import 'src/global.css';

import { useEffect } from 'react';

import { usePathname } from 'src/routes/hooks';

import { ThemeProvider } from 'src/theme/theme-provider';
import { StoreCodeProvider } from 'src/contexts/store-code-context';
import { PermissionsProvider } from 'src/contexts/permissions-context';
import { useProject, ProjectProvider } from 'src/contexts/project-context';

// ----------------------------------------------------------------------

type AppProps = {
  children: React.ReactNode;
};

export default function App({ children }: AppProps) {
  useScrollToTop();

  return (
    <ThemeProvider>
      <ProjectProvider>
        <ProjectScopedContent>{children}</ProjectScopedContent>
      </ProjectProvider>
    </ThemeProvider>
  );
}

// ----------------------------------------------------------------------

// Keying the subtree by project code remounts every page (and the store-code
// provider) on client switch, so all data re-fetches against the new tenant.
function ProjectScopedContent({ children }: AppProps) {
  const { projectCode } = useProject();

  return (
    <PermissionsProvider key={projectCode}>
      <StoreCodeProvider>{children}</StoreCodeProvider>
    </PermissionsProvider>
  );
}

// ----------------------------------------------------------------------

function useScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
