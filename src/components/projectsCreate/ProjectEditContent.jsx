'use client'
import React, { useEffect, useState } from 'react'
import { FiSave, FiUpload, FiX } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { apiGet, apiPut, apiPost } from '@/lib/api'
import useLocationData from '@/hooks/useLocationData'
import useOfftakerData from '@/hooks/useOfftakerData'
import Swal from 'sweetalert2'
import { showSuccessToast, showErrorToast } from '@/utils/topTost'
import { useLanguage } from '@/contexts/LanguageContext'
import InverterTab from './InverterTab'
import Image from 'next/image'
import {
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormHelperText,
    Button,
    CircularProgress,
    Box,
    IconButton,
} from "@mui/material";

const ProjectEditContent = ({ projectId }) => {
    const router = useRouter()
    const { lang } = useLanguage()
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
    const { offtakers, loadingOfftakers, fetchOfftakerById } = useOfftakerData()

    const [loading, setLoading] = useState({ form: false, init: true, image: false })
    const [error, setError] = useState({})
    const [imagePreview, setImagePreview] = useState(null)
    const [formData, setFormData] = useState({
        project_name: '',
        project_type_id: '',
        offtaker: '',
        address1: '',
        address2: '',
        countryId: '',
        stateId: '',
        cityId: '',
        zipcode: '',
        asking_price: '',
        lease_term: '',
        product_code: '',
        project_description: '',
        investorProfit: '',
        weshareprofite: '',
        project_image: '',
        project_size: '',
        project_close_date: '',
        project_location: '',
        status: ''
    })
    const [projectTypes, setProjectTypes] = useState([])
    const steps = [
        { name: lang('projects.projectInformation', 'Project Information'), key: 'info' },
        { name: lang('inverter.inverter', 'Inverter'), key: 'inverter' }
    ];
    const [activeTab, setActiveTab] = useState('info');

    // Load types and existing project
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(prev => ({ ...prev, init: true }))
                const typesRes = await apiGet('/api/project-types')
                if (typesRes?.success) setProjectTypes(typesRes.data)
                const res = await apiGet(`/api/projects/${projectId}`)
                if (res?.success && res.data) {
                    const p = res.data
                    setFormData({
                        project_name: p.project_name || '',
                        project_type_id: p.project_type_id || p.projectType?.id || '',
                        offtaker: String(p.offtaker_id || ''),
                        address1: p.address1 || '',
                        address2: p.address2 || '',
                        countryId: p.countryId || '',
                        stateId: p.stateId || '',
                        cityId: p.cityId || '',
                        zipcode: p.zipcode || '',
                        asking_price: p.asking_price || '',
                        lease_term: p.lease_term ?? '',
                        product_code: p.product_code || '',
                        project_description: p.project_description || '',
                        investorProfit: p.investor_profit || '',
                        weshareprofite: p.weshare_profit || '',
                        project_image: p.project_image || '',
                        project_size: p.project_size || '',
                        project_close_date: p.project_close_date ? new Date(p.project_close_date).toISOString().split('T')[0] : '',
                        project_location: p.project_location || '',
                        status: p.status === 1 ? 'active' : 'inactive'
                    })
                    if (p.countryId) handleCountryChange(p.countryId)
                    if (p.stateId) handleStateChange(p.stateId)
                    if (p.project_image) setImagePreview(p.project_image)
                }
            } catch (e) {
                console.error('Load project failed', e)
                showErrorToast(e.message || 'Failed to load project')
            } finally {
                setLoading(prev => ({ ...prev, init: false }))
            }
        }
        if (projectId) load()
    }, [projectId])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        // live clear errors when valid
        setError(prev => {
            const next = { ...prev }
            if (name in next) {
                const numberRegex = /^[0-9]*\.?[0-9]*$/
                const intRegex = /^\d+$/
                let isValid = true
                if (name === 'investorProfit' || name === 'weshareprofite' || name === 'asking_price' || name === 'project_size') {
                    isValid = value === '' || numberRegex.test(value)
                } else if (name === 'lease_term') {
                    isValid = value === '' || intRegex.test(value)
                } else {
                    isValid = Boolean(value)
                }
                if (isValid) delete next[name]
            }
            return next
        })
    }

    const handleLocationChange = (type, value) => {
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

    const handleOfftakerChange = async (e) => {
        const offtakerId = e.target.value
        setFormData(prev => ({ ...prev, offtaker: offtakerId }))
        if (offtakerId) {
            try {
                const offtaker = await fetchOfftakerById(offtakerId)
                setFormData(prev => ({
                    ...prev,
                    address1: offtaker?.address1 || '',
                    address2: offtaker?.address2 || '',
                    cityId: offtaker?.cityId || '',
                    stateId: offtaker?.stateId || '',
                    countryId: offtaker?.countryId || '',
                    zipcode: offtaker?.zipcode || ''
                }))
                if (offtaker?.countryId) {
                    handleCountryChange(offtaker.countryId)
                }
                if (offtaker?.stateId) {
                    handleStateChange(offtaker.stateId)
                }
            } catch (err) {
                console.error('Error fetching offtaker details:', err)
                setError(err?.message || 'Failed to load offtaker')
            }
        }
    }

    // Handle image file upload
    const handleImageUpload = async (e) => {
        const file = e.target.files && e.target.files[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showErrorToast(lang('validation.invalidImageType', 'Please select a valid image file'))
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showErrorToast(lang('validation.imageTooLarge', 'Image size must be less than 5MB'))
            return
        }

        setLoading(prev => ({ ...prev, image: true }))

        try {
            // Read file as base64
            const reader = new FileReader()
            reader.onload = async () => {
                const dataUrl = reader.result
                setImagePreview(dataUrl)

                // Upload to server
                const response = await apiPost('/api/projects/upload-image', { dataUrl })
                
                if (response.success) {
                    setFormData(prev => ({ ...prev, project_image: response.data.path }))
                    showSuccessToast(lang('projects.imageUploaded', 'Image uploaded successfully'))
                } else {
                    throw new Error(response.message || 'Upload failed')
                }
            }
            reader.readAsDataURL(file)
        } catch (error) {
            console.error('Error uploading image:', error)
            showErrorToast(error.message || lang('projects.imageUploadFailed', 'Failed to upload image'))
            setImagePreview(null)
        } finally {
            setLoading(prev => ({ ...prev, image: false }))
        }
    }

    // Remove uploaded image
    const handleRemoveImage = () => {
        setImagePreview(null)
        setFormData(prev => ({ ...prev, project_image: '' }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const requiredFields = ['project_name', 'project_type_id']
        const errors = {}
        requiredFields.forEach(field => { if (!formData[field]) { errors[field] = lang('validation.required', 'Required') } })
        const numberRegex = /^[0-9]*\.?[0-9]*$/;
        const intRegex = /^\d+$/;
        if (formData.investorProfit && !numberRegex.test(formData.investorProfit)) {
            errors.investorProfit = lang('projects.onlynumbers', 'Only numbers are allowed (e.g. 1234.56)');
        }
        if (formData.weshareprofite && !numberRegex.test(formData.weshareprofite)) {
            errors.weshareprofite = lang('projects.onlynumbers', 'Only numbers are allowed (e.g. 1234.56)');
        }
        if (formData.asking_price && !numberRegex.test(formData.asking_price)) {
            errors.asking_price = lang('projects.onlynumbers', 'Only numbers are allowed (e.g. 1234.56)')
        }
        if (formData.lease_term && !intRegex.test(String(formData.lease_term))) {
            errors.lease_term = lang('projects.onlynumbersWithoutdesimal', 'Only numbers are allowed (e.g. 123456)')
        }
        if (formData.project_size && !numberRegex.test(formData.project_size)) {
            errors.project_size = lang('projects.onlynumbers', 'Only numbers are allowed (e.g. 1234.56)')
        }
        if (Object.keys(errors).length) { setError(errors); return }

        setLoading(prev => ({ ...prev, form: true }))
        try {
            const payload = {
                name: formData.project_name,
                project_type_id: Number(formData.project_type_id),
                ...(formData.offtaker && { offtaker_id: Number(formData.offtaker) }),
                address1: formData.address1 || '',
                address2: formData.address2 || '',
                ...(formData.countryId && { country_id: Number(formData.countryId) }),
                ...(formData.stateId && { state_id: Number(formData.stateId) }),
                ...(formData.cityId && { city_id: Number(formData.cityId) }),
                zipcode: formData.zipcode || '',
                asking_price: formData.asking_price || '',
                lease_term: formData.lease_term ? Number(formData.lease_term) : null,
                product_code: formData.product_code || '',
                project_description: formData.project_description || '',
                investor_profit: formData.investorProfit || '0',
                weshare_profit: formData.weshareprofite || '0',
                project_image: formData.project_image || '',
                project_size: formData.project_size || '',
                project_close_date: formData.project_close_date || null,
                project_location: formData.project_location || '',
                status: formData.status === 'active' ? 1 : 0
            }
            const res = await apiPut(`/api/projects/${projectId}`, payload)
            if (res.success) {
                showSuccessToast(lang('projects.projectupdatedsuccessfully', 'Project updated successfully'))
                router.push('/admin/projects/list')
            } else {
                throw new Error(res.message || 'Update failed')
            }
        } catch (e) {
            console.error('Update project failed', e)
            showErrorToast(e.message || 'Failed to update project')
        } finally {
            setLoading(prev => ({ ...prev, form: false }))
        }
    }

    return (
        <div className="col-lg-12">
            <div className="card border-top-0">
                <div className="card-body p-0 wizard" id="project-edit-steps">
                    {/* Custom tab navigation (like create project) */}
                    <div className="steps clearfix">
                        <ul role="tablist" className="custom-steps">
                            {steps.map((step, i) => (
                                <li
                                    key={step.key}
                                    className={activeTab === step.key ? 'current' : ''}
                                    onClick={e => {
                                        e.preventDefault();
                                        setActiveTab(step.key);
                                    }}
                                >
                                    <a href="#" className="d-block fw-bold">{step.name}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="main-content">
                        {activeTab === 'info' && (
                            <form onSubmit={handleSubmit}>
                                <div className="card mb-4">
                                    <div className="card-header">
                                        <h6 className="card-title mb-0">{lang('projects.projectInformation', 'Project Information')}</h6>
                                    </div>
                                    <div className="card-body">
                                        {/* Image Preview - Right Side */}
                                        {imagePreview && (
                                            <div className="col-md-6 pb-3" style={{ width: '18%' }}>
                                                <Box
                                                    sx={{
                                                        width: '100%',
                                                        height: '120px',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                        border: '1px solid #e5e7eb',
                                                        backgroundColor: '#f9fafb',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <img
                                                        src={imagePreview}
                                                        alt="Project Preview"
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'contain',
                                                            objectPosition: 'center'
                                                        }}
                                                    />
                                                </Box>
                                            </div>
                                        )}
                                        <div className="row">
                                            <div className="col-md-3">
                                                <FormControl fullWidth>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 2,
                                                            border: '1px solid #d0d5dd',
                                                            borderRadius: '4px',
                                                            padding: '8px 12px',
                                                            backgroundColor: '#fff',
                                                            '&:hover': {
                                                                borderColor: '#9ca3af'
                                                            }
                                                        }}
                                                    >
                                                        <Button
                                                            variant="outlined"
                                                            component="label"
                                                            htmlFor="project-image-upload-edit"
                                                            disabled={loading.image}
                                                            sx={{
                                                                textTransform: 'none',
                                                                minWidth: '90px',
                                                                borderColor: '#d0d5dd',
                                                                color: '#374151',
                                                                '&:hover': {
                                                                    borderColor: '#9ca3af',
                                                                    backgroundColor: '#f9fafb'
                                                                }
                                                            }}
                                                        >
                                                            {loading.image ? (
                                                                <CircularProgress size={16} sx={{ mr: 1 }} />
                                                            ) : null}
                                                            {lang('common.browse', 'Browse...')}
                                                        </Button>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            id="project-image-upload-edit"
                                                            hidden
                                                            onChange={handleImageUpload}
                                                            disabled={loading.image}
                                                        />
                                                        <Box sx={{ flex: 1, color: '#6b7280', fontSize: '14px' }}>
                                                            {imagePreview ? (
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <span style={{ color: '#059669', fontWeight: 500 }}>✓</span>
                                                                    <span>{lang('projects.imageSelected', 'Image selected')}</span>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={handleRemoveImage}
                                                                        sx={{
                                                                            ml: 'auto',
                                                                            color: '#dc2626',
                                                                            '&:hover': { backgroundColor: '#fee2e2' }
                                                                        }}
                                                                    >
                                                                        <FiX size={16} />
                                                                    </IconButton>
                                                                </Box>
                                                            ) : (
                                                                lang('common.noFileSelected', 'No file selected.')
                                                            )}
                                                        </Box>
                                                    </Box>
                                                    <FormHelperText>
                                                        {error.project_image ? (
                                                            <span className="text-danger">{error.project_image}</span>
                                                        ) : (
                                                            lang('projects.uploadProjectImage', 'Upload your project image')
                                                        )}
                                                    </FormHelperText>
                                                </FormControl>
                                            </div>
                                            <div className="col-md-3 mb-3">
                                                <TextField
                                                    fullWidth
                                                    label={`${lang('projects.projectName', 'Project Name')} *`}
                                                    name="project_name"
                                                    value={formData.project_name}
                                                    onChange={handleInputChange}
                                                    placeholder={lang('projects.projectNamePlaceholder', 'Enter project name')}
                                                    error={!!error.project_name}
                                                    helperText={error.project_name}
                                                />
                                            </div>
                                            <div className="col-md-3 mb-3">
                                                <FormControl fullWidth error={!!error.project_type_id}>
                                                    <InputLabel id="project-type-select-label">{lang('projects.projectType', 'Project Type')} *</InputLabel>
                                                    <Select
                                                        labelId="project-type-select-label"
                                                        name="project_type_id"
                                                        value={formData.project_type_id || ''}
                                                        label={`${lang('projects.projectType', 'Project Type')} *`}
                                                        onChange={handleInputChange}
                                                    >
                                                        <MenuItem value="">{lang('projects.projectType', 'Project Type')}</MenuItem>
                                                        {projectTypes.map(t => (
                                                            <MenuItem key={t.id} value={t.id}>{t.type_name}</MenuItem>
                                                        ))}
                                                    </Select>
                                                    {error.project_type_id && <FormHelperText>{error.project_type_id}</FormHelperText>}
                                                </FormControl>
                                            </div>
                                            <div className="col-md-3 mb-3">
                                                <FormControl fullWidth error={!!error.offtaker}>
                                                    <InputLabel id="offtaker-select-label">{lang('projects.selectOfftaker', 'Select Offtaker')}</InputLabel>
                                                    <Select
                                                        labelId="offtaker-select-label"
                                                        name="offtaker"
                                                        value={formData.offtaker}
                                                        label={lang('projects.selectOfftaker', 'Select Offtaker')}
                                                        onChange={handleOfftakerChange}
                                                        disabled={loadingOfftakers}
                                                    >
                                                        <MenuItem value="">{lang('projects.selectOfftaker', 'Select Offtaker')}</MenuItem>
                                                        {offtakers.map(o => (
                                                            <MenuItem key={o.id} value={o.id}>{o.fullName}</MenuItem>
                                                        ))}
                                                    </Select>
                                                    {error.offtaker && <FormHelperText>{error.offtaker}</FormHelperText>}
                                                </FormControl>
                                            </div>
                                        </div>
                                        {/* row: asking_price, lease_term, product_code */}
                                        <div className="row">
                                            <div className="col-md-4 mb-3">
                                                <TextField
                                                    fullWidth
                                                    label={lang('projects.askingPrice', 'Asking Price')}
                                                    name="asking_price"
                                                    value={formData.asking_price || ''}
                                                    onChange={handleInputChange}
                                                    inputMode="decimal"
                                                    error={!!error.asking_price}
                                                    helperText={error.asking_price}
                                                />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <TextField
                                                    fullWidth
                                                    label={`${lang('projects.leaseTerm', 'Lease Term')} ${lang('projects.year', 'year')}`}
                                                    name="lease_term"
                                                    value={formData.lease_term || ''}
                                                    onChange={handleInputChange}
                                                    inputMode="numeric"
                                                    error={!!error.lease_term}
                                                    helperText={error.lease_term}
                                                />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <TextField
                                                    fullWidth
                                                    label={lang('projects.productCode', 'Product Code')}
                                                    name="product_code"
                                                    value={formData.product_code || ''}
                                                    onChange={handleInputChange}
                                                    error={!!error.product_code}
                                                    helperText={error.product_code}
                                                />
                                            </div>
                                        </div>
                                        {/* row: project_size, project_close_date, project_location */}
                                        <div className="row">
                                            <div className="col-md-4 mb-3">
                                                <TextField
                                                    fullWidth
                                                    label={lang('projects.projectSize', 'Project Size (kW)')}
                                                    name="project_size"
                                                    value={formData.project_size || ''}
                                                    onChange={handleInputChange}
                                                    inputMode="decimal"
                                                    placeholder={lang('projects.projectSizePlaceholder', 'Enter project size')}
                                                    error={!!error.project_size}
                                                    helperText={error.project_size}
                                                />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <TextField
                                                    fullWidth
                                                    type="date"
                                                    label={lang('projects.projectCloseDate', 'Project Close Date')}
                                                    name="project_close_date"
                                                    value={formData.project_close_date || ''}
                                                    onChange={handleInputChange}
                                                    InputLabelProps={{ shrink: true }}
                                                    error={!!error.project_close_date}
                                                    helperText={error.project_close_date}
                                                />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <TextField
                                                    fullWidth
                                                    label={lang('projects.projectLocation', 'Project Location')}
                                                    name="project_location"
                                                    value={formData.project_location || ''}
                                                    onChange={handleInputChange}
                                                    placeholder={lang('projects.projectLocationPlaceholder', 'Enter location URL or address')}
                                                    error={!!error.project_location}
                                                    helperText={error.project_location || lang('projects.projectLocationHelp', 'Enter a URL (e.g., Google Maps link) or location name')}
                                                />
                                            </div>
                                        </div>
                                        {/* Description full-width row */}
                                        <div className="row">
                                            <div className="col-md-12 mb-3">
                                                <TextField
                                                    fullWidth
                                                    label={lang('projects.projectDescription', 'Project Description')}
                                                    name="project_description"
                                                    value={formData.project_description || ''}
                                                    onChange={handleInputChange}
                                                    multiline
                                                    rows={4}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card mb-4">
                                    <div className="card-header">
                                        <h6 className="card-title mb-0">{lang('projects.addressInformation', 'Address Information')}</h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <TextField
                                                    fullWidth
                                                    label={lang('projects.addressLine1', 'Address Line 1')}
                                                    name="address1"
                                                    value={formData.address1}
                                                    onChange={handleInputChange}
                                                    placeholder={lang('projects.addressLine1Placeholder', 'Enter address line 1')}
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <TextField
                                                    fullWidth
                                                    label={lang('projects.addressLine2', 'Address Line 2')}
                                                    name="address2"
                                                    value={formData.address2}
                                                    onChange={handleInputChange}
                                                    placeholder={lang('projects.addressLine2Placeholder', 'Enter address line 2')}
                                                />
                                            </div>

                                            {/* Country */}
                                            <div className="col-md-3 mb-3">
                                                <FormControl fullWidth error={!!error.countryId}>
                                                    <InputLabel id="country-select-label">{lang('projects.country', 'Country')}</InputLabel>
                                                    <Select
                                                        labelId="country-select-label"
                                                        value={formData.countryId}
                                                        label={lang('projects.country', 'Country')}
                                                        onChange={(e) => handleLocationChange('country', e.target.value)}
                                                        disabled={loadingCountries}
                                                    >
                                                        <MenuItem value="">{lang('projects.selectCountry', 'Select Country')}</MenuItem>
                                                        {countries.map(c => (
                                                            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                                        ))}
                                                    </Select>
                                                    {error.countryId && <FormHelperText>{error.countryId}</FormHelperText>}
                                                </FormControl>
                                            </div>

                                            {/* State */}
                                            <div className="col-md-3 mb-3">
                                                <FormControl fullWidth error={!!error.stateId}>
                                                    <InputLabel id="state-select-label">{lang('projects.state', 'State')}</InputLabel>
                                                    <Select
                                                        labelId="state-select-label"
                                                        value={formData.stateId}
                                                        label={lang('projects.state', 'State')}
                                                        onChange={(e) => handleLocationChange('state', e.target.value)}
                                                        disabled={loadingStates || !formData.countryId}
                                                    >
                                                        <MenuItem value="">{lang('projects.selectState', 'Select State')}</MenuItem>
                                                        {states.map(s => (
                                                            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                                                        ))}
                                                    </Select>
                                                    {error.stateId && <FormHelperText>{error.stateId}</FormHelperText>}
                                                </FormControl>
                                            </div>

                                            {/* City */}
                                            <div className="col-md-3 mb-3">
                                                <FormControl fullWidth error={!!error.cityId}>
                                                    <InputLabel id="city-select-label">{lang('projects.city', 'City')}</InputLabel>
                                                    <Select
                                                        labelId="city-select-label"
                                                        value={formData.cityId}
                                                        label={lang('projects.city', 'City')}
                                                        onChange={(e) => handleLocationChange('city', e.target.value)}
                                                        disabled={loadingCities || !formData.stateId}
                                                    >
                                                        <MenuItem value="">{lang('projects.selectCity', 'Select City')}</MenuItem>
                                                        {cities.map(ci => (
                                                            <MenuItem key={ci.id} value={ci.id}>{ci.name}</MenuItem>
                                                        ))}
                                                    </Select>
                                                    {error.cityId && <FormHelperText>{error.cityId}</FormHelperText>}
                                                </FormControl>
                                            </div>

                                            {/* Zip */}
                                            <div className="col-md-3 mb-3">
                                                <TextField
                                                    fullWidth
                                                    label={lang('projects.zipcode', 'Zip Code')}
                                                    name="zipcode"
                                                    value={formData.zipcode}
                                                    onChange={handleInputChange}
                                                    placeholder={lang('projects.zipcodePlaceholder', 'Enter zip code')}
                                                />
                                            </div>

                                            {/* Investor Profit */}
                                            <div className="col-md-3 mb-3">
                                                <TextField
                                                    fullWidth
                                                    label={`${lang('projects.investorProfit', 'Investor Profit')} %`}
                                                    name="investorProfit"
                                                    value={formData.investorProfit}
                                                    onChange={handleInputChange}
                                                    error={!!error.investorProfit}
                                                    helperText={error.investorProfit}
                                                />
                                            </div>

                                            {/* Weshare profite */}
                                            <div className="col-md-3 mb-3">
                                                <TextField
                                                    fullWidth
                                                    label={`${lang('projects.weshareprofite', 'Weshare profite')} %`}
                                                    name="weshareprofite"
                                                    value={formData.weshareprofite}
                                                    onChange={handleInputChange}
                                                    placeholder={lang('projects.weshareprofitePlaceholder', 'Enter weshare profite')}
                                                    error={!!error.weshareprofite}
                                                    helperText={error.weshareprofite}
                                                />
                                            </div>

                                            {/* Status */}
                                            <div className="col-md-3 mb-3">
                                                <FormControl fullWidth error={!!error.status}>
                                                    <InputLabel id="status-select-label">{lang('projects.status', 'Status')}</InputLabel>
                                                    <Select
                                                        labelId="status-select-label"
                                                        name="status"
                                                        value={formData.status}
                                                        label={lang('projects.status', 'Status')}
                                                        onChange={handleInputChange}
                                                    >
                                                        <MenuItem value="">{lang('projects.selectStatus', 'Select Status')}</MenuItem>
                                                        <MenuItem value="active">{lang('projects.active', 'Active')}</MenuItem>
                                                        <MenuItem value="inactive">{lang('projects.inactive', 'Inactive')}</MenuItem>
                                                    </Select>
                                                    {error.status && <FormHelperText>{error.status}</FormHelperText>}
                                                </FormControl>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions inside Address Information */}
                                <div className="d-flex justify-content-end">
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={loading.form || loading.init}
                                        startIcon={loading.form ? <CircularProgress size={16} /> : <FiSave />}
                                        style={{ marginTop: '2px', marginBottom: '12px', marginRight: 0, marginLeft: 0 }}
                                        className="common-grey-color"
                                    >
                                        {loading.form ? lang('common.saving', 'Saving') : lang('projects.updateProject', 'Update Project')}
                                    </Button>
                                </div>

                            </form>
                        )}
                        {activeTab === 'inverter' && (
                            <InverterTab projectId={projectId} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProjectEditContent


