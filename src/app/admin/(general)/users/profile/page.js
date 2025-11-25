"use client"

import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import ProfilePage from '@/components/admin/users/ProfilePage'

const page = () => {
    return (
        <>
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
