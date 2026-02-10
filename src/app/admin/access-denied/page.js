'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Divider,
} from '@mui/material';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const AccessDeniedPage = () => {
  const router = useRouter();

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={2}
    >
      <Card sx={{ maxWidth: 620, width: '100%' }}>
        <CardContent sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
          {/* Icon */}
          <Box
            sx={{
              width: 100,
              height: 100,
              mx: 'auto',
              mb: 3,
              borderRadius: '50%',
              bgcolor: 'error.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldOutlinedIcon sx={{ fontSize: 48, color: 'error.main' }} />
          </Box>

          {/* 403 */}
          <Typography
            variant="h1"
            fontWeight={800}
            color="error.main"
            mb={1}
          >
            403
          </Typography>

          <Typography variant="h5" fontWeight={700} mb={1}>
            Access Denied
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            mb={4}
            px={{ xs: 0, sm: 4 }}
          >
            Sorry, you don't have permission to access this page.
            Please contact your administrator if you believe this is an error.
          </Typography>

          {/* Actions */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.back()}
            >
              Go Back
            </Button>

            <Button
              component={Link}
              href="/admin/dashboards"
              variant="contained"
              startIcon={<HomeIcon />}
            >
              Go to Dashboard
            </Button>
          </Stack>

          <Divider sx={{ my: 4 }} />

          {/* Footer info */}
          <Box color="text.secondary" fontSize={12}>
            <Typography
              variant="caption"
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={0.5}
              mb={0.5}
            >
              <InfoOutlinedIcon fontSize="inherit" />
              Error Code: 403 - Forbidden
            </Typography>

            <Typography variant="caption">
              You don't have the required permissions to view this resource.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AccessDeniedPage;
