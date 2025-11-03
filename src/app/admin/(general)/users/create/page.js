'use client'
import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import UsersCreateHeader from '@/components/users/UsersCreateHeader'
import UsersCreateForm from '@/components/users/UsersCreateForm'

const page = () => {
  return (
    <>
      <PageHeader>
        <UsersCreateHeader />
      </PageHeader>
      <div className='main-content'>
        <div className='row'>
          <UsersCreateForm />
          {/* <div className="col-xxl-12">
            <div className="card stretch stretch-full">
              <div className="card-header">
                <h5 className="card-title">Create New User</h5>
              </div>
              <div className="card-body">
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </>
  )
}

export default page