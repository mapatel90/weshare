import SettingsMiscellaneousForm from '@/components/admin/setting/settingsMiscellaneousForm'
import React from 'react'
import DynamicTitle from '@/components/common/DynamicTitle'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="settings.title" />
            <SettingsMiscellaneousForm />
        </>
    )
}

export default page