'use client'
import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import PageHeaderDate from '@/components/shared/pageHeader/PageHeaderDate'
import AllProjects from '@/components/admin/dashboard/AllProjects'
import AllUsers from '@/components/admin/dashboard/AllUsers'
import AllInvestor from '@/components/admin/dashboard/AllInvestor'
import AllReports from '@/components/admin/dashboard/AllReports'
import Footer from '@/components/shared/Footer'
import StatsCardOverview from '@/components/admin/dashboard/StatsCardOverview'
import SolarPlantOverviewCard from '@/components/admin/dashboard/SolarPlantOverviewCard'
import usePermissions from '@/hooks/usePermissions'

const page = () => {
    const { canView } = usePermissions();
    const showActionColumn = canView("dashboards") || canView("projects") || canView("users") || canView("investors") || canView("reports");

    return (
        <>
            <PageHeader >
                <PageHeaderDate />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    {canView("dashboards") && (
                        <SolarPlantOverviewCard />
                    )}
                    {canView("dashboards") && (
                        <StatsCardOverview />
                    )}
                    {canView("projects") && (
                        <AllProjects />
                    )}
                    {canView("users") && (
                        <AllUsers />
                    )}
                    {canView("investors") && (
                        <AllInvestor />
                    )}
                    {canView("reports") && (
                        <AllReports />
                    )}
                </div>
            </div>
            <Footer />
        </>
    )
}

export default page