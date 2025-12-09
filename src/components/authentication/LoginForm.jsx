"use client";

import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import {
    Box,
    TextField,
    Button,
    Typography,
    Alert,
    IconButton,
    InputAdornment,
    Checkbox,
    FormControlLabel
} from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { usePathname } from 'next/navigation';

const LoginForm = ({ registerPath, resetPath }) => {
    const pathname = usePathname();

    // 🔥 Create dynamic key → remember_admin / remember_offtaker / remember_investor
    const storageKey = `remember_${pathname.split('/')[1]}`;

    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [usernameError, setUsernameError] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const { login } = useAuth()
    const { lang } = useLanguage()

    // ⭐ Load saved Remember Me credentials
    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            const data = JSON.parse(saved);
            setUsername(data.username || "");
            setPassword(data.password || "");

            // Auto-check checkbox if value exists
            const checkbox = document.getElementById("rememberMe");
            if (checkbox) checkbox.checked = true;
        }
    }, [storageKey]);

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setUsernameError('')
        setPasswordError('')

        // Validation
        let isValid = true

        if (!username.trim()) {
            setUsernameError(lang('validation.usernameRequired'))
            isValid = false
        }

        if (!password.trim()) {
            setPasswordError(lang('validation.passwordRequired'))
            isValid = false
        } else if (password.length < 6) {
            setPasswordError(lang('validation.passwordMinLength'))
            isValid = false
        }

        // Role check based on pathname
        let expectedRole = null;
        if (pathname === '/admin/login') expectedRole = 1;
        else if (pathname === '/offtaker/login') expectedRole = 3;
        else if (pathname === '/investor/login') expectedRole = 4;

        if (!isValid) {
            setLoading(false)
            return
        }

        // 🔥 Handle Remember Me before login API
        const remember = document.getElementById("rememberMe").checked;

        if (remember) {
            localStorage.setItem(storageKey, JSON.stringify({ username, password }));
        } else {
            localStorage.removeItem(storageKey);
        }

        const result = await login(username, password)

        if (result.success) {
            if (expectedRole && result.user?.role !== expectedRole) {
                setError('You do not have permission to access this area.');
                setLoading(false);
                return;
            } else {
                // Redirect based on role
                if (result.user?.role === 3) {
                    window.location.href = '/offtaker/dashboard';
                } else if (result.user?.role === 4) {
                    window.location.href = '/investor/dashboard';
                } else {
                    window.location.href = '/admin/dashboards';
                }
            }
        } else {
            setError(result.message)
        }

        setLoading(false)
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Link href="/login" style={{ textDecoration: 'none', color: '#6c757d', fontSize: '0.9375rem' }}>
                    <span style={{ marginRight: '0.25rem' }}>&#8592;</span> {lang('common.back')}
                </Link>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 2 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ mb: 1, color: '#696969', fontWeight: 500 }}>
                        {lang('authentication.username') || 'Username'} *
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder={lang('authentication.username')}
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value)
                            if (usernameError) setUsernameError('')
                        }}
                        error={!!usernameError}
                        helperText={usernameError}
                        required
                        variant="outlined"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: '#fff',
                                borderRadius: '8px',
                                '& fieldset': { borderColor: '#e0e0e0' },
                                '&:hover fieldset': { borderColor: '#F6A623' },
                                '&.Mui-focused fieldset': { borderColor: '#F6A623', borderWidth: '2px' },
                            },
                        }}
                    />
                </Box>

                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ mb: 1, color: '#696969', fontWeight: 500 }}>
                        {lang('authentication.password') || 'Password'} *
                    </Typography>
                    <TextField
                        fullWidth
                        type={showPassword ? 'text' : 'password'}
                        placeholder={lang('authentication.password')}
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value)
                            if (passwordError) setPasswordError('')
                        }}
                        error={!!passwordError}
                        helperText={passwordError}
                        required
                        variant="outlined"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: '#fff',
                                borderRadius: '8px',
                                '& fieldset': { borderColor: '#e0e0e0' },
                                '&:hover fieldset': { borderColor: '#F6A623' },
                                '&.Mui-focused fieldset': { borderColor: '#F6A623', borderWidth: '2px' },
                            },
                        }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword((v) => !v)}
                                        edge="end"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        sx={{ color: '#696969' }}
                                    >
                                        {showPassword ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                    <FormControlLabel
                        control={<Checkbox id="rememberMe" />}
                        label={lang('authentication.rememberMe')}
                    />
                    <Link
                        href={resetPath}
                        style={{ fontSize: '0.75rem', color: '#2386FF', textDecoration: 'none' }}
                    >
                        {lang('authentication.forgotPassword')}?
                    </Link>
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
                        '&:hover': { backgroundColor: '#e09620' },
                    }}
                >
                    {loading ? lang('common.loading') : lang('authentication.login')}
                </Button>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    Don't have an account?{' '}
                    <Link
                        href={registerPath}
                        style={{ fontWeight: 600, color: '#0d6efd', textDecoration: 'none' }}
                    >
                        {lang('authentication.signUp') || 'Sign up'}
                    </Link>
                </Typography>
            </Box>
        </Box>
    )
}

export default LoginForm
