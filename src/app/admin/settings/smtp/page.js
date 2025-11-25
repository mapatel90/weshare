import SettingsEmailForm from '@/components/admin/setting/settingsEmailForm'
import React from 'react'
import DynamicTitle from '@/components/common/DynamicTitle'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="settings.title" />
            <SettingsEmailForm />
        </>
    )
}

export default page