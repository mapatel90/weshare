"use client";

import { useAuth } from "@/contexts/AuthContext";
import useLocationData from "@/hooks/useLocationData";
import { apiGet, apiUpload } from "@/lib/api";
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

                    console.log("userData", userData)
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
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2eafc 100%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                px: { xs: 1, sm: 2, md: 4 },
            }}
        >
            <Card
                sx={{
                    width: { xs: '100%', sm: 400, md: 500, lg: 600 },
                    boxShadow: 6,
                    borderRadius: 5,
                    p: { xs: 1, sm: 2, md: 3 },
                    mx: { xs: 0, sm: 2 },
                }}
            >
                <CardHeader
                    title={
                        <Typography
                            variant="h5"
                            sx={{ fontWeight: 700, color: '#2d3748', fontSize: { xs: '1.2rem', sm: '1.5rem' } }}
                        >
                            My Profile
                        </Typography>
                    }
                    sx={{ backgroundColor: '#e2eafc', borderRadius: 3, mb: 2, textAlign: 'center', px: { xs: 1, sm: 2 } }}
                />
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                            <Avatar
                                src={imagePreview || '/images/avatar/default-avatar.png'}
                                alt="Profile"
                                sx={{
                                    width: { xs: 80, sm: 100, md: 120 },
                                    height: { xs: 80, sm: 100, md: 120 },
                                    mb: 2,
                                    boxShadow: 3,
                                    border: '4px solid #e2eafc',
                                }}
                            />
                            <Button
                                component="label"
                                variant="contained"
                                startIcon={<CloudUploadIcon />}
                                sx={{
                                    borderRadius: 3,
                                    background: '#4f8cff',
                                    color: '#fff',
                                    fontWeight: 600,
                                    px: 3,
                                    py: 1,
                                    mt: 1,
                                    fontSize: { xs: '0.8rem', sm: '1rem' },
                                    '&:hover': { background: '#2563eb' },
                                }}
                                size="medium"
                            >
                                Change Picture
                                <input
                                    type="file"
                                    id="user_image"
                                    name="user_image"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    hidden
                                />
                            </Button>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, fontSize: { xs: '0.7rem', sm: '0.9rem' } }}>
                                JPG, PNG, JPEG. Max 2MB
                            </Typography>
                        </Box>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Full Name"
                                    name="fullName"
                                    value={profileData.fullName}
                                    onChange={handleInputChange}
                                    placeholder="Enter your full name"
                                    required
                                    variant="outlined"
                                    sx={{ borderRadius: 3, background: '#f8fafc' }}
                                    InputProps={{ sx: { fontSize: { xs: '0.9rem', sm: '1rem' } } }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={profileData.email}
                                    onChange={handleInputChange}
                                    placeholder="Enter your email"
                                    required
                                    variant="outlined"
                                    sx={{ borderRadius: 3, background: '#f8fafc' }}
                                    InputProps={{ sx: { fontSize: { xs: '0.9rem', sm: '1rem' } } }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Phone Number"
                                    name="phoneNumber"
                                    value={profileData.phoneNumber}
                                    onChange={handleInputChange}
                                    placeholder="Enter your phone number"
                                    variant="outlined"
                                    sx={{ borderRadius: 3, background: '#f8fafc' }}
                                    InputProps={{ sx: { fontSize: { xs: '0.9rem', sm: '1rem' } } }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
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
                                    InputProps={{ sx: { fontSize: { xs: '0.9rem', sm: '1rem' } } }}
                                >
                                    <MenuItem value="">Select Country</MenuItem>
                                    {countries.map((country) => (
                                        <MenuItem key={country.id} value={country.id}>
                                            {country.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    select
                                    label="State"
                                    name="stateId"
                                    value={profileData.stateId}
                                    onChange={handleStateSelect}
                                    disabled={!profileData.countryId || loadingStates}
                                    variant="outlined"
                                    sx={{ borderRadius: 3, background: '#f8fafc' }}
                                    InputProps={{ sx: { fontSize: { xs: '0.9rem', sm: '1rem' } } }}
                                >
                                    <MenuItem value="">Select State</MenuItem>
                                    {states.map((state) => (
                                        <MenuItem key={state.id} value={state.id}>
                                            {state.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    select
                                    label="City"
                                    name="cityId"
                                    value={profileData.cityId}
                                    onChange={handleCitySelect}
                                    disabled={!profileData.stateId || loadingCities}
                                    variant="outlined"
                                    sx={{ borderRadius: 3, background: '#f8fafc' }}
                                    InputProps={{ sx: { fontSize: { xs: '0.9rem', sm: '1rem' } } }}
                                >
                                    <MenuItem value="">Select City</MenuItem>
                                    {cities.map((city) => (
                                        <MenuItem key={city.id} value={city.id}>
                                            {city.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <Box display="flex" justifyContent="center" gap={2} mt={2}>
                                    <Button
                                        variant="outlined"
                                        color="secondary"
                                        sx={{
                                            borderRadius: 3,
                                            px: { xs: 2, sm: 4 },
                                            py: 1,
                                            fontWeight: 600,
                                            background: '#f8fafc',
                                            color: '#4f8cff',
                                            borderColor: '#4f8cff',
                                            fontSize: { xs: '0.8rem', sm: '1rem' },
                                            '&:hover': { background: '#e2eafc' },
                                        }}
                                        onClick={() => window.location.href = '/offtaker/dashboard'}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        disabled={loading}
                                        sx={{
                                            borderRadius: 3,
                                            px: { xs: 2, sm: 4 },
                                            py: 1,
                                            fontWeight: 600,
                                            background: '#4f8cff',
                                            fontSize: { xs: '0.8rem', sm: '1rem' },
                                            '&:hover': { background: '#2563eb' },
                                        }}
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
};

export default MyProfile;