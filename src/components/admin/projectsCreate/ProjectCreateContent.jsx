'use client'
import React, { useState } from 'react'
import TabProjectBasicDetails from './TabProjectBasicDetails'

const ProjectCreateContent = () => {
    const [error, setError] = useState(false);

    const getNextYearDate = () => {
        const today = new Date();
        today.setFullYear(today.getFullYear() + 1);

        return today.toISOString().split("T")[0];
    };


    const [formData, setFormData] = useState({
        projectType: "",
        projectManage: "",
        project_name: '',
        project_type_id: '',
        offtaker_id: '',
        address_1: '',
        address_2: '',
        country_id: '',
        state_id: '',
        city_id: '',
        zipcode: '',
        asking_price: '',
        lease_term: '',
        product_code: '',
        project_description: '',
        project_size: '',
        project_close_date: getNextYearDate(),
        project_location: '',
        evn_price_kwh: '',
        weshare_price_kwh: '',
        project_status_id: '',
        payback_period: '',
        fund_progress: ''
    });

    return (
        <div className="col-lg-12">
            <div className="card border-top-0">
                <div className="card-body wizard" id="project-create-steps">
                    {/* Remove step tabs, show only the form */}
                    <TabProjectBasicDetails
                        setFormData={setFormData}
                        formData={formData}
                        error={error}
                        setError={setError}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProjectCreateContent;