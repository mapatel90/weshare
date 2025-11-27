'use client'
import React, { useState } from 'react'
import TabProjectBasicDetails from './TabProjectBasicDetails'

const ProjectCreateContent = () => {
    const [error, setError] = useState(false);

    const [formData, setFormData] = useState({
        projectType: "",
        projectManage: "",
        project_name: '',
        project_type: '',
        offtaker: '',
        address1: '',
        address2: '',
        countryId: '',
        stateId: '',
        cityId: '',
        zipcode: '',
        asking_price: '',
        lease_term: '',
        product_code: '',
        project_description: '',
        project_size: '',
        project_close_date: '',
        project_location: '',
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