"use client"

import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import ProfilePage from '@/components/admin/users/ProfilePage'
import DynamicTitle from '@/components/common/DynamicTitle'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="page_title.profile" />
            <PageHeader>
            {/* <ChangePasswordHeader /> */}
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <ProfilePage />
                </div>
            </div>
        </>
    )
}

export default page
