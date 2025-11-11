import SettingGeneralForm from '@/components/setting/settingGeneralForm'
import React from 'react'
import DynamicTitle from '@/components/common/DynamicTitle'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="settings.title" />
            <SettingGeneralForm />
        </>
    )
}

export default page