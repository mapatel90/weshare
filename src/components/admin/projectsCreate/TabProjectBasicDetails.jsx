import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { apiGet, apiPost, apiUpload, apiDelete } from '@/lib/api'
import useLocationData from '@/hooks/useLocationData'
import useOfftakerData from '@/hooks/useOfftakerData'
import { showSuccessToast, showErrorToast } from '@/utils/topTost'
import { useLanguage } from '@/contexts/LanguageContext'
import { generateSlug, checkProjectNameExists } from '@/utils/projectUtils'
import ProjectForm from './ProjectForm'
import { useAuth } from '@/contexts/AuthContext'
import { PROJECT_STATUS } from '@/constants/project_status'
const MAX_PROJECT_IMAGES = 10
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const TabProjectBasicDetails = ({ setFormData, formData, error, setError }) => {
    const router = useRouter()
    const { lang } = useLanguage()
    const { user } = useAuth()
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

    // keep only form loading flag (image upload removed)
    const [loading, setLoading] = useState({ form: false })
    const [projectTypes, setProjectTypes] = useState([])
    const [checkingName, setCheckingName] = useState(false)
    const [projectStatuses, setProjectStatuses] = useState([])
    const [loadingStatuses, setLoadingStatuses] = useState(false)
    const [queuedImages, setQueuedImages] = useState([])
    // simple tracker for last chosen status (even though RUNNING is hidden on create)
    const [previousStatusId, setPreviousStatusId] = useState(formData?.project_status_id ?? null)

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

    useEffect(() => {
        const loadStatuses = async () => {
            setLoadingStatuses(true)
            try {
                const res = await apiGet('/api/projects/status')
                if (res?.success && Array.isArray(res.data)) {
                    // Create form: hide RUNNING status so user only sees first 2 statuses
                    const filtered = res.data.filter(status => status.id !== PROJECT_STATUS.RUNNING)
                    setProjectStatuses(filtered)
                    setFormData(prev => {
                        if (prev.project_status_id !== undefined && prev.project_status_id !== null && prev.project_status_id !== '') {
                            setPreviousStatusId(prev.project_status_id)
                            return prev
                        }
                        const firstId = filtered?.[0]?.id
                        if (firstId) {
                            setPreviousStatusId(firstId)
                            return { ...prev, project_status_id: firstId }
                        }
                        return prev
                    })
                }
            } catch (err) {
                console.error('Failed to load project statuses:', err)
                showErrorToast(lang('projects.statusLoadFailed', 'Failed to load project statuses'))
            } finally {
                setLoadingStatuses(false)
            }
        }

        loadStatuses()
    }, [lang, setFormData])

    // Handle all input fields
    const handleInputChange = (e) => {
        const { name, value } = e.target

        if (name === 'project_name') {
            const slug = generateSlug(value)
            setFormData(prev => ({ ...prev, [name]: value, project_slug: slug }))
        } else if (name === 'project_status_id') {
            const numericValue = value === '' ? '' : Number(value)

            // On create we don't show RUNNING at all, so just remember the selected status
            if (numericValue !== '' && !Number.isNaN(numericValue)) {
                setPreviousStatusId(numericValue)
            }
            setFormData(prev => ({ ...prev, project_status_id: numericValue }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }

        setError(prev => {
            const next = { ...prev }
            if (name in next) {
                const numberRegex = /^[0-9]*\.?[0-9]*$/
                const intRegex = /^\d+$/
                let isValid = true
                if (name === 'investorProfit' || name === 'weshareprofite' || name === 'asking_price') {
                    isValid = value === '' || numberRegex.test(value)
                } else if (name === 'lease_term' || name === 'payback_period') {
                    isValid = value === '' || intRegex.test(value)
                } else if (name === 'fund_progress') {
                    // Fund progress must be a number between 0 and 100
                    if (value === '') {
                        isValid = true
                    } else if (numberRegex.test(value)) {
                        const numValue = parseFloat(value)
                        isValid = !isNaN(numValue) && numValue >= 0 && numValue <= 100
                    } else {
                        isValid = false
                    }
                } else if (name === 'project_status_id') {
                    isValid = value !== ''
                } else {
                    isValid = Boolean(value)
                }
                if (isValid) delete next[name]
            }
            return next
        })
    }

    // Check project name exists
    const handleProjectNameBlur = async () => {
        if (!formData.project_name || formData.project_name.trim() === '') return

        setCheckingName(true)
        try {
            const exists = await checkProjectNameExists(formData.project_name)
            if (exists) {
                setError(prev => ({
                    ...prev,
                    project_name: lang('projects.projectNameExists', 'Project name already exists')
                }))
            } else {
                setError(prev => {
                    const next = { ...prev }
                    delete next.project_name
                    return next
                })
            }
        } catch (err) {
            console.error('Error checking project name:', err)
        } finally {
            setCheckingName(false)
        }
    }

    // Location and offtaker handlers (unchanged)
    const handleLocationChange = (type, value) => {
        if (type === 'country') {
            setFormData(prev => ({
                ...prev,
                country_id: value,
                state_id: '',
                city_id: ''
            }))
            handleCountryChange(value)
        } else if (type === 'state') {
            setFormData(prev => ({
                ...prev,
                state_id: value,
                city_id: ''
            }))
            handleStateChange(value)
        } else if (type === 'city') {
            setFormData(prev => ({
                ...prev,
                city_id: value
            }))
        }
    }

    const handleOfftakerChange = async (e) => {
        const offtakerId = e.target.value
        setFormData(prev => ({ ...prev, offtaker_id: offtakerId }))

        // Clear offtaker error when value changes
        setError(prev => {
            const next = { ...prev }
            delete next.offtaker_id
            return next
        })

        if (offtakerId) {
            try {
                const offtaker = await fetchOfftakerById(offtakerId)
                setFormData(prev => ({
                    ...prev,
                    address_1: offtaker?.address_1 || '',
                    address_2: offtaker?.address_2 || '',
                    city_id: offtaker?.city_id || '',
                    state_id: offtaker?.state_id || '',
                    country_id: offtaker?.country_id || '',
                    zipcode: offtaker?.zipcode || ''
                }))
                if (offtaker?.country_id) {
                    handleCountryChange(offtaker.country_id)
                }
                if (offtaker?.state_id) {
                    handleStateChange(offtaker.state_id)
                }
            } catch (err) {
                console.error('Error fetching offtaker details:', err)
                setError(err?.message || 'Failed to load offtaker')
            }
        }
    }

    const releasePreview = (file) => {
        if (file?.preview) {
            URL.revokeObjectURL(file.preview)
        }
    }

    const handleDropImages = useCallback((acceptedFiles = [], rejectedFiles = []) => {
        if (!acceptedFiles.length && !rejectedFiles.length) return

        rejectedFiles.forEach(reject => {
            reject.errors?.forEach(err => {
                showErrorToast(err.message || lang('projects.imageRejected', 'Image rejected'))
            })
        })

        const availableSlots = MAX_PROJECT_IMAGES - queuedImages.length
        if (availableSlots <= 0) {
            showErrorToast(lang('projects.galleryLimitReached', 'Maximum gallery size reached'))
            return
        }

        const sanitized = []
        for (const file of acceptedFiles) {
            if (!file.type.startsWith('image/')) {
                showErrorToast(lang('projects.invalidImageType', 'Only image files are allowed'))
                continue
            }
            if (file.size > MAX_IMAGE_SIZE) {
                showErrorToast(lang('projects.imageTooLarge', 'Images must be smaller than 5MB'))
                continue
            }
            sanitized.push({
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                file,
                preview: URL.createObjectURL(file)
            })
            if (sanitized.length === availableSlots) break
        }

        if (sanitized.length) {
            setQueuedImages(prev => [...prev, ...sanitized])
        }
    }, [queuedImages, lang])

    // allow marking a queued image as default (create flow)
    const handleSetDefaultImage = useCallback((id, source) => {
        if (source === 'queued') {
            setQueuedImages(prev => prev.map(item => ({ ...item, isDefault: item.id === id ? 1 : 0 })))
        }
        // no-op for 'existing' during create (there are none)
    }, [])

    const handleRemoveQueuedImage = useCallback((id) => {
        setQueuedImages(prev => {
            const target = prev.find(item => item.id === id)
            if (target) releasePreview(target)
            return prev.filter(item => item.id !== id)
        })
    }, [])

    useEffect(() => {
        return () => {
            queuedImages.forEach(releasePreview)
        }
    }, [queuedImages])

    const uploadQueuedImages = async (projectId) => {
        if (!projectId || !queuedImages.length) return

        const formPayload = new FormData()
        queuedImages.forEach(item => {
            formPayload.append('images', item.file)
        })
        // if user selected a queued image as default, tell server which index (0-based) should be default
        const defaultIndex = queuedImages.findIndex(i => i.isDefault === 1 || i.isDefault === true)
        if (defaultIndex >= 0) {
            formPayload.append('default_index', String(defaultIndex))
        }

        const res = await apiUpload(`/api/projects/${projectId}/images`, formPayload)
        if (!res?.success) {
            throw new Error(res?.message || lang('projects.imageUploadFailed', 'Failed to upload images'))
        }

        queuedImages.forEach(releasePreview)
        setQueuedImages([])
    }

    const rollbackProjectCreation = async (projectId) => {
        if (!projectId) return
        try {
            await apiDelete(`/api/projects/${projectId}`)
        } catch (err) {
            console.error('Failed to rollback project creation after image upload error:', err)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        const requiredFields = ['project_name', 'project_type_id', 'product_code', 'offtaker_id', 'project_size', 'asking_price', 'lease_term', 'payback_period','project_location'];
        const errors = {};

        requiredFields.forEach(field => {
            if (!formData[field]) {
                errors[field] = lang('validation.required', 'Required');
            }
        });

        // Check if project name already exists one more time before submit
        if (formData.project_name) {
            const nameExists = await checkProjectNameExists(formData.project_name)
            if (nameExists) {
                errors.project_name = lang('projects.projectNameExists', 'Project name already exists')
            }
        }

        const numberRegex = /^[0-9]*\.?[0-9]*$/;
        const intRegex = /^\d+$/;

        if (formData.investorProfit && !numberRegex.test(formData.investorProfit)) {
            errors.investorProfit = lang('projects.onlynumbers', 'Only numbers are allowed (e.g. 1234.56)');
        }

        if (formData.weshareprofite && !numberRegex.test(formData.weshareprofite)) {
            errors.weshareprofite = lang('projects.onlynumbers', 'Only numbers are allowed (e.g. 1234.56)');
        }

        if (formData.asking_price && !numberRegex.test(formData.asking_price)) {
            errors.asking_price = lang('projects.onlynumbers', 'Only numbers are allowed (e.g. 1234.56)');
        }

        if (formData.lease_term && !intRegex.test(String(formData.lease_term))) {
            errors.lease_term = lang('projects.onlynumbersWithoutdesimal', 'Only numbers are allowed (e.g. 123456)');
        }

        if (formData.project_size && !numberRegex.test(formData.project_size)) {
            errors.project_size = lang('projects.onlynumbers', 'Only numbers are allowed (e.g. 1234.56)');
        }

        // Validate payback_period (must be a positive integer)
        if (formData.payback_period && !intRegex.test(String(formData.payback_period))) {
            errors.payback_period = lang('projects.onlynumbersWithoutdesimal', 'Only numbers are allowed (e.g. 123456)');
        }

        // Validate fund_progress (must be a number between 0 and 100)
        if (formData.fund_progress) {
            if (!numberRegex.test(formData.fund_progress)) {
                errors.fund_progress = lang('projects.onlynumbers', 'Only numbers are allowed (e.g. 1234.56)');
            } else {
                const fundProgressValue = parseFloat(formData.fund_progress);
                if (isNaN(fundProgressValue) || fundProgressValue < 0 || fundProgressValue > 100) {
                    errors.fund_progress = lang('projects.fundProgressInvalid', 'Fund progress must be between 0 and 100');
                }
            }
        }

        if (Object.keys(errors).length > 0) {
            setError(prev => ({ ...prev, ...errors }));
            return;
        }

        setLoading(prev => ({ ...prev, form: true }));

        let createdProjectId = null
        try {
            const projectData = {
                name: formData.project_name,
                project_slug: formData.project_slug || generateSlug(formData.project_name),
                project_type_id: Number(formData.project_type_id),
                ...(user?.id && { created_by: Number(user.id) }),
                ...(formData.offtaker_id && { offtaker_id: Number(formData.offtaker_id) }),
                address_1: formData.address_1 || '',
                address_2: formData.address_2 || '',
                ...(formData.country_id && { country_id: Number(formData.country_id) }),
                ...(formData.state_id && { state_id: Number(formData.state_id) }),
                ...(formData.city_id && { city_id: Number(formData.city_id) }),
                zipcode: formData.zipcode || '',
                project_manage: formData.projectManage || 'Project Manager',
                asking_price: formData.asking_price || '',
                lease_term: formData.lease_term ? Number(formData.lease_term) : null,
                product_code: formData.product_code || '',
                project_description: formData.project_description || '',
                investor_profit: formData.investorProfit || '0',
                weshare_profit: formData.weshareprofite || '0',
                // project_image not handled client-side anymore; keep value if present
                project_image: formData.project_image || '',
                project_size: formData.project_size || '',
                evn_price_kwh: formData.evn_price_kwh && formData.evn_price_kwh !== '' ? parseFloat(formData.evn_price_kwh) : null,
                weshare_price_kwh: formData.weshare_price_kwh && formData.weshare_price_kwh !== '' ? parseFloat(formData.weshare_price_kwh) : null,
                capex_per_kwp: formData.capex_per_kwp && formData.capex_per_kwp !== '' ? parseFloat(formData.capex_per_kwp) : null,
                project_close_date: formData.project_close_date || null,
                project_location: formData.project_location || '',
                project_status_id: formData.project_status_id !== '' && formData.project_status_id !== undefined && formData.project_status_id !== null
                    ? Number(formData.project_status_id)
                    : (projectStatuses?.[0]?.id ?? 1),
                payback_period: formData.payback_period ? Number(formData.payback_period) : null,
                fund_progress: formData.fund_progress !== '' && formData.fund_progress !== undefined && formData.fund_progress !== null
                    ? parseFloat(formData.fund_progress)
                    : null
            };

            // Submit to API
            const response = await apiPost('/api/projects/AddProject', projectData);


            if (!response?.success || !response?.data?.id) {
                throw new Error(response?.message || 'Failed to create project');
            }

            createdProjectId = response.data.id

            if (queuedImages.length) {
                try {
                    await uploadQueuedImages(createdProjectId)
                } catch (uploadError) {
                    await rollbackProjectCreation(createdProjectId)
                    throw uploadError
                }
            }

            showSuccessToast(lang('projects.projectcreatedsuccessfully', 'Project created successfully'))
            router.push('/admin/projects/list');
        } catch (error) {
            console.error('Error creating project:', error);
            showErrorToast(error.message || 'Failed to create project')
        } finally {
            setLoading(prev => ({ ...prev, form: false }));
        }
    }

    return (
        <ProjectForm
            formData={formData}
            error={error}
            loading={loading}
            checkingName={checkingName}
            projectTypes={projectTypes}
            projectStatuses={projectStatuses}
            offtakers={offtakers}
            countries={countries}
            states={states}
            cities={cities}
            loadingOfftakers={loadingOfftakers}
            loadingStatuses={loadingStatuses}
            loadingCountries={loadingCountries}
            loadingStates={loadingStates}
            loadingCities={loadingCities}
            handleInputChange={handleInputChange}
            handleProjectNameBlur={handleProjectNameBlur}
            handleOfftakerChange={handleOfftakerChange}
            handleLocationChange={handleLocationChange}
            handleSubmit={handleSubmit}
            imageQueue={queuedImages}
            existingImages={[]}
            onDropImages={handleDropImages}
            onRemoveQueuedImage={handleRemoveQueuedImage}
            onSetDefaultImage={handleSetDefaultImage}
            maxProjectImages={MAX_PROJECT_IMAGES}
            isImageSyncing={loading.form}
            lang={lang}
        />
    )
}

export default TabProjectBasicDetails
