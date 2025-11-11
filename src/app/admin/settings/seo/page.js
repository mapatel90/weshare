import SettingSeoForm from '@/components/setting/settingSeoForm'
import React from 'react'
import DynamicTitle from '@/components/common/DynamicTitle'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="settings.title" />
            <SettingSeoForm />
        </>
    )
}

export default page