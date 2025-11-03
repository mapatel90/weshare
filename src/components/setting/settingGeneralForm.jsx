'use client'
import React, { useState, useEffect, useRef } from 'react'
import PageHeaderSetting from '@/components/shared/pageHeader/PageHeaderSetting'
import Footer from '@/components/shared/Footer'
import TextAreaTopLabel from '@/components/shared/TextAreaTopLabel'
import { FiCamera } from 'react-icons/fi'
import useImageUpload from '@/hooks/useImageUpload'
import useSettings from '@/hooks/useSettings'
import useLocationData from '@/hooks/useLocationData'
import PerfectScrollbar from 'react-perfect-scrollbar'
import InputTopLabel from '@/components/shared/InputTopLabel'
import SelectTopLabel from '@/components/shared/SelectTopLabel'
import { showErrorToast } from '@/utils/topTost'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiPost } from '@/lib/api'

const SettingGeneralForm = () => {
    const { lang } = useLanguage()
    const { user, loading: authLoading } = useAuth()
    const { handleImageUpload, uploadedImage, setUploadedImage } = useImageUpload()
    const { settings, loading: settingsLoading, updateSettings, getSetting } = useSettings()
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
    
    // Form state
    const [formData, setFormData] = useState({
        site_name: '',
        site_address: '',
        site_country: '',
        site_state: '',
        site_city: '',
        site_zip: '',
        site_phone: '',
        site_image: ''
    })
    
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isFormInitialized, setIsFormInitialized] = useState(false)
    
    // Refs to track if we've already loaded initial data
    const hasLoadedInitialStates = useRef(false)
    const hasLoadedInitialCities = useRef(false)

    // Debug: Log form data changes
    useEffect(() => {
        console.log('Form data updated:', formData)
    }, [formData])

    // Load settings into form when available (only once)
    useEffect(() => {
        if (settings && Object.keys(settings).length > 0 && !isFormInitialized) {
            const newFormData = {
                site_name: getSetting('site_name', '') || '',
                site_address: getSetting('site_address', '') || '',
                site_country: getSetting('site_country', '') || '',
                site_state: getSetting('site_state', '') || '',
                site_city: getSetting('site_city', '') || '',
                site_zip: getSetting('site_zip', '') || '',
                site_phone: getSetting('site_phone', '') || '',
                site_image: getSetting('site_image', '') || ''
            }
            
            console.log('Loading settings into form:', newFormData)
            setFormData(newFormData)
            
            // Set uploaded image if exists
            const siteImage = getSetting('site_image', '')
            if (siteImage) {
                setUploadedImage(siteImage)
            }
            
            setIsFormInitialized(true)
        }
    }, [settings, getSetting, setUploadedImage, isFormInitialized])

    // Load initial location data when form is initialized with existing settings
    useEffect(() => {
        if (isFormInitialized && formData.site_country && countries.length > 0 && !hasLoadedInitialStates.current) {
            handleCountryChange(formData.site_country)
            hasLoadedInitialStates.current = true
        }
    }, [isFormInitialized, formData.site_country, countries.length, handleCountryChange])

    // Load cities when states are loaded and we have a saved state  
    useEffect(() => {
        if (isFormInitialized && formData.site_state && states.length > 0 && !hasLoadedInitialCities.current) {
            handleStateChange(formData.site_state)
            hasLoadedInitialCities.current = true
        }
    }, [isFormInitialized, formData.site_state, states.length, handleStateChange])



    // Handle input changes
    const handleInputChange = (field, value) => {
        setFormData(prev => {
            const newData = {
                ...prev,
                [field]: value
            }
            return newData
        })
    }

    // Handle country selection
    const handleCountrySelect = (e) => {
        const countryId = e.target.value
        // Update form data
        setFormData(prev => ({
            ...prev,
            site_country: countryId,
            site_state: '', // Reset state
            site_city: '' // Reset city
        }))
        
        // Load states for selected country
        if (countryId) {
            handleCountryChange(countryId)
        }
        
        // Log after a short delay to see if states loaded
        setTimeout(() => {
            console.log('🔄 States after selection:', states.length)
        }, 2000)
    }

    // Handle state selection
    const handleStateSelect = (e) => {
        const stateId = e.target.value
        
        // Update form data
        setFormData(prev => ({
            ...prev,
            site_state: stateId,
            site_city: '' // Reset city
        }))
        
        // Load cities for selected state
        if (stateId) {
            handleStateChange(stateId)
        }
    }

    // Handle city selection
    const handleCitySelect = (e) => {
        const cityId = e.target.value  
        // Update form data
        setFormData(prev => ({
            ...prev,
            site_city: cityId
        }))
    }

    // Handle image upload
    const handleImageChange = (e) => {
        handleImageUpload(e)
    }

    // Handle form submission
    const handleSubmit = async () => {
        try {
            setIsSubmitting(true)
            
            let newImagePath = formData.site_image
            // If a new image was selected (data URL), upload it now and delete old on server
            if (uploadedImage && typeof uploadedImage === 'string' && uploadedImage.startsWith('data:')) {
                const resp = await apiPost('/api/settings/upload-logo', {
                    dataUrl: uploadedImage,
                    oldImagePath: formData.site_image || null
                })
                if (resp?.success && resp?.data?.path) {
                    newImagePath = resp.data.path
                }
            }

            // Include uploaded image path in form data
            const settingsToUpdate = {
                ...formData,
                site_image: newImagePath
            }
            
            await updateSettings(settingsToUpdate)
            // Make sure local form state reflects the saved image and clear temp preview
            setFormData(prev => ({ ...prev, site_image: newImagePath }))
            setUploadedImage(null)
            
        } catch (error) {
            console.error('Error saving settings:', error)
        } finally {
            setIsSubmitting(false)
        }
    }
    // Show loading while loading settings
    // Commented out - using global loader instead
    // if (settingsLoading) {
    //     return (
    //         <div className="content-area">
    //             <PerfectScrollbar>
    //                 <PageHeaderSetting />
    //                 <div className="content-area-body">
    //                     <div className="card mb-0">
    //                         <div className="card-body">
    //                             <div className="text-center py-5">
    //                                 <div className="spinner-border text-primary" role="status">
    //                                     <span className="visually-hidden">Loading...</span>
    //                                 </div>
    //                                 <p className="mt-2">Loading settings...</p>
    //                             </div>
    //                         </div>
    //                     </div>
    //                 </div>
    //                 <Footer />
    //             </PerfectScrollbar>
    //         </div>
    //     )
    // }

    return (
        <div className="content-area">
            <PerfectScrollbar>
                <PageHeaderSetting 
                    onSave={handleSubmit} 
                    isSubmitting={isSubmitting}
                    showSaveButton={true}
                />
                <div className="content-area-body">
                    <div className="card mb-0">
                        <div className="card-body">
                            <div className="mb-5">
                                <label htmlFor='img' className="wd-100 ht-100 position-relative overflow-hidden border border-gray-2 rounded d-inline-block" style={{ marginBottom: "-8px" }}>
                                    <img src={uploadedImage || formData.site_image || "/images/logo-abbr.png"} className="upload-pic img-fluid rounded h-100 w-100" alt="img" />
                                    <div className="position-absolute start-50 top-50 end-0 bottom-0 translate-middle h-100 w-100 hstack align-items-center justify-content-center c-pointer upload-button">
                                        <i className="camera-icon" aria-hidden="true" ><FiCamera /></i>
                                    </div>
                                    <input className="file-upload" type="file" accept="image/*" id='img' hidden onChange={handleImageChange} />
                                </label>
                            </div>
                            <InputTopLabel
                                label={lang('common.name')}
                                placeholder={lang('placeholders.your_company_name')}
                                info={lang('placeholders.your_company_name')}
                                value={formData.site_name}
                                onChange={(e) => handleInputChange('site_name', e.target.value)}
                            />
                            <InputTopLabel
                                label={lang('common.address')}
                                placeholder={lang('placeholders.your_company_address')}
                                info={lang('placeholders.your_company_address')}
                                value={formData.site_address}
                                onChange={(e) => handleInputChange('site_address', e.target.value)}
                            />
                            <SelectTopLabel
                                label={lang('common.country')}
                                placeholder={lang('placeholders.your_company_country')}
                                info={lang('placeholders.your_company_country')}
                                value={formData.site_country}
                                onChange={handleCountrySelect}
                                options={countries.map(country => ({
                                    value: country.id,
                                    label: country.name
                                }))}
                                loading={loadingCountries}
                            />
                            <SelectTopLabel
                                label={lang('common.state')}
                                placeholder={lang('placeholders.your_company_state')}
                                info={lang('placeholders.your_company_state')}
                                value={formData.site_state}
                                onChange={handleStateSelect}
                                options={states.map(state => ({
                                    value: state.id,
                                    label: state.name
                                }))}
                                loading={loadingStates}
                                disabled={!formData.site_country}
                            />
                            <SelectTopLabel
                                label={lang('common.city')}
                                placeholder={lang('placeholders.your_company_city')}
                                info={lang('placeholders.your_company_city')}
                                value={formData.site_city}
                                onChange={handleCitySelect}
                                options={cities.map(city => ({
                                    value: city.id,
                                    label: city.name
                                }))}
                                loading={loadingCities}
                                disabled={!formData.site_state}
                            />
                            
                            {/* Debug info - remove after testing */}
                            {/* <div style={{ background: '#f8f9fa', padding: '10px', margin: '10px 0', fontSize: '12px' }}>
                                <strong>Debug Info:</strong><br/>
                                Countries loaded: {countries.length}<br/>
                                States loaded: {states.length}<br/>
                                Cities loaded: {cities.length}<br/>
                                Selected Country: {formData.site_country}<br/>
                                Selected State: {formData.site_state}<br/>
                                Selected City: {formData.site_city}<br/>
                                Loading States: {loadingStates ? 'Yes' : 'No'}<br/>
                                Loading Cities: {loadingCities ? 'Yes' : 'No'}
                            </div> */}
                            
                            <InputTopLabel
                                label={lang('common.zip')}
                                placeholder={lang('placeholders.your_company_zip')}
                                info={lang('placeholders.your_company_zip')}
                                value={formData.site_zip}
                                onChange={(e) => handleInputChange('site_zip', e.target.value)}
                            />
                            <InputTopLabel
                                label={lang('common.phone')}
                                placeholder={lang('placeholders.your_company_phone')}
                                info={lang('placeholders.your_company_phone')}
                                value={formData.site_phone}
                                onChange={(e) => handleInputChange('site_phone', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <Footer />
            </PerfectScrollbar>
        </div>
    )
}

export default SettingGeneralForm