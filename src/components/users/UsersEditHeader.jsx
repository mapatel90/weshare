import React from 'react'
import Link from 'next/link'
import { FiArrowLeft } from 'react-icons/fi'
import { Button } from '@mui/material'

const UsersEditHeader = () => {
  return (
    <div className="page-header">
      {/* <div className="page-header-left d-flex align-items-center">
        <div className="page-header-title">
          <h5 className="m-b-10">Edit User</h5>
        </div>
        <ul className="breadcrumb">
          <li className="breadcrumb-item"><Link href="/admin">Dashboard</Link></li>
          <li className="breadcrumb-item"><Link href="/admin/users/list">Users</Link></li>
          <li className="breadcrumb-item">Edit</li>
        </ul>
      </div> */}
      <div className="page-header-right ms-auto">
        <div className="page-header-right-items">
          <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
            {/* <Link href="/admin/users/list" className="btn btn-light">
              <FiArrowLeft size={16} className="me-2" />
              Back to Users
            </Link> */}
            <Button
              component={Link}
              href="/admin/users/list"
              variant="contained"
              className="common-orange-color"
              startIcon={<FiArrowLeft size={16} />}
            >
              Back to Users
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UsersEditHeader