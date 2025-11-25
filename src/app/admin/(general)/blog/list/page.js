import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import Footer from '@/components/shared/Footer'
import BlogHeader from '@/components/admin/blog/BlogHeader'
import BlogTable from '@/components/admin/blog/BlogTable'
import DynamicTitle from '@/components/common/DynamicTitle'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="blog.blog" />
            <PageHeader>
                <BlogHeader />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <BlogTable />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default page