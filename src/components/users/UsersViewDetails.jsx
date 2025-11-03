'use client'
import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { apiGet } from '@/lib/api'
import { FiMail, FiPhone, FiMapPin, FiCalendar, FiEdit3, FiUser, FiShield, FiActivity } from 'react-icons/fi'
import Link from 'next/link'
import Swal from 'sweetalert2'
import { useLanguage } from '@/contexts/LanguageContext'

// Role mapping (labels referenced by key + fallback so translations can be used)
const roleMapping = {
  1: { labelKey: 'roles.superAdmin', fallback: 'Super Admin', color: 'danger', icon: <FiShield /> },
  2: { labelKey: 'roles.admin', fallback: 'Admin', color: 'warning', icon: <FiUser /> },
  3: { labelKey: 'roles.user', fallback: 'User', color: 'primary', icon: <FiUser /> },
  4: { labelKey: 'roles.moderator', fallback: 'Moderator', color: 'info', icon: <FiUser /> }
}

// Status mapping (use translation keys with fallbacks)
const statusMapping = {
  0: { labelKey: 'common.inactive', fallback: 'Inactive', color: 'danger' },
  1: { labelKey: 'common.active', fallback: 'Active', color: 'success' },
  2: { labelKey: 'usersView.suspended', fallback: 'Suspended', color: 'warning' },
  3: { labelKey: 'usersView.banned', fallback: 'Banned', color: 'dark' }
}

const LoadingSpinner = ({ label = 'Loading...' }) => (
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">{label}</span>
    </div>
  </div>
)

