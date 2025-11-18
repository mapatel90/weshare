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
            <Box sx={{ width: '100%' }}>
                <Card>
                    <CardHeader
                        title="My Profile"
                        sx={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}
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
                                                border: '3px solid #dee2e6'
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
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
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
                                        name="fullName"
                                        value={profileData.fullName}
                                        onChange={handleInputChange}
                                        placeholder="Enter full name"
                                        required
                                        variant="outlined"
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
                                    />
                                </Grid>
    
                                {/* Phone Number */}
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Phone Number"
                                        name="phoneNumber"
                                        value={profileData.phoneNumber}
                                        onChange={handleInputChange}
                                        placeholder="Enter phone number"
                                        variant="outlined"
                                    />
                                </Grid>
    
                                {/* Country */}
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
                                        name="stateId"
                                        value={profileData.stateId}
                                        onChange={handleStateSelect}
                                        disabled={!profileData.countryId || loadingStates}
                                        variant="outlined"
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
                                        name="cityId"
                                        value={profileData.cityId}
                                        onChange={handleCitySelect}
                                        disabled={!profileData.stateId || loadingCities}
                                        variant="outlined"
                                    >
                                        <MenuItem value="">Select City</MenuItem>
                                        {cities.map((city) => (
                                            <MenuItem key={city.id} value={city.id}>
                                                {city.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
    
                                {/* Submit Buttons */}
                                <Grid item xs={12}>
                                    <Box display="flex" justifyContent="flex-end" gap={2}>
                                        <Button
                                            variant="outlined"
                                            color="secondary"
                                            onClick={() => window.history.back()}
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
};

export default MyProfile;