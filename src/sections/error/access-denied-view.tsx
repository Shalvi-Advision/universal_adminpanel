import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function AccessDeniedView() {
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
        <Iconify icon={'solar:shield-warning-bold-duotone' as any} width={80} />
      </Box>

      <Typography variant="h3" sx={{ mb: 2 }}>
        Access Denied
      </Typography>

      <Typography sx={{ color: 'text.secondary', maxWidth: 480, textAlign: 'center' }}>
        You do not have permission to access this page. Contact your super admin to request access.
      </Typography>

      <Button
        component={RouterLink}
        href="/dashboard"
        size="large"
        variant="contained"
        color="inherit"
        sx={{ mt: 5 }}
      >
        Go to Dashboard
      </Button>
    </Container>
  );
}
