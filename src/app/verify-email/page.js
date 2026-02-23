'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Simple string state (no TypeScript types in this JS file)
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing. Please check your email link.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await apiGet(`/api/auth/verify-email/${token}`, {
          showLoader: false,
          includeAuth: false
        });

        if (response && response.success) {
          setStatus('success');
          setMessage(response.message || 'Email verified successfully. You can now login.');
          // Redirect after a short delay
          setTimeout(() => {
            router.push('/login');
          }, 5000);
        } else {
          setStatus('error');
          setMessage(
            (response && response.message) ||
              'Invalid or expired verification link. Please request a new one.'
          );
        }
      } catch (error) {
        console.error('Error verifying email:', error);
        setStatus('error');
        setMessage(
          error?.message || lang('common.verifyingEmails', 'Failed to verify email. The link may be invalid or expired.')
        );
      }
    };

    verifyEmail();
  }, [token, router]);

  const handleResendVerification = async () => {
    const email = window.prompt(lang('authentication.enterEmail', 'Please enter your email address:'));
    if (!email) return;

    try {
      setResending(true);
      const response = await apiPost('/api/auth/resend-verification', { email }, {
        showLoader: false,
        includeAuth: false
      });

      if (response?.success) {
        window.alert(lang('messages.success', 'Verification email sent! Please check your inbox.'));
      } else {
        window.alert(response?.message || lang('common.resendVerificationEmail', 'Failed to resend verification email'));
      }
    } catch (error) {
      window.alert(error?.message || lang('common.resendVerificationEmail', 'Failed to resend verification email'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: "url('/images/loginBgImg.png') no-repeat center top",
        backgroundSize: 'contain',
        padding: '16px'
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          background: "url('/images/footer-one-bg1.svg') no-repeat center bottom",
          backgroundSize: 'contain',
          backgroundBlendMode: 'lighten',
          opacity: 1,
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(180deg, rgba(217, 217, 217, 0) 0%, #FFE6BC 100%)',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Link href="/" style={{ display: 'inline-block', textDecoration: 'none' }}>
            <img
              src="/images/main_logo.png"
              alt="WeShare"
              style={{
                maxWidth: '200px',
                width: '100%',
                cursor: 'pointer'
              }}
            />
          </Link>
        </div>

        <div
          style={{
            maxWidth: '480px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            position: 'relative',
            zIndex: 1
          }}
        >
          <h1 style={{ margin: '0 0 16px', fontSize: '22px', textAlign: 'center' }}>
            {lang('page_title.verifyEmail', 'Email Verification')}
          </h1>

          {status === 'verifying' && (
            <p style={{ margin: 0, textAlign: 'center' }}>
              {lang('common.verifyingEmailMessage', 'Verifying your email address, please wait...')}
            </p>
          )}

          {status === 'success' && (
            <>
              <p
                style={{
                  margin: '0 0 8px',
                  textAlign: 'center',
                  color: '#2e7d32',
                  fontWeight: 600
                }}
              >
                {lang('common.emailVerifiedSuccessfully', 'Email verified successfully!')}
              </p>
              <p style={{ margin: 0, textAlign: 'center' }}>{message}</p>
              <p style={{ marginTop: '12px', textAlign: 'center', fontSize: '14px' }}>
                {lang('common.redirectingToLogin', 'You will be redirected to the login page shortly. If not,')} {' '}
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: '#1976d2',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {lang('common.goToLogin', 'click here')}
                </button>
                .
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <p
                style={{
                  margin: '0 0 8px',
                  textAlign: 'center',
                  color: '#d32f2f',
                  fontWeight: 600
                }}
              >
                {lang('common.verificationFailed', 'Verification failed')}
              </p>
              <p style={{ margin: 0, textAlign: 'center' }}>{message}</p>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginTop: '16px'
                }}
              >
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending}
                  style={{
                    border: '1px solid #F6A623',
                    background: 'transparent',
                    color: '#F6A623',
                    borderRadius: '6px',
                    padding: '10px 16px',
                    cursor: resending ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    opacity: resending ? 0.7 : 1
                  }}
                >
                  {resending ? lang('common.saving', 'Sending...') : lang('common.resendVerificationEmail', 'Resend Verification Email')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
