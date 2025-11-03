import React, { useState, useEffect } from 'react'
import { FiSave } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { apiGet, apiPost } from '@/lib/api'
import useLocationData from '@/hooks/useLocationData'
import useOfftakerData from '@/hooks/useOfftakerData'
import Swal from 'sweetalert2'
import { showSuccessToast, showErrorToast } from '@/utils/topTost'
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

const TabProjectBasicDetails = ({ setFormData, formData, error, setError }) => {
    const router = useRouter()
    const { lang } = useLanguage()
    // Location data via shared hook (same behavior as UsersCreateForm)
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
    const [loading, setLoading] = useState({ form: false })
    const [projectTypes, setProjectTypes] = useState([])

    // Offtakers are loaded by hook on mount; load project types
    useEffect(() => {
        const loadTypes = async () => {
            try {
                const res = await apiGet('/api/project-types')
                if (res?.success) setProjectTypes(res.data)
            } catch (e) {
                // noop
            }
        }
        loadTypes()
    }, [])

    // ✅ Handle all input fields
    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))

        // live-clear field errors when valid
        setError(prev => {
            const next = { ...prev }
            if (name in next) {
                const numberRegex = /^[0-9]*\.?[0-9]*$/
                const intRegex = /^\d+$/
                let isValid = true
                if (name === 'investorProfit' || name === 'weshareprofite' || name === 'asking_price') {
                    isValid = value === '' || numberRegex.test(value)
                } else if (name === 'lease_term') {
                    isValid = value !== '' && intRegex.test(value)
                } else {
                    isValid = Boolean(value)
                }
                if (isValid) delete next[name]
            }
            return next
        })
    }

    // ✅ Handle country/state/city dropdown changes (same pattern as UsersCreateForm)
    const handleLocationChange = (type, value) => {
        if (type === 'country') {
            setFormData(prev => ({
                ...prev,
                countryId: value,
                stateId: '',
                cityId: ''
            }))
            handleCountryChange(value)
        } else if (type === 'state') {
            setFormData(prev => ({
                ...prev,
                stateId: value,
                cityId: ''
            }))
            handleStateChange(value)
        } else if (type === 'city') {
            setFormData(prev => ({
                ...prev,
                cityId: value
            }))
        }
    }

    // ✅ When Offtaker changes, auto-fill address
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
                // Trigger dependent dropdown data
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        const requiredFields = ['project_name', 'project_type_id', 'offtaker', 'countryId', 'stateId', 'cityId', 'asking_price', 'lease_term', 'product_code'];
        const errors = {};

        requiredFields.forEach(field => {
            if (!formData[field]) {
                errors[field] = lang('validation.required', 'Required');
            }
        });

        const numberRegex = /^[0-9]*\.?[0-9]*$/;
        const intRegex = /^\d+$/;

        if (formData.investorProfit && !numberRegex.test(formData.investorProfit)) {
            errors.investorProfit = lang('projects.onlynumbers', 'Only numbers are allowed (e.g. 1234.56)');
        }

        if (formData.weshareprofite && !numberRegex.test(formData.weshareprofite)) {
            errors.weshareprofite = lang('projects.onlynumbers', 'Only numbers are allowed (e.g. 1234.56)');
        }

        // asking price numeric
        if (!formData.asking_price) {
            errors.asking_price = lang('projects.askingPriceRequired', 'Asking price is required');
        } else if (!numberRegex.test(formData.asking_price)) {
            errors.asking_price = lang('projects.onlynumbers', 'Only numbers are allowed (e.g. 1234.56)');
        }

        // lease term required integer
        if (!formData.lease_term) {
            errors.lease_term = lang('projects.leaseTermRequired', 'Lease term is required');
        } else if (!intRegex.test(String(formData.lease_term))) {
            errors.lease_term = lang('projects.onlynumbersWithoutdesimal', 'Only numbers are allowed (e.g. 123456)');
        }

        // product code required
        if (!formData.product_code) {
            errors.product_code = lang('projects.productCodeRequired', 'Product code is required');
        }

        if (Object.keys(errors).length > 0) {
            setError(prev => ({ ...prev, ...errors }));
            return;
        }

        setLoading(prev => ({ ...prev, form: true }));

        try {
            // Prepare the project data for submission
            const projectData = {
                name: formData.project_name,
                project_type_id: Number(formData.project_type_id),
                offtaker_id: Number(formData.offtaker),
                address1: formData.address1 || '',
                address2: formData.address2 || '',
                country_id: Number(formData.countryId),
                state_id: Number(formData.stateId),
                city_id: Number(formData.cityId),
                zipcode: formData.zipcode || '',
                project_manage: formData.projectManage || 'Project Manager',
                asking_price: formData.asking_price || '',
                lease_term: formData.lease_term ? Number(formData.lease_term) : null,
                product_code: formData.product_code || '',
                project_description: formData.project_description || '',
                investor_profit: formData.investorProfit || '0',
                weshare_profit: formData.weshareprofite || '0',
                status: formData.status === 'active' ? 1 : 0
            };

            // Submit to API
            const response = await apiPost('/api/projects/AddProject', projectData);

            if (response.success) {
                showSuccessToast(lang('projects.projectcreatedsuccessfully', 'Project created successfully'))
                router.push('/admin/projects/list');
            } else {
                throw new Error(response.message || 'Failed to create project');
            }
        } catch (error) {
            console.error('Error creating project:', error);
            showErrorToast(error.message || 'Failed to create project')
        } finally {
            setLoading(prev => ({ ...prev, form: false }));
        }
    }

    return (
        <form id="project-form" onSubmit={handleSubmit}>
            <div className="row">
                {/* Project Information */}
                <div className="col-md-12">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h6 className="card-title mb-0">{lang('projects.projectInformation', 'Project Information')}</h6>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-4 mb-3">
                                    <TextField
                                        fullWidth
                                        label={`${lang('projects.projectName', 'Project Name')} *`}
                                        name="project_name"
                                        value={formData.project_name}
                                        onChange={handleInputChange}
                                        placeholder={lang('projects.projectNamePlaceholder', 'Enter project name')}
                                        error={!!error.project_name}
                                        helperText={error.project_name}
                                        size="small"
                                    />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <FormControl fullWidth size="small" error={!!error.project_type_id}>
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
                                <div className="col-md-4 mb-3">
                                    <FormControl fullWidth size="small" error={!!error.offtaker}>
                                        <InputLabel id="offtaker-select-label">{lang('projects.selectOfftaker', 'Select Offtaker')} *</InputLabel>
                                        <Select
                                            labelId="offtaker-select-label"
                                            name="offtaker"
                                            value={formData.offtaker}
                                            label={`${lang('projects.selectOfftaker', 'Select Offtaker')} *`}
                                            onChange={handleOfftakerChange}
                                            disabled={loadingOfftakers}
                                        >
                                            <MenuItem value="">{lang('projects.selectOfftaker', 'Select Offtaker')}</MenuItem>
                                            {offtakers.map(offtaker => (
                                                <MenuItem key={offtaker.id} value={offtaker.id}>
                                                    {offtaker.fullName}
                                                </MenuItem>
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
                                        label={`${lang('projects.askingPrice', 'Asking Price')} *`}
                                        name="asking_price"
                                        value={formData.asking_price || ''}
                                        onChange={handleInputChange}
                                        inputMode="decimal"
                                        error={!!error.asking_price}
                                        helperText={error.asking_price}
                                        size="small"
                                    />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <TextField
                                        fullWidth
                                        label={`${lang('projects.leaseTerm', 'Lease Term')} ${lang('projects.year', 'year')} *`}
                                        name="lease_term"
                                        value={formData.lease_term || ''}
                                        onChange={handleInputChange}
                                        inputMode="numeric"
                                        error={!!error.lease_term}
                                        helperText={error.lease_term}
                                        size="small"
                                    />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <TextField
                                        fullWidth
                                        label={`${lang('projects.productCode', 'Product Code')} *`}
                                        name="product_code"
                                        value={formData.product_code || ''}
                                        onChange={handleInputChange}
                                        error={!!error.product_code}
                                        helperText={error.product_code}
                                        size="small"
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
                                        size="small"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Address Information */}
                <div className="col-md-12">
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
                                        size="small"
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
                                        size="small"
                                    />
                                </div>

                                {/* Country */}
                                <div className="col-md-3 mb-3">
                                    <FormControl fullWidth size="small" error={!!error.countryId}>
                                        <InputLabel id="country-select-label">{lang('projects.country', 'Country')}</InputLabel>
                                        <Select
                                            labelId="country-select-label"
                                            value={formData.countryId}
                                            label={lang('projects.country', 'Country')}
                                            onChange={(e) => handleLocationChange('country', e.target.value)}
                                            disabled={loadingCountries}
                                        >
                                            <MenuItem value="">{lang('projects.selectCountry', 'Select Country')}</MenuItem>
                                            {countries.map(country => (
                                                <MenuItem key={country.id} value={country.id}>
                                                    {country.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {error.countryId && <FormHelperText>{error.countryId}</FormHelperText>}
                                    </FormControl>
                                </div>

                                {/* State */}
                                <div className="col-md-3 mb-3">
                                    <FormControl fullWidth size="small" error={!!error.stateId}>
                                        <InputLabel id="state-select-label">{lang('projects.state', 'State')}</InputLabel>
                                        <Select
                                            labelId="state-select-label"
                                            value={formData.stateId}
                                            label={lang('projects.state', 'State')}
                                            onChange={(e) => handleLocationChange('state', e.target.value)}
                                            disabled={loadingStates || !formData.countryId}
                                        >
                                            <MenuItem value="">{lang('projects.selectState', 'Select State')}</MenuItem>
                                            {states.map(state => (
                                                <MenuItem key={state.id} value={state.id}>
                                                    {state.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {error.stateId && <FormHelperText>{error.stateId}</FormHelperText>}
                                    </FormControl>
                                </div>

                                {/* City */}
                                <div className="col-md-3 mb-3">
                                    <FormControl fullWidth size="small" error={!!error.cityId}>
                                        <InputLabel id="city-select-label">{lang('projects.city', 'City')}</InputLabel>
                                        <Select
                                            labelId="city-select-label"
                                            value={formData.cityId}
                                            label={lang('projects.city', 'City')}
                                            onChange={(e) => handleLocationChange('city', e.target.value)}
                                            disabled={loadingCities || !formData.stateId}
                                        >
                                            <MenuItem value="">{lang('projects.selectCity', 'Select City')}</MenuItem>
                                            {cities.map(city => (
                                                <MenuItem key={city.id} value={city.id}>
                                                    {city.name}
                                                </MenuItem>
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
                                        size="small"
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
                                        size="small"
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
                                        size="small"
                                    />
                                </div>

                                {/* Status */}
                                <div className="col-md-3 mb-3">
                                    <FormControl fullWidth size="small" error={!!error.status}>
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

                            {/* Actions inside Address Information */}
                            <div className="col-12 mt-2 d-flex justify-content-end">
                                <Button 
                                    type="submit" 
                                    variant="contained" 
                                    disabled={loading.form}
                                    startIcon={loading.form ? <CircularProgress size={16} /> : <FiSave />}
                                >
                                    {loading.form ? lang('common.saving', 'Saving') : lang('projects.saveProject', 'Save Project')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    )
}

export default TabProjectBasicDetails
