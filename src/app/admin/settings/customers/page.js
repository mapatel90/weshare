import SettingsCustomersForm from '@/components/setting/settingsCustomersForm'
import React from 'react'
import DynamicTitle from '@/components/common/DynamicTitle'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="settings.title" />
            <SettingsCustomersForm />
        </>
    )
}

export default page