'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiGet } from '@/lib/api';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Simple string state (no TypeScript types in this JS file)
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');

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
          error?.message ||
            'Failed to verify email. The link may be invalid or expired.'
        );
      }
    };

    verifyEmail();
  }, [token, router]);

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
            Email Verification
          </h1>

          {status === 'verifying' && (
            <p style={{ margin: 0, textAlign: 'center' }}>
              Verifying your email address, please wait...
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
                Email verified successfully!
              </p>
              <p style={{ margin: 0, textAlign: 'center' }}>{message}</p>
              <p style={{ marginTop: '12px', textAlign: 'center', fontSize: '14px' }}>
                You will be redirected to the login page shortly. If not,{' '}
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
                  click here
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
                Verification failed
              </p>
              <p style={{ margin: 0, textAlign: 'center' }}>{message}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
