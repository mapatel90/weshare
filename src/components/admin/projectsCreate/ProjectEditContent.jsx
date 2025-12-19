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
import { generateSlug, checkProjectNameExists } from '@/utils/projectUtils'
import { getFullImageUrl } from '@/utils/common'
import ProjectForm from './ProjectForm'
import MeterView from '../meter/MeterView'

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
        price_kwh: '',
        status: ''
    })
    const [projectTypes, setProjectTypes] = useState([])
    const [galleryImages, setGalleryImages] = useState([])
    const [queuedImages, setQueuedImages] = useState([])
    const [removedImageIds, setRemovedImageIds] = useState([])
    const steps = [
        { name: lang('projects.projectInformation', 'Project Information'), key: 'info' },
        { name: lang('meter.meter', 'Meter'), key: 'meter' },
        { name: lang('inverter.inverter', 'Inverter'), key: 'inverter' },
        { name: lang('home.exchangeHub.investor', 'Investor'), key: 'investor' },
        { name: lang('contract.contract', 'Contract'), key: 'contract' }
    ];
    const [activeTab, setActiveTab] = useState('info');

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
        if (!investor?.id) return
        setFormData(prev => ({
            ...prev,
            investorId: String(investor.id),
            investorName: investor.fullName || ''
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
                const typesRes = await apiGet('/api/project-types')
                if (typesRes?.success) setProjectTypes(typesRes.data)
                const res = await apiGet(`/api/projects/${projectId}`)
                if (res?.success && res.data) {
                    const p = res.data
                    console.log('Loaded project data:', p)
                    setFormData({
                        id: p.id, // ← added so ProjectForm's `formData?.id` is truthy
                        project_name: p.project_name || '',
                        project_slug: p.project_slug || '',
                        project_type_id: p.project_type_id || p.projectType?.id || '',
                        offtaker: String(p.offtaker_id || ''),
                        investorId: String(p.investor_id || p.investor?.id || ''),
                        investorName: p.investor?.fullName || '',
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
                        price_kwh: p.price_kwh !== undefined && p.price_kwh !== null ? String(p.price_kwh) : '',
                        solis_plant_id: p.solis_plant_id || '', // ← add Solis Plant ID into form
                        status: p.status === 1 ? 'active' : 'inactive'
                    })
                    if (p.countryId) handleCountryChange(p.countryId)
                    if (p.stateId) handleStateChange(p.stateId)
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

    const saveProject = async () => {
        const requiredFields = ['project_name', 'project_type_id', 'offtaker']
        const errors = {}
        requiredFields.forEach(field => { if (!formData[field]) { errors[field] = lang('validation.required', 'Required') } })

        // Check if project name already exists one more time before submit
        if (formData.project_name) {
            const nameExists = await checkProjectNameExists(formData.project_name, projectId)
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
            errors.asking_price = lang('projects.onlynumbers', 'Only numbers are allowed (e.g. 1234.56)')
        }
        if (formData.lease_term && !intRegex.test(String(formData.lease_term))) {
            errors.lease_term = lang('projects.onlynumbersWithoutdesimal', 'Only numbers are allowed (e.g. 123456)')
        }
        if (formData.project_size && !numberRegex.test(formData.project_size)) {
            errors.project_size = lang('projects.onlynumbers', 'Only numbers are allowed (e.g. 1234.56)')
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
                price_kwh: formData.price_kwh && formData.price_kwh !== '' ? parseFloat(formData.price_kwh) : null,
                solis_plant_id: formData.solis_plant_id || '', // ← include when updating
                status: formData.status === 'active' ? 1 : 0
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
            console.log('if');
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
                                offtakers={offtakers}
                                countries={countries}
                                states={states}
                                cities={cities}
                                loadingOfftakers={loadingOfftakers}
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
                            <Contract projectId={projectId} handleCloseForm={handleCloseForm} />
                        )}
                        {activeTab === 'meter' && (
                            <MeterView projectId={projectId} handleSaveAction={handleSaveAction} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProjectEditContent


