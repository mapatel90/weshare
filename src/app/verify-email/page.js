'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiPost } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

function VerifyEmailContent() {
  const router = useRouter();
  const { lang, changeLanguage } = useLanguage();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [status, setStatus] = useState('idle'); // 'idle' | 'verifying' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  const handleOtpChange = (index, value) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setErrorMsg('');

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = ['', '', '', '', '', ''];
      for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
      setOtp(newOtp);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const otpValue = otp.join('');
    if (!email.trim()) {
      setErrorMsg(lang('validation.emailRequired', 'Email is required.'));
      return;
    }
    if (otpValue.length !== 6) {
      setErrorMsg(lang('common.otpRequired', 'Please enter the 6-digit verification code.'));
      return;
    }

    setStatus('verifying');
    try {
      const response = await apiPost('/api/auth/verify-email', {
        email: email.trim(),
        otp: otpValue
      }, {
        showLoader: false,
        includeAuth: false
      });

      if (response?.language) {
        changeLanguage(response.language === 'vi' ? 'vi' : 'en');
      }

      if (response?.success) {
        setStatus('success');
        setTimeout(() => router.push('/login'), 4000);
      } else {
        setStatus('error');
        setErrorMsg(response?.message || lang('common.verificationInvalidLink', 'Invalid or expired code. Please try again.'));
        if (response?.expired) setOtp(['', '', '', '', '', '']);
      }
    } catch (error) {
      setStatus('error');
      setErrorMsg(error?.message || lang('common.verifyEmailFailed', 'Verification failed. Please try again.'));
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setErrorMsg(lang('validation.emailRequired', 'Please enter your email address first.'));
      return;
    }
    setResending(true);
    setResendSuccess(false);
    setErrorMsg('');
    try {
      const response = await apiPost('/api/auth/resend-verification', { email: email.trim() }, {
        showLoader: false,
        includeAuth: false
      });
      if (response?.success) {
        setResendSuccess(true);
        setOtp(['', '', '', '', '', '']);
        setStatus('idle');
        inputRefs.current[0]?.focus();
      } else {
        setErrorMsg(response?.message || lang('common.resendVerificationEmailFailed', 'Failed to resend. Please try again.'));
      }
    } catch (error) {
      setErrorMsg(error?.message || lang('common.resendVerificationEmailFailed', 'Failed to resend. Please try again.'));
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
          position: 'absolute', left: 0, bottom: 0, width: '100%', height: '100%',
          background: "url('/images/footer-one-bg1.svg') no-repeat center bottom",
          backgroundSize: 'contain', opacity: 1, zIndex: 0, pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute', left: 0, bottom: 0, width: '100%', height: '100%',
          background: 'linear-gradient(180deg, rgba(217,217,217,0) 0%, #FFE6BC 100%)',
          zIndex: 0, pointerEvents: 'none'
        }}
      />

      <div style={{ width: '100%', maxWidth: '520px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Link href="/" style={{ display: 'inline-block', textDecoration: 'none' }}>
            <img src="/images/main_logo.png" alt="WeShare" style={{ maxWidth: '180px', width: '100%' }} />
          </Link>
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '32px 28px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
          }}
        >
          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <h2 style={{ margin: '0 0 12px', fontSize: '22px', color: '#2e7d32' }}>
                {lang('common.emailVerifiedSuccessfully', 'Email Verified!')}
              </h2>
              <p style={{ margin: '0 0 20px', color: '#555', fontSize: '15px' }}>
                {lang('common.emailVerifiedSuccessMessage', 'Your account is now active. You will be redirected to login shortly.')}
              </p>
              <button
                type="button"
                onClick={() => router.push('/login')}
                style={{
                  background: '#F6A623', color: '#fff', border: 'none',
                  borderRadius: '8px', padding: '11px 28px', fontSize: '15px',
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                {lang('authentication.signIn', 'Go to Login')}
              </button>
            </div>
          ) : (
            <>
              <h1 style={{ margin: '0 0 8px', fontSize: '22px', textAlign: 'center' }}>
                {lang('page_title.verifyEmail', 'Verify Your Email')}
              </h1>
              <p style={{ margin: '0 0 24px', textAlign: 'center', color: '#666', fontSize: '14px', lineHeight: 1.5 }}>
                {lang('common.otpSentMessage', 'We sent a 6-digit verification code to your email. Enter it below to verify your account.')}
              </p>

              <form onSubmit={handleSubmit}>
                {/* Email field */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#444' }}>
                    {lang('authentication.email', 'Email Address')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                    placeholder="name@example.com"
                    required
                    style={{
                      width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0',
                      borderRadius: '8px', fontSize: '15px', outline: 'none',
                      boxSizing: 'border-box', background: '#fafafa'
                    }}
                  />
                </div>

                {/* OTP boxes */}
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: 600, color: '#444' }}>
                    {lang('common.verificationCode', 'Verification Code')}
                  </label>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (inputRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        style={{
                          width: '48px', height: '56px', textAlign: 'center',
                          fontSize: '22px', fontWeight: 700, border: '2px solid',
                          borderColor: digit ? '#F6A623' : '#e0e0e0',
                          borderRadius: '10px', outline: 'none', background: '#fff',
                          transition: 'border-color 0.15s',
                          caretColor: '#F6A623'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Error / resend success messages */}
                {errorMsg && (
                  <p style={{ margin: '12px 0 0', textAlign: 'center', color: '#d32f2f', fontSize: '13px' }}>
                    {errorMsg}
                  </p>
                )}
                {resendSuccess && (
                  <p style={{ margin: '12px 0 0', textAlign: 'center', color: '#2e7d32', fontSize: '13px' }}>
                    {lang('common.verificationEmailSent', 'New code sent! Please check your inbox.')}
                  </p>
                )}

                {/* Resend link */}
                <p style={{ margin: '14px 0 0', textAlign: 'center', fontSize: '13px', color: '#666' }}>
                  {lang('common.didntReceiveCode', "Didn't receive the code?")}{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    style={{
                      background: 'none', border: 'none', color: '#F6A623',
                      cursor: resending ? 'not-allowed' : 'pointer', fontWeight: 600,
                      fontSize: '13px', padding: 0, opacity: resending ? 0.6 : 1
                    }}
                  >
                    {resending ? lang('common.saving', 'Sending...') : lang('common.resendVerificationEmail', 'Resend Code')}
                  </button>
                </p>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={status === 'verifying' || otp.join('').length !== 6}
                  style={{
                    marginTop: '20px', width: '100%', padding: '13px',
                    background: status === 'verifying' || otp.join('').length !== 6 ? '#ccc' : '#F6A623',
                    color: '#fff', border: 'none', borderRadius: '8px',
                    fontSize: '16px', fontWeight: 700,
                    cursor: status === 'verifying' || otp.join('').length !== 6 ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  {status === 'verifying'
                    ? lang('common.verifyingEmailMessage', 'Verifying...')
                    : lang('common.verifyEmail', 'Verify Email')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading...
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
