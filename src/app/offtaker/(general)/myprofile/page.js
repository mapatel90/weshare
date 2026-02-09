"use client"
import React from 'react'
import DynamicTitle from '@/components/common/DynamicTitle'
import MyProfile from '@/components/portal/myprofile/MyProfile'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="page_title.profile" />
            <div className='row'>
              <MyProfile />
            </div>
        </>
    )
}

export default page