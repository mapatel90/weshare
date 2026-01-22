"use client"
import React from 'react'
import DynamicTitle from '@/components/common/DynamicTitle'
import Notification from '@/components/portal/notifications/Notification'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="notification.title" />
            <div className='row'>
              <Notification />
            </div>
        </>
    )
}

export default page