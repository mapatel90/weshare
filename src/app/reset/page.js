"use client";

import React from 'react';
import { Box, Card, CardContent, Typography, Link } from '@mui/material';
import ForgotPasswordForm from '@/components/authentication/ForgotPasswordForm';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePageTitle } from '@/contexts/PageTitleContext';

const ResetPage = () => {
    const { lang } = useLanguage();
    usePageTitle('page_title.forgotPassword');

    return (
        <Box
            className="loginSection"
            sx={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                p: 2,
            }}
        >
            {/* Logo + Title */}
            <Box sx={{ textAlign: "center", mb: 4 }}>
                <Link href="/" style={{ display: 'inline-block', textDecoration: 'none' }}>
                <Box
                    component="img"
                    src="/images/main_logo.png"
                    alt="WeShare"
                    sx={{
                        maxWidth: 200,
                        mb: 2,
                    }}
                />
                </Link>
                <Typography variant="h5" fontWeight={600}>
                    {lang('authentication.resetYourPassword')}
                </Typography>
            </Box>

            {/* Card */}
            <Card
                elevation={6}
                sx={{
                    maxWidth: 560,
                    width: "100%",
                    borderRadius: 3,
                    backgroundColor: "rgba(255,255,255,0.95)",
                    p: { xs: 2, sm: 4 },
                }}
            >
                <CardContent>
                    <ForgotPasswordForm loginPath="/login" />
                </CardContent>
            </Card>
        </Box>
    );
};

export default ResetPage;