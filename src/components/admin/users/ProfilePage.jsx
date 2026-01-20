'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '@mui/material/styles';
import {
    Card,
    CardContent,
    CardHeader,
    TextField,
    Button,
    Grid,
    Avatar,
    CircularProgress,
    MenuItem,
    Box,
    Typography
} from '@mui/material'
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material'
import { apiGet, apiUpload } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import useLocationData from '@/hooks/useLocationData'
import { showErrorToast, showSuccessToast } from '@/utils/topTost'
import { useLanguage } from '@/contexts/LanguageContext';
// import { toast } from 'react-toastify'
// -------- DARK MODE HOOK ----------
const useDarkMode = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const checkDarkMode = () => {
            setIsDark(document.documentElement.classList.contains("app-skin-dark"));
        };

        checkDarkMode();

        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, []);

    return isDark;
};
const ProfilePage = () => {
    const { lang } = useLanguage()
    const { user } = useAuth()
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark' || document.documentElement.classList.contains('app-skin-dark');
    const isDark = useDarkMode();

    const {
        countries,
        states,
        cities,
        loadingCountries,
        loadingStates,
        loadingCities,
        handleCountryChange,
        handleStateChange,
        fetchStates,
        fetchCities
    } = useLocationData()

    const [loading, setLoading] = useState(false)
    const [profileData, setProfileData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        country_id: '',
        state_id: '',
        city_id: '',
        user_image: '',
        language: ''
    })
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)

    // Fetch user profile data
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) return

            try {
                setLoading(true)
                const response = await apiGet(`/api/users/${user.id}`)

                if (response.success) {
                    const userData = response.data
                    setProfileData({
                        full_name: userData.full_name || '',
                        email: userData.email || '',
                        phone_number: userData.phone_number || '',
                        country_id: userData.country_id || '',
                        state_id: userData.state_id || '',
                        city_id: userData.city_id || '',
                        user_image: userData.user_image || '',
                        language: userData.language
                    })


                    // Set image preview if user has an image
                    if (userData.user_image) {
                        setImagePreview(userData.user_image)
                    }

                    // Load states if country is selected
                    if (userData.country_id) {
                        await fetchStates(userData.country_id)
                    }

                    // Load cities if state is selected
                    if (userData.state_id) {
                        await fetchCities(userData.state_id)
                    }
                }
            } catch (error) {
                console.error('Error fetching profile:', error)
                // toast.error('Failed to load profile data')
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [user])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleCountrySelect = (e) => {
        const country_id = e.target.value
        setProfileData(prev => ({
            ...prev,
            country_id,
            state_id: '',
            city_id: ''
        }))
        if (country_id) {
            handleCountryChange(country_id)
        }
    }

    const handleStateSelect = (e) => {
        const state_id = e.target.value
        setProfileData(prev => ({
            ...prev,
            state_id,
            city_id: ''
        }))
        if (state_id) {
            handleStateChange(state_id)
        }
    }

    const handleCitySelect = (e) => {
        const city_id = e.target.value
        setProfileData(prev => ({
            ...prev,
            city_id
        }))
    }

    const handleImageChange = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)

            // Create preview
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!user?.id) {
            toast.error('User not found')
            return
        }

        try {
            setLoading(true)

            // Create FormData for file upload
            const formData = new FormData()
            formData.append('full_name', profileData.full_name)
            formData.append('email', profileData.email)
            formData.append('phone_number', profileData.phone_number || '')
            formData.append('country_id', profileData.country_id || '')
            formData.append('state_id', profileData.state_id || '')
            formData.append('city_id', profileData.city_id || '')
            formData.append('language', profileData.language)

            // Add image file if selected
            if (imageFile) {
                formData.append('user_image', imageFile)
            }

            const response = await apiUpload(`/api/users/profile/${user.id}`, formData, { method: 'PUT' })

            if (response.success) {
                showSuccessToast('Profile updated successfully')
                setImageFile(null)

                // Update image preview with new image
                if (response.data.user_image) {
                    setImagePreview(response.data.user_image)
                }
            }
        } catch (error) {
            console.error('Error updating profile:', error)
            const msg = error?.message || (error?.data && error.data.message) || 'Error updating password'
            showErrorToast(msg)
            // toast.error(error.message || 'Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    if (loading && !profileData.email) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
                <CircularProgress />
                <Typography variant="body1" sx={{ mt: 2 }}>Loading profile...</Typography>
            </Box>
        )
    }

    // Dark mode colors
    const colors = {
        bg: isDark ? "#0f172a" : "#f9fafb",
        cardBg: isDark ? "#121a2d" : "#fff",
        text: isDark ? "#ffffff" : "#111827",
        textMuted: isDark ? "#b1b4c0" : "#6b7280",
        border: isDark ? "#1b2436" : "#e5e7eb",
        borderLight: isDark ? "#1b2436" : "#f3f4f6",
        gradientBg: isDark
            ? "linear-gradient(to bottom right, #1a1f2e, #0f172a, #1a1628)"
            : "linear-gradient(to bottom right, #eff6ff, #ffffff, #faf5ff)",
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Card
                sx={{
                    backgroundColor: isDarkMode ? 'rgba(18,27,46,0.95)' : '#fff',
                    color: isDarkMode ? '#fff' : 'inherit',
                    boxShadow: isDarkMode ? '0 0 20px rgba(14,32,56,0.3)' : undefined
                }}
            >
                <CardHeader
                    title="Edit Profile"
                    sx={{
                        backgroundColor: isDarkMode ? 'rgba(18,27,46,0.95)' : '#f8f9fa',
                        borderBottom: isDarkMode ? '1px solid #232a3b' : '1px solid #dee2e6',
                        color: isDarkMode ? '#fff' : 'inherit'
                    }}
                />
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={6}>
                            {/* Profile Image Upload */}
                            <Grid item xs={12}>
                                <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
                                    <Avatar
                                        src={imagePreview || '/images/avatar/default-avatar.png'}
                                        alt="Profile"
                                        sx={{
                                            width: 150,
                                            height: 150,
                                            mb: 2,
                                            border: isDarkMode ? '3px solid #232a3b' : '3px solid #dee2e6',
                                            backgroundColor: isDarkMode ? '#232a3b' : undefined
                                        }}
                                    />
                                    <Button
                                        component="label"
                                        variant="contained"
                                        startIcon={<CloudUploadIcon />}
                                        size="small"
                                    >
                                        Choose Profile Picture
                                        <input
                                            type="file"
                                            id="user_image"
                                            name="user_image"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            hidden
                                        />
                                    </Button>
                                    <Typography variant="caption" color={isDarkMode ? '#b1b4c0' : 'text.secondary'} sx={{ mt: 1 }}>
                                        Allowed JPG, PNG or JPEG. Max size of 2MB
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                        <Grid container spacing={2}>
                            {/* Full Name */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Full Name"
                                    name="full_name"
                                    value={profileData.full_name}
                                    onChange={handleInputChange}
                                    placeholder="Enter full name"
                                    required
                                    variant="outlined"
                                    InputLabelProps={{ style: { color: isDarkMode ? '#fff' : undefined } }}
                                    InputProps={{ style: { color: isDarkMode ? '#fff' : undefined } }}
                                />
                            </Grid>
                            {/* Email */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={profileData.email}
                                    onChange={handleInputChange}
                                    placeholder="Enter email"
                                    required
                                    variant="outlined"
                                    InputLabelProps={{ style: { color: isDarkMode ? '#fff' : undefined } }}
                                    InputProps={{ style: { color: isDarkMode ? '#fff' : undefined } }}
                                />
                            </Grid>
                            {/* Phone Number */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Phone Number"
                                    name="phone_number"
                                    value={profileData.phone_number}
                                    onChange={handleInputChange}
                                    placeholder="Enter phone number"
                                    variant="outlined"
                                    InputLabelProps={{ style: { color: isDarkMode ? '#fff' : undefined } }}
                                    InputProps={{ style: { color: isDarkMode ? '#fff' : undefined } }}
                                />
                            </Grid>
                            {/* Country */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Country"
                                    name="country_id"
                                    value={profileData.country_id}
                                    onChange={handleCountrySelect}
                                    disabled={loadingCountries}
                                    variant="outlined"
                                    InputLabelProps={{ style: { color: isDarkMode ? '#fff' : undefined } }}
                                    InputProps={{ style: { color: isDarkMode ? '#fff' : undefined } }}
                                >
                                    <MenuItem value="">Select Country</MenuItem>
                                    {countries.map((country) => (
                                        <MenuItem key={country.id} value={country.id}>
                                            {country.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            {/* State */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    select
                                    label="State"
                                    name="state_id"
                                    value={profileData.state_id}
                                    onChange={handleStateSelect}
                                    disabled={!profileData.country_id || loadingStates}
                                    variant="outlined"
                                    InputLabelProps={{ style: { color: isDarkMode ? '#fff' : undefined } }}
                                    InputProps={{ style: { color: isDarkMode ? '#fff' : undefined } }}
                                >
                                    <MenuItem value="">Select State</MenuItem>
                                    {states.map((state) => (
                                        <MenuItem key={state.id} value={state.id}>
                                            {state.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            {/* City */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    select
                                    label="City"
                                    name="city_id"
                                    value={profileData.city_id}
                                    onChange={handleCitySelect}
                                    disabled={!profileData.state_id || loadingCities}
                                    variant="outlined"
                                    InputLabelProps={{ style: { color: isDarkMode ? '#fff' : undefined } }}
                                    InputProps={{ style: { color: isDarkMode ? '#fff' : undefined } }}
                                >
                                    <MenuItem value="">Select City</MenuItem>
                                    {cities.map((city) => (
                                        <MenuItem key={city.id} value={city.id}>
                                            {city.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            {/* Language */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    select
                                    label={lang('common.language')}
                                    name="language"
                                    value={profileData.language}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    InputLabelProps={{ style: { color: isDarkMode ? '#fff' : undefined } }}
                                    InputProps={{ style: { color: isDarkMode ? '#fff' : undefined } }}
                                >
                                    <MenuItem value="en">{lang('common.en')}</MenuItem>
                                    <MenuItem value="vi">{lang('common.vi')}</MenuItem>
                                </TextField>
                            </Grid>

                            {/* Submit Buttons */}
                            <Grid item xs={12}>
                                <Box display="flex" justifyContent="flex-end" gap={2}>
                                    <Button
                                        variant="outlined"
                                        color="secondary"
                                        onClick={() => window.history.back()}
                                        sx={{ color: isDarkMode ? '#fff' : undefined, borderColor: isDarkMode ? '#fff' : undefined }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        disabled={loading}
                                        startIcon={loading && <CircularProgress size={20} />}
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>
        </Box>
    )
}

export default ProfilePage