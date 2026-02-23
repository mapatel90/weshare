'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';
import { Box, Container, Typography, Button, CircularProgress, Alert } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useLanguage } from '@/contexts/LanguageContext';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState(''); // always store a plain string
  const [resending, setResending] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    try {
      // Safely read token from URL on the client
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const t = urlParams.get('token');
        setToken(t);

        if (t) {
          verifyEmail(t);
        } else {
          setStatus('error');
          setMessage('Verification token is missing. Please check your email link.');
        }
      }
    } catch (err) {
      console.error('Error reading verification token from URL', err);
      setStatus('error');
      setMessage('Something went wrong while reading your verification link.');
    }
  }, []);

  const verifyEmail = async (verificationToken) => {
    try {
      const response = await apiGet(`/api/auth/verify-email/${verificationToken}`, {
        showLoader: false,
        includeAuth: false
      });

      if (response && response.success) {
        setStatus('success');
        // Ensure message is always a string
        const msg = response.message ?? lang("common.emailVerifiedSuccessfully", "Email verified successfully.");
        setMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 12000);
      } else {
        setStatus('error');
        const msg = response?.message ?? lang("authentication.invalidOrExpiredToken", "Invalid or expired verification link.");
        setMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }
    } catch (error) {
      setStatus('error');
      const msg = error?.message || 'Failed to verify email. The link may be invalid or expired.';
      setMessage(typeof msg === 'string' ? msg : String(msg));
    }
  };

  const handleResendVerification = async () => {
    const email = prompt('Please enter your email address:');
    if (!email) return;

    try {
      setResending(true);
      const response = await apiPost('/api/auth/resend-verification', { email }, {
        showLoader: false,
        includeAuth: false
      });

      if (response.success) {
        alert('Verification email sent! Please check your inbox.');
      } else {
        alert(response.message || 'Failed to resend verification email');
      }
    } catch (error) {
      alert(error.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <Box
      className="loginSection"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            backgroundColor: 'white',
            borderRadius: 3,
            padding: 4,
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }}
        >
          {/* Logo or Title */}
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#333', mb: 3 }}>
            WeShare Energy
          </Typography>

          {/* Status Content */}
          {status === 'verifying' && (
            <>
              <CircularProgress size={60} sx={{ color: '#F6A623', mb: 3 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                {lang("common.verifyingEmail", "Verifying Your Email")}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {lang("common.verifyingEmailMessage", "Please wait while we verify your email address...")}
              </Typography>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircleIcon sx={{ fontSize: 80, color: '#4caf50', mb: 3 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#4caf50', mb: 2 }}>
                {lang("common.emailVerifiedSuccessfully", "Email Verified Successfully!")}
              </Typography>
              <Alert severity="success" sx={{ mb: 3 }}>
                {message}
              </Alert>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {lang("common.redirectingToLogin", "Redirecting you to login page...")}
              </Typography>
              <Button
                variant="contained"
                onClick={() => router.push('/login')}
                sx={{
                  backgroundColor: '#F6A623',
                  '&:hover': { backgroundColor: '#e09620' },
                  textTransform: 'none',
                  padding: '12px 40px',
                  fontWeight: 600
                }}
              >
                {lang("common.goToLogin", "Go to Login")}
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <ErrorIcon sx={{ fontSize: 80, color: '#f44336', mb: 3 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#f44336', mb: 2 }}>
                {lang("common.verificationFailed", "Verification Failed")}
              </Typography>
              <Alert severity="error" sx={{ mb: 3 }}>
                {message}
              </Alert>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  onClick={handleResendVerification}
                  disabled={resending}
                  sx={{
                    borderColor: '#F6A623',
                    color: '#F6A623',
                    '&:hover': { borderColor: '#e09620', backgroundColor: 'rgba(246, 166, 35, 0.1)' },
                    textTransform: 'none',
                    padding: '10px 30px',
                    fontWeight: 600
                  }}
                >
                  {resending ? 'Sending...' : lang("common.resendVerificationEmail", "Resend Verification Email")}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => router.push('/login')}
                  sx={{
                    backgroundColor: '#F6A623',
                    '&:hover': { backgroundColor: '#e09620' },
                    textTransform: 'none',
                    padding: '10px 30px',
                    fontWeight: 600
                  }}
                >
                  {lang("authentication.backToLogin", "Back to Login")}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
}
