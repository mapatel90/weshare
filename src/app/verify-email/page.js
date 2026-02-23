'use client';

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
        backgroundColor: '#f5f5f5',
        padding: '16px'
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          background: '#ffffff',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
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
  );
}
