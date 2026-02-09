"use client";

import { ROLES } from "@/constants/roles";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, LANGUAGES } from "@/contexts/LanguageContext";
import useLocationData from "@/hooks/useLocationData";
import { apiGet, apiUpload } from "@/lib/api";
import { buildUploadUrl, getFullImageUrl } from "@/utils/common";
import { showErrorToast, showSuccessToast } from "@/utils/topTost";
import {
    Card,
    CardContent,
    TextField,
    Button,
    Grid,
    Avatar,
    CircularProgress,
    MenuItem,
    Box,
    Typography,
    IconButton,
    Tooltip,
    Alert
} from '@mui/material';
import { CloudUploadIcon, X as XIcon } from "lucide-react";
import { useEffect, useState } from "react";

const MyProfile = () => {
    const { user, updateUser } = useAuth()
    const { currentLanguage, changeLanguage, lang } = useLanguage()
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
        address_1: '',
        address_2: '',
        countryId: '',
        stateId: '',
        cityId: '',
        zipcode: '',
        user_image: '',
        language: currentLanguage || 'en'
    })
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [imageError, setImageError] = useState('')
    const [uploadingImage, setUploadingImage] = useState(false)

    // Fetch user profile data
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) return

            try {
                setLoading(true)
                const response = await apiGet(`/api/users/${user.id}`)
                console.log("response", response);

                if (response.success) {
                    const userData = response.data
                    setProfileData({
                        fullName: userData.full_name || '',
                        email: userData.email || '',
                        phoneNumber: userData.phone_number || '',
                        address_1: userData.address_1 || '',
                        address_2: userData.address_2 || '',
                        countryId: userData.country_id || '',
                        stateId: userData.state_id || '',
                        cityId: userData.city_id || '',
                        zipcode: userData.zipcode || '',
                        user_image: userData.user_image || '',
                        language: userData.language || currentLanguage || 'en'
                    })


                    // Set image preview if user has an image
                    if (userData.user_image) {
                        setImagePreview(buildUploadUrl(userData.user_image))
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

    const handleRemoveImage = () => {
        setImageFile(null)
        setImagePreview(profileData.user_image || null) // Reset to original image
        setImageError('')
        // Reset file input
        const fileInput = document.getElementById('user_image')
        if (fileInput) fileInput.value = ''
    }

    const handleImageChange = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            // Reset error
            setImageError('')

            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
            if (!validTypes.includes(file.type)) {
                setImageError('Please upload a valid image file (JPG, PNG, GIF, WEBP)')
                e.target.value = '' // Reset input
                return
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024 // 5MB in bytes
            if (file.size > maxSize) {
                setImageError('File size must be less than 5MB')
                e.target.value = '' // Reset input
                return
            }

            setImageFile(file)

            // Create preview
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result)
            }
            reader.onerror = () => {
                setImageError('Failed to read file')
            }
            reader.readAsDataURL(file)
        }
    }

    const handleCancel = () => {
        if (user?.role === ROLES.INVESTOR) {
            window.location.href = '/investor/dashboard';
        } else {
            window.location.href = '/offtaker/dashboard';
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!user?.id) {
            showErrorToast('User not found')
            return
        }

        // Check if there's an image error
        if (imageError) {
            showErrorToast('Please fix image errors before submitting')
            return
        }

        try {
            setLoading(true)
            if (imageFile) {
                setUploadingImage(true)
            }

            // Create FormData for file upload
            const formData = new FormData()
            console.log("profileData", profileData);
            formData.append('full_name', profileData.fullName)
            formData.append('email', profileData.email)
            formData.append('phone_number', profileData.phoneNumber || '')
            formData.append('address_1', profileData.address_1 || '')
            formData.append('address_2', profileData.address_2 || '')
            formData.append('country_id', profileData.countryId || '')
            formData.append('state_id', profileData.stateId || '')
            formData.append('city_id', profileData.cityId || '')
            formData.append('zipcode', profileData.zipcode || '')
            formData.append('language', profileData.language || 'en')

            // Add image file if selected
            if (imageFile) {
                formData.append('user_image', imageFile)
            }

            const response = await apiUpload(`/api/users/profile/${user.id}`, formData, { method: 'PUT' })

            if (response.success) {
                showSuccessToast(imageFile ? 'Profile and image updated successfully' : 'Profile updated successfully')
                setImageFile(null)
                setImageError('')

                // Update language context if language was changed
                if (profileData.language && profileData.language !== currentLanguage) {
                    changeLanguage(profileData.language)
                }

                // Update profile data with response
                if (response.data) {
                    setProfileData(prev => ({
                        ...prev,
                        user_image: response.data.user_image || prev.user_image,
                        language: response.data.language || prev.language
                    }))

                    // Update image preview with new image
                    if (response.data.user_image) {
                        setImagePreview(buildUploadUrl(response.data.user_image))

                        // Update user avatar in AuthContext to reflect in header
                        if (updateUser) {
                            updateUser({ avatar: response.data.user_image })
                        }
                    }

                    // Update user name if changed
                    if (response.data.full_name && response.data.full_name !== user?.name) {
                        if (updateUser) {
                            updateUser({ name: response.data.full_name })
                        }
                    }
                }

                // Reset file input
                const fileInput = document.getElementById('user_image')
                if (fileInput) fileInput.value = ''
            }
        } catch (error) {
            console.error('Error updating profile:', error)
            const msg = error?.message || (error?.data && error.data.message) || 'Error updating profile'
            showErrorToast(msg)
        } finally {
            setLoading(false)
            setUploadingImage(false)
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
                py: { xs: 3, md: 5 },
                px: { xs: 2, sm: 3, md: 4 },
            }}
        >
            <Box
                sx={{
                    maxWidth: 1000,
                    mx: 'auto',
                }}
            >
                {/* Main Profile Card */}
                <Card
                    sx={{
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        borderRadius: 4,
                        overflow: 'visible',
                        background: '#fff',
                    }}
                >
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                        <form onSubmit={handleSubmit}>
                            {/* Profile Image Section */}
                            <Box sx={{ mb: 4, textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#334155', textAlign: 'left' }}>
                                    {lang('profile.profile_picture', 'Profile Picture')}
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 3, p: 3, background: '#f8fafc', borderRadius: 3 }}>
                                    <Box sx={{ position: 'relative' }}>
                                        <Avatar
                                            src={imagePreview || '/images/avatar/default-avatar.png'}
                                            alt="Profile"
                                            sx={{
                                                width: 100,
                                                height: 100,
                                                boxShadow: 3,
                                                border: '4px solid #fff',
                                                opacity: uploadingImage ? 0.6 : 1,
                                                transition: 'opacity 0.3s'
                                            }}
                                        />
                                        {uploadingImage && (
                                            <CircularProgress
                                                size={30}
                                                sx={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 1, color: '#1e293b' }}>
                                            {profileData.fullName || 'Your Name'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {profileData.email || 'you@example.com'}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' }, flexWrap: 'wrap' }}>
                                            <Button
                                                component="label"
                                                variant="contained"
                                                disabled={uploadingImage}
                                                sx={{
                                                    borderRadius: 2,
                                                    background: 'linear-gradient(90deg, #f6a623 0%, #f6a623 100%)',
                                                    color: '#fff',
                                                    fontWeight: 600,
                                                    px: 3,
                                                    py: 1,
                                                    textTransform: 'none',
                                                    boxShadow: 2,
                                                    '&:hover': { background: 'linear-gradient(90deg, #e89512 0%, #e89512 100%)' },
                                                }}
                                                size="small"
                                            >
                                                {imageFile ? lang('common.change_photo', 'Change Photo') : lang('common.upload_photo', 'Upload Photo')}
                                                <input
                                                    type="file"
                                                    id="user_image"
                                                    name="user_image"
                                                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                                    onChange={handleImageChange}
                                                    hidden
                                                />
                                            </Button>
                                            {imageFile && (
                                                <Button
                                                    variant="outlined"
                                                    onClick={handleRemoveImage}
                                                    size="small"
                                                    sx={{
                                                        borderRadius: 2,
                                                        borderColor: '#ef4444',
                                                        color: '#ef4444',
                                                        fontWeight: 600,
                                                        px: 3,
                                                        py: 1,
                                                        textTransform: 'none',
                                                        '&:hover': { background: '#fef2f2', borderColor: '#dc2626' },
                                                    }}
                                                >
                                                    {lang('common.remove', 'Remove')}
                                                </Button>
                                            )}
                                        </Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                            {lang('profile.profile_image_format', 'JPG, PNG, GIF or WEBP. Max size 5MB')}
                                        </Typography>
                                    </Box>
                                </Box>
                                {imageError && (
                                    <Alert severity="error" sx={{ mt: 2 }}>
                                        {imageError}
                                    </Alert>
                                )}
                                {imageFile && !imageError && (
                                    <Alert severity="info" sx={{ mt: 2 }}>
                                        {lang('profile.new_image_selected', 'New image selected. Click "Save Changes" below to upload.')}
                                    </Alert>
                                )}
                            </Box>

                            {/* Personal Information Section */}
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#334155' }}>
                                    {lang('profile.personal_information', 'Personal Information')}
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label={lang('usersView.fullName', 'Full Name')}
                                            name="fullName"
                                            value={profileData.fullName}
                                            onChange={handleInputChange}
                                            placeholder={lang('placeholders.enterfullname', 'Enter your full name')}
                                            required
                                            variant="outlined"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2,
                                                    '&:hover fieldset': { borderColor: '#f6a623' },
                                                    '&.Mui-focused fieldset': { borderColor: '#f6a623' }
                                                }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label={lang('usersView.email_address', 'Email Address')}
                                            name="email"
                                            type="email"
                                            value={profileData.email}
                                            onChange={handleInputChange}
                                            placeholder="you@example.com"
                                            required
                                            variant="outlined"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2,
                                                    '&:hover fieldset': { borderColor: '#f6a623' },
                                                    '&.Mui-focused fieldset': { borderColor: '#f6a623' }
                                                }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label={lang('usersView.phonenumber', 'Phone Number')}
                                            name="phoneNumber"
                                            value={profileData.phoneNumber}
                                            onChange={handleInputChange}
                                            placeholder={lang('placeholders.enterphonenumber', 'Enter your phone number')}
                                            variant="outlined"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2,
                                                    '&:hover fieldset': { borderColor: '#f6a623' },
                                                    '&.Mui-focused fieldset': { borderColor: '#f6a623' }
                                                }
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Address Information Section */}
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#334155' }}>
                                    {lang('profile.address_information', 'Address Information')}
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label={lang('profile.address_line_1', 'Address Line 1')}
                                            name="address_1"
                                            value={profileData.address_1}
                                            onChange={handleInputChange}
                                            placeholder={lang('profile.address_line_1_placeholder', 'Street address, P.O. box')}
                                            variant="outlined"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2,
                                                    '&:hover fieldset': { borderColor: '#f6a623' },
                                                    '&.Mui-focused fieldset': { borderColor: '#f6a623' }
                                                }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label={lang('profile.address_line_2', 'Address Line 2')}
                                            name="address_2"
                                            value={profileData.address_2}
                                            onChange={handleInputChange}
                                            placeholder={lang('profile.address_line_2_placeholder', 'Apartment, suite, unit, building, floor, etc.')}
                                            variant="outlined"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2,
                                                    '&:hover fieldset': { borderColor: '#f6a623' },
                                                    '&.Mui-focused fieldset': { borderColor: '#f6a623' }
                                                }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            select
                                            label={lang('profile.country', 'Country')}
                                            name="countryId"
                                            value={profileData.countryId}
                                            onChange={handleCountrySelect}
                                            disabled={loadingCountries}
                                            variant="outlined"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2,
                                                    '&:hover fieldset': { borderColor: '#f6a623' },
                                                    '&.Mui-focused fieldset': { borderColor: '#f6a623' }
                                                }
                                            }}
                                        >
                                            <MenuItem value="">{lang('profile.country_placeholder', 'Select Country')}</MenuItem>
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
                                            select
                                            label={lang('profile.state', 'State / Province')}
                                            name="stateId"
                                            value={profileData.stateId}
                                            onChange={handleStateSelect}
                                            disabled={!profileData.countryId || loadingStates}
                                            variant="outlined"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2,
                                                    '&:hover fieldset': { borderColor: '#f6a623' },
                                                    '&.Mui-focused fieldset': { borderColor: '#f6a623' }
                                                }
                                            }}
                                        >
                                            <MenuItem value="">{lang('profile.state_placeholder', 'Select State')}</MenuItem>
                                            {states.map((state) => (
                                                <MenuItem key={state.id} value={state.id}>
                                                    {state.name}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            select
                                            label={lang('common.city', 'City')}
                                            name="cityId"
                                            value={profileData.cityId}
                                            onChange={handleCitySelect}
                                            disabled={!profileData.stateId || loadingCities}
                                            variant="outlined"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2,
                                                    '&:hover fieldset': { borderColor: '#f6a623' },
                                                    '&.Mui-focused fieldset': { borderColor: '#f6a623' }
                                                }
                                            }}
                                        >
                                            <MenuItem value="">{lang('profile.city_placeholder', 'Select City')}</MenuItem>
                                            {cities.map((city) => (
                                                <MenuItem key={city.id} value={city.id}>
                                                    {city.name}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label={lang('common.zip', 'Zip / Postal Code')}
                                            name="zipcode"
                                            value={profileData.zipcode}
                                            onChange={handleInputChange}
                                            placeholder={lang('profile.zipcode_placeholder', 'Enter zip/postal code')}
                                            variant="outlined"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2,
                                                    '&:hover fieldset': { borderColor: '#f6a623' },
                                                    '&.Mui-focused fieldset': { borderColor: '#f6a623' }
                                                }
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Preferences Section */}
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#334155' }}>
                                    {lang('profile.preferences', 'Preferences')}
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            select
                                            label={lang('profile.language', 'Language')}
                                            name="language"
                                            value={profileData.language}
                                            onChange={handleInputChange}
                                            variant="outlined"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2,
                                                    '&:hover fieldset': { borderColor: '#f6a623' },
                                                    '&.Mui-focused fieldset': { borderColor: '#f6a623' }
                                                }
                                            }}
                                        >
                                            {Object.values(LANGUAGES).map((language) => (
                                                <MenuItem key={language.code} value={language.code}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <img
                                                            src={language.flag}
                                                            alt={language.name}
                                                            style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                                        />
                                                        <span>{language.name}</span>
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Action Buttons */}
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, borderTop: '1px solid #e5e7eb' }}>
                                <Button
                                    type="button"
                                    variant="outlined"
                                    disabled={loading}
                                    onClick={handleCancel}
                                    sx={{
                                        borderRadius: 2,
                                        px: 4,
                                        py: 1.2,
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        borderColor: '#d1d5db',
                                        color: '#6b7280',
                                        '&:hover': {
                                            borderColor: '#9ca3af',
                                            background: '#f9fafb'
                                        },
                                    }}
                                >
                                    {lang('common.cancel', 'Cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={loading}
                                    sx={{
                                        borderRadius: 2,
                                        px: 5,
                                        py: 1.2,
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        background: 'linear-gradient(90deg, #f6a623 0%, #f6a623 100%)',
                                        color: '#fff',
                                        fontSize: '1rem',
                                        boxShadow: '0 4px 12px rgba(246, 166, 35, 0.3)',
                                        '&:hover': {
                                            background: 'linear-gradient(90deg, #e89512 0%, #e89512 100%)',
                                            boxShadow: '0 6px 16px rgba(246, 166, 35, 0.4)',
                                        },
                                        '&:disabled': {
                                            background: '#d1d5db',
                                            color: '#9ca3af'
                                        }
                                    }}
                                    startIcon={loading && <CircularProgress size={20} sx={{ color: '#fff' }} />}
                                >
                                    {loading ? lang('common.saving_changes', 'Saving Changes...') : lang('common.save_changes', 'Save Changes')}
                                </Button>
                            </Box>
                        </form>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    )
};

export default MyProfile;