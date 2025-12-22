'use client'
import React, { useState } from 'react'
import TabProjectBasicDetails from './TabProjectBasicDetails'

const ProjectCreateContent = () => {
    const [error, setError] = useState(false);

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
        project_close_date: '',
        project_location: '',
        price_kwh: '',
        status: 'active'
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