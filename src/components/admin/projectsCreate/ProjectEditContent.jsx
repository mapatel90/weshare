'use client'
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { apiGet, apiPut, apiUpload, apiDelete } from '@/lib/api'
import useLocationData from '@/hooks/useLocationData'
import useOfftakerData from '@/hooks/useOfftakerData'
import { showSuccessToast, showErrorToast } from '@/utils/topTost'
import { useLanguage } from '@/contexts/LanguageContext'
import InverterTab from './InverterTab'
import Investor from './Investor'
import Contract from '../contract/ContractTable'
import { generateSlug, checkProjectNameExists, check_project_solis_plant_id_exists } from '@/utils/projectUtils'
import { getFullImageUrl } from '@/utils/common'
import ProjectForm from './ProjectForm'
import MeterView from '../meter/MeterView'
import DocumentTab from './document/DocumentTab'
import { PROJECT_STATUS } from '@/constants/project_status'

const MAX_PROJECT_IMAGES = 10
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

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

    const [loading, setLoading] = useState({ form: false, init: true })
    const [error, setError] = useState({})
    const [checkingName, setCheckingName] = useState(false)
    const [formData, setFormData] = useState({
        project_name: '',
        project_slug: '',
        project_type_id: '',
        offtaker: '',
        investorId: '',
        investorName: '',
        address_1: '',
        address_2: '',
        country_id: '',
        state_id: '',
        city_id: '',
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
        evn_price_kwh: '',
        weshare_price_kwh: '',
        capex_per_kwp: '',
        project_status_id: '',
        payback_period: '',
        fund_progress: ''
    })
    const [projectTypes, setProjectTypes] = useState([])
    const [projectStatuses, setProjectStatuses] = useState([])
    const [loadingStatuses, setLoadingStatuses] = useState(false)
    const [galleryImages, setGalleryImages] = useState([])
    const [queuedImages, setQueuedImages] = useState([])
    const [removedImageIds, setRemovedImageIds] = useState([])
    const steps = [
        { name: lang('projects.projectInformation', 'Project Information'), key: 'info' },
        { name: lang('meter.meter', 'Meter'), key: 'meter' },
        { name: lang('inverter.inverter', 'Inverter'), key: 'inverter' },
        { name: lang('home.exchangeHub.investor', 'Investor'), key: 'investor' },
        { name: lang('contract.contract', 'Contract'), key: 'contract' },
        { name: lang('contract.document', 'Document'), key: 'document' }
    ];
    const [activeTab, setActiveTab] = useState('info');
    const [previousStatusId, setPreviousStatusId] = useState(null)

    const loadProjectGallery = useCallback(async (id) => {
        if (!id) return
        try {
            const res = await apiGet(`/api/projects/${id}/images`)
            if (res?.success) {
                const normalized = (res.data || []).map(img => ({
                    ...img,
                    url: getFullImageUrl(img.path)
                }))
                setGalleryImages(normalized)
            }
        } catch (err) {
            console.error('Failed to load project images', err)
        }
    }, [])

    const releasePreview = (file) => {
        if (file?.preview) {
            URL.revokeObjectURL(file.preview)
        }
    }

    const visibleGalleryImages = useMemo(() => {
        return galleryImages.filter(img => !removedImageIds.includes(img.id))
    }, [galleryImages, removedImageIds])

    const handleInvestorMarked = useCallback((investor) => {
        // Handle deletion case: investor?.id is null
        if (investor?.id === null) {
            setFormData(prev => ({
                ...prev,
                investorId: '',
                investorName: ''
            }))
            return
        }
        // Handle mark case
        if (!investor?.id) return
        setFormData(prev => ({
            ...prev,
            investorId: String(investor.user_id),
            investorName: investor.full_name || ''
        }))
    }, [])

    const handleDropImages = useCallback((acceptedFiles = [], rejectedFiles = []) => {
        rejectedFiles.forEach(reject => {
            reject.errors?.forEach(err => showErrorToast(err.message || lang('projects.imageRejected', 'Image rejected')))
        })

        const availableSlots = MAX_PROJECT_IMAGES - (visibleGalleryImages.length + queuedImages.length)
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
    }, [visibleGalleryImages, queuedImages, lang])

    // set default image handler (works for existing and queued)
    const handleSetDefaultImage = useCallback(async (id, source) => {
        if (source === 'queued') {
            setQueuedImages(prev => prev.map(item => ({ ...item, isDefault: item.id === id ? 1 : 0 })))
            return
        }

        // existing image: optimistic update + API call
        const prevGallery = galleryImages
        setGalleryImages(prev => prev.map(img => ({ ...img, default: img.id === id ? 1 : 0 })))
        try {
            // try to tell backend to mark this image default
            // endpoint name may vary; server should ideally support an endpoint like below.
            const res = await apiPut(`/api/projects/${projectId}/images/${id}/set-default`, {})
            if (!res?.success) throw new Error(res?.message || 'Failed to set default image')
        } catch (err) {
            // revert on failure
            setGalleryImages(prevGallery)
            showErrorToast(err.message || lang('projects.setDefaultFailed', 'Failed to set default image'))
        }
    }, [galleryImages, projectId, lang])

    const handleRemoveQueuedImage = useCallback((id) => {
        setQueuedImages(prev => {
            const target = prev.find(item => item.id === id)
            if (target) releasePreview(target)
            return prev.filter(item => item.id !== id)
        })
    }, [])

    const handleRemoveExistingImage = useCallback((id) => {
        setRemovedImageIds(prev => prev.includes(id) ? prev : [...prev, id])
    }, [])

    useEffect(() => {
        return () => {
            queuedImages.forEach(releasePreview)
        }
    }, [queuedImages])

    const uploadQueuedImages = async (id) => {
        if (!queuedImages.length || !id) return
        const formPayload = new FormData()
        queuedImages.forEach(item => formPayload.append('images', item.file))
        // include default index if user selected a queued image as default
        const defaultIndex = queuedImages.findIndex(i => i.isDefault === 1 || i.isDefault === true)
        if (defaultIndex >= 0) {
            formPayload.append('default_index', String(defaultIndex))
        }
        const res = await apiUpload(`/api/projects/${id}/images`, formPayload)
        if (!res?.success) {
            throw new Error(res?.message || lang('projects.imageUploadFailed', 'Failed to upload images'))
        }
        queuedImages.forEach(releasePreview)
        setQueuedImages([])
    }

    const removeMarkedImages = async (id) => {
        if (!removedImageIds.length || !id) return
        const responses = await Promise.all(removedImageIds.map(imageId => apiDelete(`/api/projects/${id}/images/${imageId}`)))
        const failed = responses.find(res => !res?.success)
        if (failed) {
            throw new Error(failed?.message || lang('projects.imageDeleteFailed', 'Failed to delete image'))
        }
        setRemovedImageIds([])
    }

    const syncProjectImages = async (id) => {
        if (!id) return
        if (!queuedImages.length && !removedImageIds.length) return
        await removeMarkedImages(id)
        await uploadQueuedImages(id)
        await loadProjectGallery(id)
    }

    // Load types and existing project
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(prev => ({ ...prev, init: true }))

                const [typesRes, statusRes] = await Promise.all([
                    apiGet('/api/project-types'),
                    apiGet('/api/projects/status')
                ])

                if (typesRes?.success) setProjectTypes(typesRes.data)
                if (statusRes?.success && Array.isArray(statusRes.data)) {
                    setProjectStatuses(statusRes.data)
                }

                const res = await apiGet(`/api/projects/${projectId}`)
                if (res?.success && res.data) {
                    const p = res.data
                    console.log('Loaded project data:', p)

                    // Try to get investor name from matched investor in interested_investors array
                    let investorName = '';
                    if (p.investor_id) {
                        if (Array.isArray(p.interested_investors)) {
                            const matchedInvestor = p.interested_investors.find(
                                inv => String(inv.user_id) === String(p.investor_id)
                            );
                            console.log('Matched investor:', matchedInvestor);
                            investorName = matchedInvestor ? matchedInvestor.full_name : '';
                        }
                    }

                    setFormData({
                        id: p.id, // ← added so ProjectForm's `formData?.id` is truthy
                        project_name: p.project_name || '',
                        project_slug: p.project_slug || '',
                        project_type_id: p.project_type_id || p.projectType?.id || '',
                        offtaker: String(p.offtaker_id || ''),
                        investorId: p.investor_id ? String(p.investor_id) : '',
                        investorName: investorName || '',
                        address_1: p.address_1 || '',
                        address_2: p.address_2 || '',
                        country_id: p.country_id || '',
                        state_id: p.state_id || '',
                        city_id: p.city_id || '',
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
                        evn_price_kwh: p.evn_price_kwh !== undefined && p.evn_price_kwh !== null ? String(p.evn_price_kwh) : '',
                        weshare_price_kwh: p.weshare_price_kwh !== undefined && p.weshare_price_kwh !== null ? String(p.weshare_price_kwh) : '',
                        capex_per_kwp: p.capex_per_kwp !== undefined && p.capex_per_kwp !== null ? String(p.capex_per_kwp) : '',
                        solis_plant_id: p.solis_plant_id || '', // ← add Solis Plant ID into form
                        project_status_id: p.project_status?.id || p.project_status_id || (statusRes?.data?.[0]?.id ?? ''),
                        payback_period: p.payback_period !== undefined && p.payback_period !== null ? String(p.payback_period) : '',
                        fund_progress: p.fund_progress !== undefined && p.fund_progress !== null ? String(p.fund_progress) : ''
                    })
                    setPreviousStatusId(p.project_status?.id || p.project_status_id || null)
                    if (p.country_id) handleCountryChange(p.country_id)
                    if (p.state_id) handleStateChange(p.state_id)
                }
                await loadProjectGallery(projectId)
            } catch (e) {
                console.error('Load project failed', e)
                showErrorToast(e.message || 'Failed to load project')
            } finally {
                setLoading(prev => ({ ...prev, init: false }))
            }
        }
        if (projectId) load()
    }, [projectId, loadProjectGallery])

    const handleInputChange = (e) => {
        const { name, value } = e.target

        // Auto-generate slug when project_name changes
        if (name === 'project_name') {
            const slug = generateSlug(value)
            setFormData(prev => ({ ...prev, [name]: value, project_slug: slug }))
        } else if (name === 'project_status_id') {
            const numericValue = value === '' ? '' : Number(value)

            // Frontend guard: prevent RUNNING (3) without investor & offtaker
            if (numericValue === PROJECT_STATUS.RUNNING) {
                if (!formData.offtaker) {
                    showErrorToast(
                        lang(
                            'projects.statusRequiresOfftaker',
                            'Project must be assigned to an offtaker before status to Running.'
                        )
                    )
                    // reset select back to previous value
                    setFormData(prev => ({
                        ...prev,
                        project_status_id: previousStatusId !== null ? previousStatusId : prev.project_status_id
                    }))
                    return false
                }
                if (!formData.investorId) {
                    showErrorToast(
                        lang(
                            'projects.statusRequiresInvestor',
                            'Project must be assigned to an investor before status to Running.'
                        )
                    )
                    setFormData(prev => ({
                        ...prev,
                        project_status_id: previousStatusId !== null ? previousStatusId : prev.project_status_id
                    }))
                    return false
                }
            } else {
                // when user selects a non-running status, remember it as previous
                setPreviousStatusId(numericValue)
            }

            setFormData(prev => ({ ...prev, project_status_id: numericValue }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }

        // live clear errors when valid
        setError(prev => {
            const next = { ...prev }
            if (name in next) {
                const numberRegex = /^[0-9]*\.?[0-9]*$/
                const intRegex = /^\d+$/
                let isValid = true
                if (name === 'investorProfit' || name === 'weshareprofite' || name === 'asking_price' || name === 'project_size') {
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

    // ✅ Check if project name already exists (onBlur) - exclude current project
    const handleProjectNameBlur = async () => {
        if (!formData.project_name || formData.project_name.trim() === '') return

        setCheckingName(true)
        try {
            const exists = await checkProjectNameExists(formData.project_name, projectId)
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

    const handleLocationChange = (type, value) => {
        if (type === 'country') {
            setFormData(prev => ({ ...prev, country_id: value, state_id: '', city_id: '' }))
            handleCountryChange(value)
        } else if (type === 'state') {
            setFormData(prev => ({ ...prev, state_id: value, city_id: '' }))
            handleStateChange(value)
        } else if (type === 'city') {
            setFormData(prev => ({ ...prev, city_id: value }))
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

    const saveProject = async () => {
        const requiredFields = ['project_name', 'project_type_id', 'offtaker']
        const errors = {}
        requiredFields.forEach(field => { if (!formData[field]) { errors[field] = lang('validation.required', 'Required') } })

        if (formData.project_status_id === '' || formData.project_status_id === null || formData.project_status_id === undefined) {
            errors.status = lang('validation.required', 'Required')
        }

        // Check if project name already exists one more time before submit
        if (formData.project_name) {
            const nameExists = await checkProjectNameExists(formData.project_name, projectId)
            if (nameExists) {
                errors.project_name = lang('projects.projectNameExists', 'Project name already exists')
            }
        }

        // Check if solis plant id already exists (exclude current project)
        if (formData.solis_plant_id) {
            const solisPlantIdExists = await check_project_solis_plant_id_exists(projectId, formData.solis_plant_id)
            if (solisPlantIdExists) {
                errors.solis_plant_id = lang('projects.solis_plant_id_exists', 'Solis Plant ID already exists')
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
            errors.asking_price = lang('projects.onlynumbers', 'Only numbers are allowed (e.g. 1234.56)')
        }
        if (formData.lease_term && !intRegex.test(String(formData.lease_term))) {
            errors.lease_term = lang('projects.onlynumbersWithoutdesimal', 'Only numbers are allowed (e.g. 123456)')
        }
        if (formData.project_size && !numberRegex.test(formData.project_size)) {
            errors.project_size = lang('projects.onlynumbers', 'Only numbers are allowed (e.g. 1234.56)')
        }
        // Validate payback_period (must be a positive integer)
        if (formData.payback_period && !intRegex.test(String(formData.payback_period))) {
            errors.payback_period = lang('projects.onlynumbersWithoutdesimal', 'Only numbers are allowed (e.g. 123456)')
        }
        // Validate fund_progress (must be a number between 0 and 100)
        if (formData.fund_progress) {
            if (!numberRegex.test(formData.fund_progress)) {
                errors.fund_progress = lang('projects.onlynumbers', 'Only numbers are allowed (e.g. 1234.56)')
            } else {
                const fundProgressValue = parseFloat(formData.fund_progress)
                if (isNaN(fundProgressValue) || fundProgressValue < 0 || fundProgressValue > 100) {
                    errors.fund_progress = lang('projects.fundProgressInvalid', 'Fund progress must be between 0 and 100')
                }
            }
        }
        if (Object.keys(errors).length) { setError(errors); return false }

        setLoading(prev => ({ ...prev, form: true }))
        try {
            await syncProjectImages(projectId)

            const payload = {
                name: formData.project_name,
                project_slug: formData.project_slug || generateSlug(formData.project_name),
                project_type_id: Number(formData.project_type_id),
                ...(formData.offtaker && { offtaker_id: Number(formData.offtaker) }),
                address_1: formData.address_1 || '',
                address_2: formData.address_2 || '',
                ...(formData.country_id && { country_id: Number(formData.country_id) }),
                ...(formData.state_id && { state_id: Number(formData.state_id) }),
                ...(formData.city_id && { city_id: Number(formData.city_id) }),
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
                evn_price_kwh: formData.evn_price_kwh && formData.evn_price_kwh !== '' ? parseFloat(formData.evn_price_kwh) : null,
                weshare_price_kwh: formData.weshare_price_kwh && formData.weshare_price_kwh !== '' ? parseFloat(formData.weshare_price_kwh) : null,
                capex_per_kwp: formData.capex_per_kwp && formData.capex_per_kwp !== '' ? parseFloat(formData.capex_per_kwp) : null,
                solis_plant_id: formData.solis_plant_id || '', // ← include when updating
                project_status_id: formData.project_status_id !== '' && formData.project_status_id !== undefined && formData.project_status_id !== null
                    ? Number(formData.project_status_id)
                    : (projectStatuses?.[0]?.id ?? 0),
                payback_period: formData.payback_period ? Number(formData.payback_period) : null,
                fund_progress: formData.fund_progress !== '' && formData.fund_progress !== undefined && formData.fund_progress !== null
                    ? parseFloat(formData.fund_progress)
                    : null
            }
            const res = await apiPut(`/api/projects/${projectId}`, payload)
            if (!res?.success) {
                throw new Error(res?.message || 'Update failed')
            }
            showSuccessToast(lang('projects.projectupdatedsuccessfully', 'Project updated successfully'))
            return true
        } catch (e) {
            console.error('Update project failed', e)
            showErrorToast(e.message || 'Failed to update project')
            return false
        } finally {
            setLoading(prev => ({ ...prev, form: false }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const success = await saveProject()
        if (success) {
            router.push('/admin/projects/list')
        }
    }

    const handleSaveAction = async (action) => {
        if (action === 'saveproject' || action === 'saveprojectNext') {
            const success = await saveProject()
            if (success) {
                if (action === 'saveproject') {
                    router.push('/admin/projects/list')
                } else if (action === 'saveprojectNext') {
                    const currentIndex = steps.findIndex(step => step.key === activeTab)
                    if (currentIndex < steps.length - 1) {
                        setActiveTab(steps[currentIndex + 1].key)
                    }
                }
            }
        } else {
            if (action === 'saveAndClose') {
                router.push('/admin/projects/list')
            } else if (action === 'saveNext') {
                const currentIndex = steps.findIndex(step => step.key === activeTab)
                if (currentIndex < steps.length - 1) {
                    setActiveTab(steps[currentIndex + 1].key)
                }
            }
        }
    }

    const handleCloseForm = async (action) => {
        router.push('/admin/projects/list')
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
                                handleSaveAction={handleSaveAction}
                                imageQueue={queuedImages}
                                existingImages={visibleGalleryImages}
                                onDropImages={handleDropImages}
                                onRemoveQueuedImage={handleRemoveQueuedImage}
                                onRemoveExistingImage={handleRemoveExistingImage}
                                onSetDefaultImage={handleSetDefaultImage}
                                maxProjectImages={MAX_PROJECT_IMAGES}
                                isImageSyncing={loading.form || loading.init}
                                lang={lang}
                            />
                        )}
                        {activeTab === 'inverter' && (
                            <InverterTab projectId={projectId} handleSaveAction={handleSaveAction} />
                        )}
                        {activeTab === 'investor' && (
                            <Investor projectId={projectId} onInvestorMarked={handleInvestorMarked} handleSaveAction={handleSaveAction} />
                        )}
                        {activeTab === 'contract' && (
                            <Contract projectId={projectId} handleCloseForm={handleCloseForm} handleSaveAction={handleSaveAction} />
                        )}
                        {activeTab === 'meter' && (
                            <MeterView projectId={projectId} handleSaveAction={handleSaveAction} />
                        )}
                        {activeTab === 'document' && (
                            <DocumentTab projectId={projectId} handleSaveAction={handleSaveAction} handleCloseForm={handleCloseForm} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProjectEditContent


