'use client'
import React, { useContext } from 'react'
import { FiAlignLeft, FiSave } from 'react-icons/fi'
import topTost from '@/utils/topTost'
import { SettingSidebarContext } from '@/contentApi/settingSideBarProvider'
import { useLanguage } from '@/contexts/LanguageContext'
// import { Button } from 'bootstrap/dist/js/bootstrap.bundle.min'
import { Button } from "@mui/material" 

const PageHeaderSetting = ({ onSave, isSubmitting = false, showSaveButton = true }) => {
    const { lang } = useLanguage()
    const x = useContext(SettingSidebarContext)
    
    const handleClick = (e) => {
        e.preventDefault()
        if (onSave) {
            onSave()
        } else {
            topTost()
        }
    };

    return (
        <div className="content-area-header bg-white sticky-top">
            <div className="page-header-left">
                <a href="#" className="app-sidebar-open-trigger me-2" onClick={() => x.setSidebarOpen(true)}>
                    <FiAlignLeft className='fs-24' />
                </a>
            </div>
            <div className="page-header-right ms-auto">
                <div className="d-flex align-items-center gap-3 page-header-right-items-wrapper">
                    {/* <a href="#" className="text-danger">Cancel</a> */}
                    {showSaveButton && (
                        // <button 
                        //     type="button" 
                        //     className="btn btn-primary" 
                        //     onClick={handleClick}
                        //     disabled={isSubmitting}
                        // >
                        //     {isSubmitting ? (
                        //         <>
                        //             <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        //             Saving...
                        //         </>
                        //     ) : (
                        //         <>
                        //             <FiSave size={16} className='me-2' />
                        //             <span>{lang('common.saveChanges')}</span>
                        //         </>
                        //     )}
                        // </button>
                        <Button
                            variant="primary"
                            className="common-orange-color"
                            onClick={handleClick}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FiSave size={16} className='me-2' />
                                    <span>{lang('common.saveChanges')}</span>
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>

    )
}

export default PageHeaderSetting