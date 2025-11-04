import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import Footer from '@/components/shared/Footer'
import NewsHeader from '@/components/news/NewsHeader'
import NewsTable from '@/components/news/NewsTable'

const page = () => {
    return (
        <>
            <PageHeader>
                <NewsHeader />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <NewsTable />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default page