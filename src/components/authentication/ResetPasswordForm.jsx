"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import {
    Box,
    TextField,
    Button,
    Typography,
    Alert,
    IconButton,
    InputAdornment,
    CircularProgress,
    Paper
} from '@mui/material';
import { useLanguage } from '@/contexts/LanguageContext';

const ResetPasswordForm = ({ token, loginPath = '/login' }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [newPasswordError, setNewPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [tokenValid, setTokenValid] = useState(false);
    const [username, setUsername] = useState('');
    const { lang } = useLanguage();
    const router = useRouter();

    // Verify token on component mount
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setError(lang('authentication.invalidResetLink'));
                setVerifying(false);
                return;
            }

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const response = await fetch(`${apiUrl}/api/auth/verify-reset-token/${token}`);
                const data = await response.json();

                if (response.ok && data.success) {
                    setTokenValid(true);
                    setUsername(data.username || '');
                } else {
                    setError(data.message || lang('authentication.invalidOrExpiredToken'));
                }
            } catch (err) {
                console.error('Token verification error:', err);
                setError(lang('authentication.tokenVerificationError'));
            } finally {
                setVerifying(false);
            }
        };

        verifyToken();
    }, [token, lang]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setNewPasswordError('');
        setConfirmPasswordError('');

        // Validation
        let isValid = true;

        if (!newPassword.trim()) {
            setNewPasswordError(lang('validation.passwordRequired'));
            isValid = false;
        } else if (newPassword.length < 6) {
            setNewPasswordError(lang('validation.passwordMinLength'));
            isValid = false;
        }

        if (!confirmPassword.trim()) {
            setConfirmPasswordError(lang('validation.confirmPasswordRequired'));
            isValid = false;
        } else if (newPassword !== confirmPassword) {
            setConfirmPasswordError(lang('validation.passwordsDoNotMatch'));
            isValid = false;
        }

        if (!isValid) {
            setLoading(false);
            return;
        }

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/api/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    newPassword: newPassword.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to reset password');
            }

            setSuccess(true);
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push(loginPath);
            }, 3000);
        } catch (err) {
            console.error('Reset password error:', err);
            setError(err.message || lang('authentication.resetPasswordError'));
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5 }}>
                <CircularProgress sx={{ color: '#F6A623', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                    {lang('authentication.verifyingResetLink')}...
                </Typography>
            </Box>
        );
    }

    if (!tokenValid) {
        return (
            <Box>
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error || lang('authentication.invalidOrExpiredToken')}
                </Alert>
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {lang('authentication.requestNewResetLink')}
                    </Typography>
                    <Link
                        href="/reset"
                        style={{ fontWeight: 600, color: '#2386FF', textDecoration: 'none' }}
                    >
                        {lang('authentication.forgotPassword')}
                    </Link>
                </Box>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ color: '#718096', textAlign: 'center', mb: 1 }}>
                    {lang('authentication.enterNewPassword')}
                </Typography>
                {username && (
                    <Typography variant="body2" sx={{ color: '#4a5568', textAlign: 'center', fontWeight: 500 }}>
                        {lang('authentication.forAccount')}: {username}
                    </Typography>
                )}
            </Box>

            {success ? (
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        backgroundColor: '#d4edda',
                        border: '1px solid #c3e6cb',
                        borderRadius: '8px',
                        mb: 3
                    }}
                >
                    <Typography variant="h6" sx={{ color: '#155724', mb: 1, fontWeight: 600 }}>
                        ✓ {lang('authentication.passwordResetSuccess')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#155724', mb: 2 }}>
                        {lang('authentication.passwordResetSuccessMessage')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#155724', fontSize: '0.875rem' }}>
                        {lang('authentication.redirectingToLogin')}...
                    </Typography>
                </Paper>
            ) : null}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {!success && (
                <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ mb: 1, color: '#696969', fontWeight: 500 }}>
                            {lang('authentication.newPassword')} *
                        </Typography>
                        <TextField
                            fullWidth
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder={lang('authentication.enterNewPassword')}
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                if (newPasswordError) setNewPasswordError('');
                            }}
                            error={!!newPasswordError}
                            helperText={newPasswordError}
                            required
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: '#fff',
                                    borderRadius: '8px',
                                    '& fieldset': {
                                        borderColor: '#e0e0e0',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#F6A623',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#F6A623',
                                        borderWidth: '2px',
                                    },
                                },
                            }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowNewPassword((v) => !v)}
                                            edge="end"
                                            aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                                            sx={{ color: '#696969' }}
                                        >
                                            {showNewPassword ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ mb: 1, color: '#696969', fontWeight: 500 }}>
                            {lang('authentication.confirmPassword')} *
                        </Typography>
                        <TextField
                            fullWidth
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder={lang('authentication.confirmNewPassword')}
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (confirmPasswordError) setConfirmPasswordError('');
                            }}
                            error={!!confirmPasswordError}
                            helperText={confirmPasswordError}
                            required
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: '#fff',
                                    borderRadius: '8px',
                                    '& fieldset': {
                                        borderColor: '#e0e0e0',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#F6A623',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#F6A623',
                                        borderWidth: '2px',
                                    },
                                },
                            }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowConfirmPassword((v) => !v)}
                                            edge="end"
                                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                            sx={{ color: '#696969' }}
                                        >
                                            {showConfirmPassword ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{
                            backgroundColor: '#F6A623',
                            color: '#fff',
                            py: 1.5,
                            fontSize: '1rem',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': {
                                backgroundColor: '#e09620',
                            },
                            '&:disabled': {
                                backgroundColor: '#ccc',
                            },
                        }}
                    >
                        {loading ? lang('common.loading') : lang('authentication.resetPassword')}
                    </Button>
                </Box>
            )}

            <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    {lang('authentication.rememberPassword')}{' '}
                    <Link
                        href={loginPath}
                        style={{ fontWeight: 600, color: '#2386FF', textDecoration: 'none' }}
                    >
                        {lang('authentication.backToLogin')}
                    </Link>
                </Typography>
            </Box>
        </Box>
    );
};

export default ResetPasswordForm;
