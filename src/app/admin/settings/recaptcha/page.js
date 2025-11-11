import SettingsRecaptchaForm from '@/components/setting/settingsRecaptchaForm'
import React from 'react'
import DynamicTitle from '@/components/common/DynamicTitle'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="settings.title" />
            <SettingsRecaptchaForm />
        </>
    )
}

export default page