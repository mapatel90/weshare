"use client";

import Link from 'next/link';
import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Alert,
    Paper
} from '@mui/material';
import { useLanguage } from '@/contexts/LanguageContext';

const ForgotPasswordForm = ({ loginPath = '/login' }) => {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [usernameError, setUsernameError] = useState('');
    const { lang } = useLanguage();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);
        setUsernameError('');

        // Validation
        if (!username.trim()) {
            setUsernameError(lang('validation.usernameRequired'));
            setLoading(false);
            return;
        }

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/api/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: username.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send reset link');
            }

            setSuccess(true);
            setUsername(''); // Clear username field after success
        } catch (err) {
            console.error('Forgot password error:', err);
            setError(err.message || lang('authentication.resetLinkError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ color: '#718096', textAlign: 'center' }}>
                    {lang('authentication.enterUsernameForReset')}
                </Typography>
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
                        ✓ {lang('authentication.resetLinkSent')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#155724', mb: 2 }}>
                        {lang('authentication.resetLinkSentMessage')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#155724', fontSize: '0.875rem' }}>
                        {lang('authentication.checkSpamFolder')}
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
                            {lang('authentication.username')} *
                        </Typography>
                        <TextField
                            fullWidth
                            type="text"
                            placeholder={lang('authentication.enterUsername')}
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                if (usernameError) setUsernameError('');
                                if (error) setError('');
                            }}
                            error={!!usernameError}
                            helperText={usernameError}
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
                        {loading ? lang('common.loading') : lang('authentication.sendResetLink')}
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

export default ForgotPasswordForm;
