import SettingsLocalizationForm from '@/components/setting/settingsLocalizationForm'
import React from 'react'
import DynamicTitle from '@/components/common/DynamicTitle'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="settings.title" />
            <SettingsLocalizationForm />
        </>
    )
}

export default page