const UsersViewDetails = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const userId = searchParams.get('id')
  const { lang } = useLanguage()

  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchUser()
    } else {
      router.push('/admin/users')
    }
  }, [userId])

  // When user fetched, fetch role if available
  useEffect(() => {
    if (user && (user.userRole || user.role?.id)) {
      fetchUserRole()
    }
  }, [user])

  const fetchUser = async () => {
    try {
      setLoading(true)
      const response = await apiGet(`/api/users/${userId}`)

      if (response.success) {
        setUser(response.data)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to fetch user details'
      }).then(() => {
        router.push('/admin/users/list')
      })
    } finally {
      setLoading(false)
    }
  }


  const fetchUserRole = async () => {
    try {
      const response = await apiGet(`/api/roles/${user.userRole}`)
      if (response.success) {
        setUserRole(response.data)
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
    return null
  }

  // Commented out - using global loader instead
  // if (loading) {
  //   return <LoadingSpinner label={lang('common.loading', 'Loading...')} />
  // }

  if (!user) {
    return (
      <div className="text-center py-5">
        <h4>{lang('messages.dataNotFound', 'User not found')}</h4>
        <Link href="/admin/users/list" className="btn btn-primary mt-3">
          {`${lang('common.back', 'Back')} ${lang('navigation.users', 'Users')}`}
        </Link>
      </div>
    )
  }
  const role = userRole?.name
  const status = statusMapping[user.status] || { labelKey: 'misc.unknown', fallback: 'Unknown', color: 'secondary' }
  const fullName = `${user.fullName}`
  const initials = `${user.fullName?.charAt(0) || ''}`

  return (
    <div className="row">
      {/* User Profile Card */}
      <div className="col-xxl-4 col-xl-5">
        <div className="card stretch stretch-full">
          <div className="card-body">
            <div className="text-center">
              <div className="text-white avatar-text user-avatar-text avatar-xl mx-auto mb-3">
                {initials}
              </div>
              <div>
                <h5 className="mb-1">{fullName}</h5>
                <p className="fs-12 fw-normal text-muted mb-3">{user.email}</p>
                <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
                  <div className="d-flex align-items-center gap-1">
                    <FiUser size={14} />
                    {userRole?.name}
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <FiActivity size={14} />
                    <span className={`badge bg-soft-${status.color} text-${status.color}`}>
                      {lang(status.labelKey || 'misc.unknown', status.fallback || 'Unknown')}
                    </span>
                  </div>
                </div>
                <div className="d-flex gap-2 justify-content-center">
                  <Link
                    href={`/admin/users/edit?id=${user.id}`}
                    className="btn btn-primary btn-sm"
                  >
                    <FiEdit3 size={14} className="me-1" />
                    {`${lang('common.edit', 'Edit')} ${lang('common.user', 'User')}`}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Details */}
      <div className="col-xxl-8 col-xl-7">
        <div className="card stretch stretch-full">
          <div className="card-header">
            <h6 className="card-title">{lang('usersView.userInformation', 'User Information')}</h6>
          </div>
          <div className="card-body">
            <div className="row g-4">
              {/* Personal Information */}
              <div className="col-lg-6">
                <div className="border rounded p-3">
                  <h6 className="fw-bold mb-3">{lang('usersView.personalInformation', 'Personal Information')}</h6>
                  <div className="vstack gap-2">
                    <div className="hstack justify-content-between">
                      <span className="text-muted">{lang('usersView.fullName', 'Full Name')}:</span>
                      <span className="fw-semibold">{user.fullName}</span>
                    </div>
                    </div>
                    <div className="hstack justify-content-between">
                      <span className="text-muted">{lang('common.email', 'Email')}:</span>
                      <span className="fw-semibold">
                        <a href={`mailto:${user.email}`} className="text-decoration-none">
                          {user.email}
                        </a>
                      </span>
                    </div>
                    <div className="hstack justify-content-between">
                      <span className="text-muted">{lang('common.phone', 'Phone')}:</span>
                      <span className="fw-semibold">
                        {user.phoneNumber ? (
                          <a href={`tel:${user.phoneNumber}`} className="text-decoration-none">
                            {user.phoneNumber}
                          </a>
                        ) : (
                          <span className="text-muted">{lang('usersView.notProvided', 'Not provided')}</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="col-lg-6">
                <div className="border rounded p-3">
                  <h6 className="fw-bold mb-3">{lang('usersView.accountInformation', 'Account Information')}</h6>
                  <div className="vstack gap-2">
                    <div className="hstack justify-content-between">
                      <span className="text-muted">{lang('usersView.username', 'Username')}:</span>
                      <span className="fw-semibold">{user.username}</span>
                    </div>
                    <div className="hstack justify-content-between">
                      <span className="text-muted">{lang('usersView.role', 'Role')}:</span>
                      <span>
                        {/* {lang(role.labelKey, role.fallback)} */}
                        {userRole?.name}
                      </span>
                    </div>
                    <div className="hstack justify-content-between">
                      <span className="text-muted">{lang('common.status', 'Status')}:</span>
                      <span className={`badge bg-soft-${status.color} text-${status.color}`}>
                        {lang(status.labelKey, status.fallback)}
                      </span>
                    </div>
                    <div className="hstack justify-content-between">
                      <span className="text-muted">{lang('usersView.created', 'Created')}:</span>
                      <span className="fw-semibold">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              {(user.address1 || user.city || user.state || user.country) && (
                console.log("test", user),
                <div className="col-lg-12">
                  <div className="border rounded p-3 bg-white shadow-sm">
                    <h6 className="fw-bold mb-3 d-flex align-items-center">
                      <FiMapPin className="me-2 text-primary" />
                      {lang('usersView.addressInformation', 'Address Information')}
                    </h6>

                    <div className="row gy-2 gx-4">
                      {user.address1 && (
                        <div className="col-md-6">
                          <div>
                            <span className="text-muted d-block small">
                              {lang('usersView.address1', 'Address 1')}
                            </span>
                            <span className="fw-semibold">{user.address1}</span>
                          </div>
                        </div>
                      )}

                      {user.address2 && (
                        <div className="col-md-6">
                          <div>
                            <span className="text-muted d-block small">
                              {lang('usersView.address2', 'Address 2')}
                            </span>
                            <span className="fw-semibold">{user.address2}</span>
                          </div>
                        </div>
                      )}

                      {user.city && (
                        <div className="col-md-3 col-sm-6">
                          <div>
                            <span className="text-muted d-block small">
                              {lang('common.city', 'City')}
                            </span>
                            <span className="fw-semibold">{user.city.name}</span>
                          </div>
                        </div>
                      )}

                      {user.state && (
                        <div className="col-md-3 col-sm-6">
                          <div>
                            <span className="text-muted d-block small">
                              {lang('common.state', 'State')}
                            </span>
                            <span className="fw-semibold">{user.state.name}</span>
                          </div>
                        </div>
                      )}

                      {user.country && (
                        <div className="col-md-3 col-sm-6">
                          <div>
                            <span className="text-muted d-block small">
                              {lang('common.country', 'Country')}
                            </span>
                            <span className="fw-semibold">{user.country.name}</span>
                          </div>
                        </div>
                      )}

                      {user.zipcode && (
                        <div className="col-md-3 col-sm-6">
                          <div>
                            <span className="text-muted d-block small">
                              {lang('common.zip', 'Zip Code')}
                            </span>
                            <span className="fw-semibold">{user.zipcode}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>


              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UsersViewDetails