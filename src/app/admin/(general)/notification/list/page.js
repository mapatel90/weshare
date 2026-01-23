"use client"
import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import Footer from '@/components/shared/Footer'
import DynamicTitle from '@/components/common/DynamicTitle'
import NotificationTable from '@/components/admin/notification/NotificationTable'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="notification.title" />
            <PageHeader>
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <NotificationTable />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default page