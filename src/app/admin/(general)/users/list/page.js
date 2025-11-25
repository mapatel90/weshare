'use client'
import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import UsersTable from '@/components/admin/users/UsersTable'
import UsersHeader from '@/components/admin/users/UsersHeader'
import Footer from '@/components/shared/Footer'
import DynamicTitle from '@/components/common/DynamicTitle'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="users.userlist" />
            <PageHeader>
                <UsersHeader />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <UsersTable />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default page