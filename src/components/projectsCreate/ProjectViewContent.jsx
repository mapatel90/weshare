'use client'
import React, { useEffect, useState } from 'react'
import { apiGet } from '@/lib/api'
import { useLanguage } from '@/contexts/LanguageContext'

const Field = ({ label, value }) => (
    <div className="mb-3">
        <div className="text-muted">{label}</div>
        <div className="fw-semibold">{value ?? '-'}</div>
    </div>
)

const ProjectViewContent = ({ projectId }) => {
    const { lang } = useLanguage()
    const [loading, setLoading] = useState(true)
    const [project, setProject] = useState(null)

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                const res = await apiGet(`/api/projects/${projectId}`)
                if (res?.success) setProject(res.data)
            } finally {
                setLoading(false)
            }
        }
        if (projectId) load()
    }, [projectId])

    // Commented out - using global loader instead
    // if (loading) {
    //     return <div className="col-lg-12"><div className="card"><div className="card-body">{lang('common.loading', 'Loading...')}</div></div></div>
    // }

    if (!project) {
        return <div className="col-lg-12"><div className="card"><div className="card-body">{lang('projects.notFound', 'Project not found')}</div></div></div>
    }

    return (
        <div className="col-lg-12">
            <div className="card">
                <div className="card-header">
                    <h6 className="card-title mb-0">{project.project_name}</h6>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6">
                            <Field label={lang('projects.projectName', 'Project Name')} value={project.project_name} />
                            <Field label={lang('projects.projectType', 'Project Type')} value={project.project_type} />
                            <Field label={lang('projects.selectOfftaker', 'Offtaker')} value={`${project.offtaker?.fullName ?? ''}`.trim()} />
                        </div>
                        <div className="col-md-6">
                            <Field label={lang('projects.status', 'Status')} value={project.status === 1 ? lang('projects.active', 'Active') : lang('projects.inactive', 'Inactive')} />
                            <Field label={lang('projects.investorProfit', 'Investor Profit')} value={project.investor_profit} />
                            <Field label={lang('projects.weshareprofite', 'Weshare profite')} value={project.weshare_profit} />
                        </div>
                    </div>
                    <hr />
                    <div className="row">
                        <div className="col-md-3"><Field label={lang('projects.country', 'Country')} value={project.country?.name} /></div>
                        <div className="col-md-3"><Field label={lang('projects.state', 'State')} value={project.state?.name} /></div>
                        <div className="col-md-3"><Field label={lang('projects.city', 'City')} value={project.city?.name} /></div>
                        <div className="col-md-3"><Field label={lang('projects.zipcode', 'Zip Code')} value={project.zipcode} /></div>
                    </div>
                    <div className="row">
                        <div className="col-md-6"><Field label={lang('projects.addressLine1', 'Address Line 1')} value={project.address1} /></div>
                        <div className="col-md-6"><Field label={lang('projects.addressLine2', 'Address Line 2')} value={project.address2} /></div>
                    </div>
                    <hr />
                    <div className="row">
                        <div className="col-md-6"><Field label={lang('common.createdAt', 'Created At')} value={project.createdAt ? new Date(project.createdAt).toLocaleString() : '-'} /></div>
                        <div className="col-md-6"><Field label={lang('common.updatedAt', 'Updated At')} value={project.updatedAt ? new Date(project.updatedAt).toLocaleString() : '-'} /></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProjectViewContent


