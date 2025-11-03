'use client'
import React, { useContext } from 'react'
import { FiAlignLeft, FiSave, FiPlus } from 'react-icons/fi'
import topTost from '@/utils/topTost'
import { SettingSidebarContext } from '@/contentApi/settingSideBarProvider'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from "@mui/material"

const RoleHeaderSetting = ({ onAddRole, isSubmitting = false }) => {
    const { lang } = useLanguage()
    const x = useContext(SettingSidebarContext)

    return (
        <div className="content-area-header bg-white sticky-top">
            <div className="page-header-left">
                <a href="#" className="app-sidebar-open-trigger me-2" onClick={() => x.setSidebarOpen(true)}>
                    <FiAlignLeft className='fs-24' />
                </a>
            </div>
            <div className="page-header-right ms-auto">
                <div className="d-flex align-items-center gap-3 page-header-right-items-wrapper">
                    {/* <button 
                        type="button"
                        className="btn btn-primary"
                        onClick={onAddRole}
                        disabled={isSubmitting}
                    >
                        <FiPlus size={16} className='me-2' />
                        {lang('roles.addRole')}
                    </button> */}
                    <Button 
                        variant="primary"
                        className="common-orange-color"
                        onClick={onAddRole}
                        disabled={isSubmitting}
                    >
                        <FiPlus size={16} className='me-2' />
                        {lang('roles.addRole')}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default RoleHeaderSetting