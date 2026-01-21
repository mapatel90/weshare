"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ResetPasswordForm from '@/components/authentication/ResetPasswordForm';
import { CircularProgress, Box, Card, CardContent, Typography } from '@mui/material';
import { usePageTitle } from '@/contexts/PageTitleContext';

const ResetPasswordContent = () => {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    usePageTitle('page_title.resetPassword');

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
                <Box
                    component="img"
                    src="/images/main_logo.png"
                    alt="WeShare"
                    sx={{
                        maxWidth: 200,
                        mb: 2,
                    }}
                />
                <Typography variant="h5" fontWeight={600}>
                    Create New Password
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
                    <ResetPasswordForm token={token} loginPath="/login" />
                </CardContent>
            </Card>
        </Box>
    );
};

const ResetPasswordPage = () => {
    return (
        <Suspense fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress sx={{ color: '#F6A623' }} />
            </Box>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
};

export default ResetPasswordPage;
