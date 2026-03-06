"use client"
import React from 'react'
import DynamicTitle from '@/components/common/DynamicTitle'
import MeterReadings from '@/components/portal/meter_readings/Meter_readings'

const page = () => {
    return (
        <>
            <DynamicTitle titleKey="page_title.meterreadings" />
            <div className='row'>
              <MeterReadings />
            </div>
        </>
    )
}

export default page