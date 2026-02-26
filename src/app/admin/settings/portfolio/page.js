import React from 'react'
import DynamicTitle from '@/components/common/DynamicTitle'
import SettingPortfolio from '@/components/admin/setting/settingPortfolio'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="settings.title" />
            <SettingPortfolio />
        </>
    )
}

export default page