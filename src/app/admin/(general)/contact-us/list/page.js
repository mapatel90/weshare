"use client";
import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import Footer from '@/components/shared/Footer'
import ContactUsTable from '@/components/admin/contact_us/ContactUsTable'
import DynamicTitle from '@/components/common/DynamicTitle'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="contactUs.contactUs" />
            <PageHeader>
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <ContactUsTable />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default page