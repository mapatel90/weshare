"use client";

import { useAuth } from "@/contexts/AuthContext";
import useLocationData from "@/hooks/useLocationData";
import { apiGet, apiUpload } from "@/lib/api";
import { getFullImageUrl } from "@/utils/common";
import { showErrorToast, showSuccessToast } from "@/utils/topTost";
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
} from '@mui/material';
import { CloudUploadIcon } from "lucide-react";
import { useEffect, useState } from "react";

const MyProfile = () => {
    const { user } = useAuth()
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
        fullName: '',
        email: '',
        phoneNumber: '',
        countryId: '',
        stateId: '',
        cityId: '',
        user_image: ''
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
                        fullName: userData.fullName || '',
                        email: userData.email || '',
                        phoneNumber: userData.phoneNumber || '',
                        countryId: userData.countryId || '',
                        stateId: userData.stateId || '',
                        cityId: userData.cityId || '',
                        user_image: userData.user_image || ''
                    })


                    // Set image preview if user has an image
                    if (userData.user_image) {
                        setImagePreview(userData.user_image)
                    }

                    // Load states if country is selected
                    if (userData.countryId) {
                        await fetchStates(userData.countryId)
                    }

                    // Load cities if state is selected
                    if (userData.stateId) {
                        await fetchCities(userData.stateId)
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
        const countryId = e.target.value
        setProfileData(prev => ({
            ...prev,
            countryId,
            stateId: '',
            cityId: ''
        }))
        if (countryId) {
            handleCountryChange(countryId)
        }
    }

    const handleStateSelect = (e) => {
        const stateId = e.target.value
        setProfileData(prev => ({
            ...prev,
            stateId,
            cityId: ''
        }))
        if (stateId) {
            handleStateChange(stateId)
        }
    }

    const handleCitySelect = (e) => {
        const cityId = e.target.value
        setProfileData(prev => ({
            ...prev,
            cityId
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
            formData.append('fullName', profileData.fullName)
            formData.append('email', profileData.email)
            formData.append('phoneNumber', profileData.phoneNumber || '')
            formData.append('countryId', profileData.countryId || '')
            formData.append('stateId', profileData.stateId || '')
            formData.append('cityId', profileData.cityId || '')

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

    return (
        <Box
            sx={{
                width: '100%',
                minHeight: '80vh',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                px: { xs: 1, sm: 2, md: 4 },
            }}
        >
            <div
                sx={{
                    // width: { xs: '100%', md: 900 },
                    boxShadow: 3,
                    borderRadius: 6,
                    p: { xs: 2, md: 4 },
                    mx: { xs: 0, sm: 2 },
                    background: '#fff',
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
                    {/* Left: Avatar & Info */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                        <Box sx={{ position: 'relative', mb: 2 }}>
                            <Avatar
                                src={getFullImageUrl(imagePreview) || '/images/avatar/default-avatar.png'}
                                alt="Profile"
                                sx={{ width: 120, height: 120, boxShadow: 2, border: '3px solid #e2eafc', background: '#f8fafc' }}
                            />
                            <Button
                                component="label"
                                variant="contained"
                                sx={{
                                    position: 'absolute',
                                    bottom: -10,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    borderRadius: 20,
                                    background: '#fff',
                                    color: '#2563eb',
                                    fontWeight: 500,
                                    px: 2,
                                    py: 0.5,
                                    fontSize: '0.9rem',
                                    boxShadow: 1,
                                    minWidth: 0,
                                    '&:hover': { background: '#e2eafc' },
                                }}
                                size="small"
                            >
                                Change
                                <input
                                    type="file"
                                    id="user_image"
                                    name="user_image"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    hidden
                                />
                            </Button>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mt: 1 }}>{profileData.fullName || 'Your Name'}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{profileData.email || 'you@example.com'}</Typography>
                    </Box>
                    {/* Right: Profile Form */}
                    <Box sx={{ flex: 2, py: 2 }}>
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Full name"
                                        name="fullName"
                                        value={profileData.fullName}
                                        onChange={handleInputChange}
                                        placeholder="Enter full name as you want it displayed."
                                        required
                                        variant="outlined"
                                        sx={{ borderRadius: 3, background: '#f8fafc' }}
                                        InputProps={{ sx: { fontSize: '1rem' } }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Phone number"
                                        name="phoneNumber"
                                        value={profileData.phoneNumber}
                                        onChange={handleInputChange}
                                        placeholder="Enter your phone number"
                                        variant="outlined"
                                        sx={{ borderRadius: 3, background: '#f8fafc' }}
                                        InputProps={{ sx: { fontSize: '1rem' } }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        name="email"
                                        type="email"
                                        value={profileData.email}
                                        onChange={handleInputChange}
                                        placeholder="you@example.com"
                                        required
                                        variant="outlined"
                                        sx={{ borderRadius: 3, background: '#f8fafc' }}
                                        InputProps={{ sx: { fontSize: '1rem' } }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        select
                                        label="Country"
                                        name="countryId"
                                        value={profileData.countryId}
                                        onChange={handleCountrySelect}
                                        disabled={loadingCountries}
                                        variant="outlined"
                                        sx={{ borderRadius: 3, background: '#f8fafc' }}
                                        InputProps={{ sx: { fontSize: '1rem' } }}
                                    >
                                        <MenuItem value="">Choose country</MenuItem>
                                        {countries.map((country) => (
                                            <MenuItem key={country.id} value={country.id}>
                                                {country.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="State / Province"
                                        name="stateId"
                                        value={profileData.stateId}
                                        onChange={handleStateSelect}
                                        disabled={!profileData.countryId || loadingStates}
                                        variant="outlined"
                                        sx={{ borderRadius: 3, background: '#f8fafc' }}
                                        InputProps={{ sx: { fontSize: '1rem' } }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="City"
                                        name="cityId"
                                        value={profileData.cityId}
                                        onChange={handleCitySelect}
                                        disabled={!profileData.stateId || loadingCities}
                                        variant="outlined"
                                        sx={{ borderRadius: 3, background: '#f8fafc' }}
                                        InputProps={{ sx: { fontSize: '1rem' } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        disabled={loading}
                                        sx={{
                                            borderRadius: 3,
                                            px: 4,
                                            py: 1,
                                            fontWeight: 600,
                                            background: 'linear-gradient(90deg, #f6a623 0%, #f6a623 100%)',
                                            color: '#fff',
                                            fontSize: '1rem',
                                            boxShadow: 2,
                                            '&:hover': { background: '#2563eb' },
                                        }}
                                        startIcon={loading && <CircularProgress size={20} />}
                                    >
                                        {loading ? 'Saving...' : 'Save profile'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </Box>
                </Box>
            </div>
        </Box>
    )
};

export default MyProfile;