import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import PageHeaderDate from '@/components/shared/pageHeader/PageHeaderDate'
import AllProjects from '@/components/admin/dashboard/AllProjects'
import AllUsers from '@/components/admin/dashboard/AllUsers'
import AllInverters from '@/components/admin/dashboard/AllInverters'
import AllContracts from '@/components/admin/dashboard/AllContracts'
import AllLeaseRequest from '@/components/admin/dashboard/AllLeaseRequest'
import AllInvestor from '@/components/admin/dashboard/AllInvestor'
import AllReports from '@/components/admin/dashboard/AllReports'
import Remainders from '@/components/widgetsTables/Remainders'
import GoalMiscellaneous from '@/components/widgetsMiscellaneous/GoalMiscellaneous'
import VisitorsOverviewChart from '@/components/widgetsCharts/VisitorsOverviewChart'
import SocialMediaStatisticsChart from '@/components/widgetsCharts/SocialMediaStatisticsChart'
import MarketingChart from '@/components/widgetsCharts/MarketingChart'
import Footer from '@/components/shared/Footer'
import StatsCardOverview from '@/components/admin/dashboard/StatsCardOverview'
import SolarPlantOverviewCard from '@/components/admin/dashboard/SolarPlantOverviewCard'


const page = () => {
    return (
        <>
            <PageHeader >
                <PageHeaderDate />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <SolarPlantOverviewCard />
                    <StatsCardOverview />
                    <VisitorsOverviewChart />
                    {/* <Browser /> */}
                    <AllProjects />
                    <AllUsers />
                    <AllInverters />
                    <AllContracts />
                    <AllLeaseRequest />
                    <AllInvestor />
                    <AllReports />
                    {/* <SiteOverviewChart /> */}
                    <GoalMiscellaneous />
                    <MarketingChart />
                    {/* <Remainders title={"Project Remainders"} /> */}
                    {/* <SocialMediaStatisticsChart /> */}
                </div>
            </div>
            <Footer />
        </>
    )
}

export default page