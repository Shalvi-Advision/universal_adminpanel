import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { useRouter } from 'src/routes/hooks';

import { adminLogin } from 'src/services/auth';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function SignInView() {
  const router = useRouter();

  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleMobileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      // Digits only — the API expects a bare 10-digit number.
      setMobile(event.target.value.replace(/\D/g, '').slice(0, 10));
      if (errorMessage) {
        setErrorMessage('');
      }
    },
    [errorMessage]
  );

  const handlePasswordChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(event.target.value);
      if (errorMessage) {
        setErrorMessage('');
      }
    },
    [errorMessage]
  );

  const handleSignIn = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!/^[6-9]\d{9}$/.test(mobile)) {
        setErrorMessage('Please enter a valid 10-digit mobile number');
        return;
      }

      if (!password) {
        setErrorMessage('Please enter your password');
        return;
      }

      setLoading(true);
      setErrorMessage('');

      try {
        const response = await adminLogin(mobile, password);
        if (response.success) {
          router.push('/dashboard');
        } else {
          setErrorMessage(response.message || 'Sign in failed. Please try again.');
        }
      } catch (error: any) {
        setErrorMessage(error.message || 'Invalid mobile number or password.');
      } finally {
        setLoading(false);
      }
    },
    [mobile, password, router]
  );

  return (
    <>
      <Box
        sx={{
          gap: 1.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 5,
        }}
      >
        <Typography variant="h5">Sign in</Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
          }}
        >
          Enter your mobile number and password to continue
        </Typography>
      </Box>

      <Box
        component="form"
        onSubmit={handleSignIn}
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          flexDirection: 'column',
        }}
      >
        <TextField
          fullWidth
          name="mobile"
          label="Mobile Number"
          value={mobile}
          onChange={handleMobileChange}
          placeholder="Enter your mobile number"
          autoComplete="username"
          disabled={loading}
          sx={{ mb: 3 }}
          slotProps={{
            inputLabel: { shrink: true },
          }}
        />

        <TextField
          fullWidth
          name="password"
          label="Password"
          value={password}
          onChange={handlePasswordChange}
          placeholder="Enter your password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          disabled={loading}
          sx={{ mb: 3 }}
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    <Iconify
                      icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Button
          fullWidth
          size="large"
          type="submit"
          color="inherit"
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Sign in'}
        </Button>
      </Box>
    </>
  );
}
