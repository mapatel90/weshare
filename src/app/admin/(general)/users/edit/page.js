'use client'
import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import UsersEditHeader from '@/components/admin/users/UsersEditHeader'
import UsersEditForm from '@/components/admin/users/UsersEditForm'
import { usePageTitle } from '@/contexts/PageTitleContext';

const page = () => {

  usePageTitle('page_title.editUser');
  
  return (
    <>
      <PageHeader>
        <UsersEditHeader />
      </PageHeader>
      <div className='main-content'>
        <div className='row'>
          <div className="col-xxl-12">
            <UsersEditForm />
            {/* <div className="card stretch stretch-full">
              <div className="card-header">
                <h5 className="card-title">Edit User</h5>
              </div>
              <div className="card-body">
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </>
  )
}

export default page