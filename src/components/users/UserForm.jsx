'use client'
import React, { useState, useEffect, useRef } from 'react'
import { apiGet } from '@/lib/api'
import useLocationData from '@/hooks/useLocationData'
import { useLanguage } from '@/contexts/LanguageContext'
import {
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormHelperText,
    Button,
    CircularProgress,
} from "@mui/material";

const UserForm = ({ initialData = {}, onSubmit, includePassword = false, excludeId = null, roles = [] }) => {
    const { lang } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [usernameChecking, setUsernameChecking] = useState(false)
    const [errors, setErrors] = useState({})

    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        userRole: '',
        address1: '',
        address2: '',
        countryId: '',
        stateId: '',
        cityId: '',
        zipcode: '',
        qrCode: '',
        status: '1'
    })

    const [qrCodeFile, setQrCodeFile] = useState(null)
    const [qrCodePreview, setQrCodePreview] = useState(null)

    

    const {
        countries,
        states,
        cities,
        loadingCountries,
        loadingStates,
        loadingCities,
        handleCountryChange,
        handleStateChange
    } = useLocationData()

    const initializedLocationRef = useRef(false)

    useEffect(() => {
        if (!initializedLocationRef.current && initialData && Object.keys(initialData).length) {
            initializedLocationRef.current = true

            // avoid merging roles into formData (roles should be passed via roles prop)
            const data = { ...initialData }
            if (data.roles) delete data.roles
            setFormData(prev => ({ ...prev, ...data }))

            // Set QR code preview if exists
            if (data.qrCode) {
                setQrCodePreview(data.qrCode)
            }

            // When editing, if the user already has country/state set we must
            // load the dependent lists so the selected options are visible.
            if (data.countryId) {
                try {
                    handleCountryChange(data.countryId)
                } catch (err) {
                    // gracefully ignore if handler is not available
                    console.error('handleCountryChange error:', err)
                }
            }
            if (data.stateId) {
                try {
                    handleStateChange(data.stateId)
                } catch (err) {
                    console.error('handleStateChange error:', err)
                }
            }
        }
    }, [initialData])

    const isEditing = initialData && Object.keys(initialData).length > 0

    const validateForm = () => {
        const newErrors = {}

        if (!formData.username || !formData.username.trim()) {
            newErrors.username = 'Username is required'
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            newErrors.username = 'Username can only contain letters, numbers and underscores'
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters long'
        }

        if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required'

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address'
        }

        // Password handling:
        // - When creating (not editing) and includePassword is true, password is required
        // - When editing and includePassword is true, password is optional; but if provided must meet rules
        if (includePassword) {
            if (!isEditing) {
                // creating: require password
                if (!formData.password) newErrors.password = 'Password is required'
                else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters long'
                if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
            } else {
                // editing: only validate if password provided
                if (formData.password) {
                    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters long'
                    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
                }
            }
        }

        if (!formData.userRole) newErrors.userRole = 'User role is required'

        // QR code validation for investor role (role id 4)
        if (formData.userRole === 4 || formData.userRole === '4') {
            if (!isEditing && !qrCodeFile) {
                newErrors.qrCode = 'QR code is required for investor'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const checkUsernameUnique = async (username) => {
        if (!username) return true
        // If excludeId provided, pass to API so backend can ignore current user
        setUsernameChecking(true)
        try {
            const qs = new URLSearchParams({ username, ...(excludeId ? { excludeId } : {}) }).toString()
            const res = await apiGet(`/api/users/check-username?${qs}`)
            if (res && res.success && res.data && typeof res.data.exists !== 'undefined') {
                return !res.data.exists
            }
            if (res && typeof res.exists !== 'undefined') return !res.exists
        } catch (err) {
            console.error('Username uniqueness check failed:', err)
        } finally {
            setUsernameChecking(false)
        }
        // Treat as unique if endpoint fails
        return true
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    }

    const handleQrCodeChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
            if (!validTypes.includes(file.type)) {
                setErrors(prev => ({ ...prev, qrCode: 'Please upload a valid image file (JPG, PNG, GIF)' }))
                return
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, qrCode: 'File size must be less than 5MB' }))
                return
            }

            setQrCodeFile(file)
            setQrCodePreview(URL.createObjectURL(file))
            if (errors.qrCode) setErrors(prev => ({ ...prev, qrCode: '' }))
        }
    }

    const handleRemoveQrCode = () => {
        setQrCodeFile(null)
        setQrCodePreview(null)
        setFormData(prev => ({ ...prev, qrCode: '' }))
    }

    const handleLocationChangeLocal = (type, value) => {
        if (type === 'country') {
            setFormData(prev => ({ ...prev, countryId: value, stateId: '', cityId: '' }))
            handleCountryChange(value)
        } else if (type === 'state') {
            setFormData(prev => ({ ...prev, stateId: value, cityId: '' }))
            handleStateChange(value)
        } else if (type === 'city') {
            setFormData(prev => ({ ...prev, cityId: value }))
        }
    }

    const handleUsernameBlur = async () => {
        if (!formData.username) return
        const isUnique = await checkUsernameUnique(formData.username)
        if (!isUnique) setErrors(prev => ({ ...prev, username: 'Username is already taken' }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) return
        const unique = await checkUsernameUnique(formData.username)
        if (!unique) {
            setErrors(prev => ({ ...prev, username: 'Username is already taken' }))
            return
        }

        setLoading(true)
        try {
            const submitData = {
                ...formData,
                countryId: formData.countryId || null,
                stateId: formData.stateId || null,
                cityId: formData.cityId || null
            }
            // remove confirmPassword if present
            delete submitData.confirmPassword
            // If editing and password field left empty, don't send password (keep old password)
            if (isEditing && (!formData.password || formData.password === '')) {
                delete submitData.password
            }

            // Add QR code file to submit data
            if (qrCodeFile) {
                submitData.qrCodeFile = qrCodeFile
            }

            await onSubmit(submitData)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="row">
                {/* Combined User Info Card: Personal, Account, Address */}
                <div className="col-md-12">
                    <div className="card mb-4">
                        <div className="card-body">
                            {/* Personal Information (sub-section) */}
                            <div className="mb-4">
                                <h6 className="mb-3">{lang('usersView.personalInformation')}</h6>
                                <div className="row">
                                    <div className="col-md-3 mb-3">
                                        <TextField
                                            fullWidth
                                            label={`${lang('usersView.fullName')} *`}
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            placeholder={lang('placeholders.enterfullname')}
                                            error={!!errors.fullName}
                                            helperText={errors.fullName}
                                        />
                                    </div>
                                    <div className="col-md-3 mb-3">
                                        <TextField
                                            fullWidth
                                            type="email"
                                            label={`${lang('authentication.email')} *`}
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder={lang('placeholders.enteremail')}
                                            error={!!errors.email}
                                            helperText={errors.email}
                                        />
                                    </div>
                                    <div className="col-md-3 mb-3">
                                        <TextField
                                            fullWidth
                                            type="tel"
                                            label={lang('usersView.phonenumber')}
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleInputChange}
                                            placeholder={lang('placeholders.enterphonenumber')}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Account Information (sub-section) */}
                            <div className="mb-4">
                                <h6 className="mb-3">{lang('usersView.accountInformation')}</h6>
                                <div className="row">
                                    <div className="col-md-3 mb-3">
                                        <TextField
                                            fullWidth
                                            label={`${lang('usersView.username')} *`}
                                            name="username"
                                            value={formData?.username}
                                            onChange={handleInputChange}
                                            onBlur={handleUsernameBlur}
                                            placeholder={lang('placeholders.enterusername')}
                                            autoComplete="off"
                                            error={!!errors.username}
                                            helperText={errors.username || (usernameChecking ? 'Checking availability...' : '')}
                                        />
                                    </div>
                                    {includePassword && (
                                        <>
                                            <div className="col-md-3 mb-3">
                                                <TextField
                                                    fullWidth
                                                    type="password"
                                                    label={`${lang('authentication.password')} ${(!isEditing || formData.password) ? '*' : ''}`}
                                                    name="password"
                                                    value={formData?.password}
                                                    onChange={handleInputChange}
                                                    placeholder={lang('placeholders.enterpassword')}
                                                    error={!!errors.password}
                                                    helperText={errors.password}
                                                />
                                            </div>
                                            <div className="col-md-3 mb-3">
                                                <TextField
                                                    fullWidth
                                                    type="password"
                                                    label={`${lang('authentication.confirmPassword')} ${(!isEditing || formData.password) ? '*' : ''}`}
                                                    name="confirmPassword"
                                                    value={formData?.confirmPassword}
                                                    onChange={handleInputChange}
                                                    placeholder={lang('placeholders.confirmPassword')}
                                                    error={!!errors.confirmPassword}
                                                    helperText={errors.confirmPassword}
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="col-md-3 mb-3">
                                        <FormControl fullWidth error={!!errors.userRole}>
                                            <InputLabel id="user-role-select-label">{lang('usersView.userRole')} *</InputLabel>
                                            <Select
                                                labelId="user-role-select-label"
                                                name="userRole"
                                                value={formData?.userRole}
                                                label={`${lang('usersView.userRole')} *`}
                                                onChange={handleInputChange}
                                            >
                                                <MenuItem value="">{lang('common.selectRole')}</MenuItem>
                                                {roles && roles.map(role => (
                                                    <MenuItem key={role.id} value={role.id}>{role.name.charAt(0).toUpperCase() + role.name.slice(1)}</MenuItem>
                                                ))}
                                            </Select>
                                            {errors.userRole && <FormHelperText>{errors.userRole}</FormHelperText>}
                                        </FormControl>
                                    </div>
                                    <div className="col-md-3 mb-3">
                                        <FormControl fullWidth>
                                            <InputLabel id="status-select-label">{lang('common.status')}</InputLabel>
                                            <Select
                                                labelId="status-select-label"
                                                name="status"
                                                value={formData?.status}
                                                label={lang('common.status')}
                                                onChange={handleInputChange}
                                            >
                                                <MenuItem value="1">{lang('common.active')}</MenuItem>
                                                <MenuItem value="0">{lang('common.inactive')}</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </div>

                                    {/* QR Code Upload - Only for Investor Role (id: 4) */}
                                    {(formData.userRole === 4 || formData.userRole === '4') && (
                                        <div className="col-md-3 mb-3">
                                            <div>
                                                <label className="form-label">
                                                    QR Code {!isEditing && <span style={{ color: 'red' }}>*</span>}
                                                </label>
                                                <input
                                                    type="file"
                                                    className={`form-control ${errors.qrCode ? 'is-invalid' : ''}`}
                                                    accept="image/*"
                                                    onChange={handleQrCodeChange}
                                                />
                                                {errors.qrCode && (
                                                    <div className="invalid-feedback d-block">{errors.qrCode}</div>
                                                )}
                                               
                                            </div>
                                        </div>
                                    )}
                                     {qrCodePreview && (
                                                    <div className="mt-2 position-relative" style={{ width: '150px' }}>
                                                        <img
                                                            src={qrCodePreview}
                                                            alt="QR Code Preview"
                                                            style={{ width: '100%', height: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-danger position-absolute"
                                                            style={{ top: '5px', right: '5px' }}
                                                            onClick={handleRemoveQrCode}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                )}
                                </div>
                            </div>

                            {/* Address Information (sub-section) */}
                            <div>
                                <h6 className="mb-3">{lang('usersView.addressInformation')}</h6>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <TextField
                                            fullWidth
                                            label={lang('usersView.address1')}
                                            name="address1"
                                            value={formData?.address1}
                                            onChange={handleInputChange}
                                            placeholder={lang('placeholders.enteraddress1')}
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <TextField
                                            fullWidth
                                            label={lang('usersView.address2')}
                                            name="address2"
                                            value={formData?.address2}
                                            onChange={handleInputChange}
                                            placeholder={lang('placeholders.enteraddress2')}
                                        />
                                    </div>
                                    <div className="col-md-3 mb-3">
                                        <FormControl fullWidth>
                                            <InputLabel id="country-select-label">{lang('common.country')}</InputLabel>
                                            <Select
                                                labelId="country-select-label"
                                                value={formData?.countryId}
                                                label={lang('common.country')}
                                                onChange={(e) => handleLocationChangeLocal('country', e.target.value)}
                                                disabled={loadingCountries}
                                            >
                                                <MenuItem value="">{lang('common.selectCountry')}</MenuItem>
                                                {countries.map(country => (
                                                    <MenuItem key={country.id} value={country.id}>{country.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </div>
                                    <div className="col-md-3 mb-3">
                                        <FormControl fullWidth>
                                            <InputLabel id="state-select-label">{lang('common.state')}</InputLabel>
                                            <Select
                                                labelId="state-select-label"
                                                value={formData?.stateId}
                                                label={lang('common.state')}
                                                onChange={(e) => handleLocationChangeLocal('state', e.target.value)}
                                                disabled={loadingStates || !formData.countryId}
                                            >
                                                <MenuItem value="">{lang('common.selectState')}</MenuItem>
                                                {states.map(state => (
                                                    <MenuItem key={state.id} value={state.id}>{state.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </div>
                                    <div className="col-md-3 mb-3">
                                        <FormControl fullWidth>
                                            <InputLabel id="city-select-label">{lang('common.city')}</InputLabel>
                                            <Select
                                                labelId="city-select-label"
                                                value={formData?.cityId}
                                                label={lang('common.city')}
                                                onChange={(e) => handleLocationChangeLocal('city', e.target.value)}
                                                disabled={loadingCities || !formData.stateId}
                                            >
                                                <MenuItem value="">{lang('common.selectCity')}</MenuItem>
                                                {cities.map(city => (
                                                    <MenuItem key={city.id} value={city.id}>{city.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </div>
                                    <div className="col-md-3 mb-3">
                                        <TextField
                                            fullWidth
                                            label={lang('common.zip')}
                                            name="zipcode"
                                            value={formData?.zipcode}
                                            onChange={handleInputChange}
                                            placeholder={lang('placeholders.enterzipcode')}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="card-footer d-flex justify-content-end col-md-12" style={{ paddingBottom: '0' }}>
                                <div className="d-flex gap-2">
                                    <Button type="submit" variant="contained" className="common-grey-color" disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : null}>
                                        {loading ? (includePassword ? 'Creating...' : 'Saving...') : (!isEditing ? lang('usersView.CreateUser') : 'Save')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </form>
    )
}

export default UserForm
