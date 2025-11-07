import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import Footer from '@/components/shared/Footer'
import BlogHeader from '@/components/blog/BlogHeader'
import BlogTable from '@/components/blog/BlogTable'

const page = () => {
    return (
        <>
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