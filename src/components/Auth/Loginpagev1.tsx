
'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack,
  TextField,
  Typography,
  Link
} from '@mui/material';
import { Visibility, VisibilityOff, Google, Microsoft } from '@mui/icons-material';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState({ email: false, password: false });

  const handleTogglePassword = () => setShowPassword((prev) => !prev);

  const handleSubmit = () => {
    setError({
      email: !emailOrPhone,
      password: !password,
    });
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 6, p: 4, borderRadius: 3, boxShadow: 3, bgcolor: 'background.paper' }}>
        <Typography variant="h5" align="center" fontWeight={600} mb={2}>
          <Link href="#" underline="hover" fontWeight="bold" color="primary">
            Social DNA Labs
          </Link>
        </Typography>

        <Typography variant="h6" gutterBottom>
          Please login
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Email or mobile number"
            variant="outlined"
            fullWidth
            value={emailOrPhone}
            error={error.email}
            helperText={error.email ? "Please provide an email address or mobile number" : ""}
            onChange={(e) => setEmailOrPhone(e.target.value)}
          />

          <FormControl variant="outlined" fullWidth error={error.password}>
            <InputLabel htmlFor="password">Password</InputLabel>
            <OutlinedInput
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton onClick={handleTogglePassword} edge="end" aria-label="toggle password visibility">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
              label="Password"
            />
            {error.password && <FormHelperText>Please enter your password</FormHelperText>}
          </FormControl>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center">
              <Checkbox size="small" />
              <Typography>Remember me</Typography>
            </Stack>
            <Link href="#" underline="hover">Forgot password?</Link>
          </Stack>

          <Button variant="contained" fullWidth onClick={handleSubmit}>
            Sign in
          </Button>

          <Typography align="center" fontSize="14px">
            Don't have an account?{' '}
            <Link href="#" underline="hover">Create your account</Link>
          </Typography>

          <Divider>Or</Divider>

          <Button variant="outlined" fullWidth>
            Get OTP
          </Button>

          <Divider>Or, login with</Divider>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="outlined" startIcon={<Google />} fullWidth>
              Google
            </Button>
            <Button variant="outlined" startIcon={<Microsoft />} fullWidth>
              Microsoft
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
}
