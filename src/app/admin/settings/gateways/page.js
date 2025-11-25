import SettingsGatewaysForm from '@/components/admin/setting/settingsGatewaysForm'
import React from 'react'
import DynamicTitle from '@/components/common/DynamicTitle'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="settings.title" />
            <SettingsGatewaysForm />
        </>
    )
}

export default page