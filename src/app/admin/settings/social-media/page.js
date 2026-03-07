"use client";

import React from 'react'
import DynamicTitle from '@/components/common/DynamicTitle'
import SettingsSocialMediaForm from '@/components/admin/setting/SettingsSocialMediaForm';

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="settings.socialMediaSettings" />
            <SettingsSocialMediaForm />
        </>
    )
}

export default page