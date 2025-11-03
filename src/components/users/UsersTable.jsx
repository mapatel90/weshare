'use client'
import React, { memo, useEffect, useState } from 'react'
import Table from '@/components/shared/table/Table'
import { FiEdit3, FiEye, FiTrash2, FiMoreHorizontal, FiMail, FiPhone } from 'react-icons/fi'
import Dropdown from '@/components/shared/Dropdown'
import Link from 'next/link'
import { apiGet, apiDelete } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import { useLanguage } from '@/contexts/LanguageContext'

// Role mapping
const roleMapping = {
  1: { label: 'Super Admin', color: 'danger' },
  2: { label: 'Admin', color: 'warning' },
  3: { label: 'User', color: 'primary' },
  4: { label: 'Moderator', color: 'info' }
}

// Status mapping
const statusMapping = {
  0: { label: 'Inactive', color: 'danger' },
  1: { label: 'Active', color: 'success' }
}

const LoadingSpinner = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
)

const UsersTable = () => {
  const { lang } = useLanguage();
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: ''
  })
  const router = useRouter()

  // Fetch users
  const fetchUsers = async (page = 1, search = '', role = '', status = '') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(role && { role }),
        ...(status !== '' && { status })
      })

      const response = await apiGet(`/api/users?${params.toString()}`)

      if (response.success) {
        console.log("All User::", response.data.users)
        setUsers(response.data.users)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to fetch users'
      })
    } finally {
      setLoading(false)
    }
  }

  // Delete user
  const handleDeleteUser = async (userId, userName) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `You are about to delete user "${userName}". This action cannot be undone!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      })

      if (result.isConfirmed) {
        setLoading(true)
        await apiDelete(`/api/users/${userId}`)

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'User has been deleted successfully.',
          timer: 2000,
          showConfirmButton: false
        })

        // Refresh the table
        await fetchUsers(pagination.page, filters.search, filters.role, filters.status)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to delete user'
      })
    } finally {
      setLoading(false)
    }
  }

  // Load users on component mount
  useEffect(() => {
    fetchUsers()
  }, [])

  // Search handler
  const handleSearch = (searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm }))
    fetchUsers(1, searchTerm, filters.role, filters.status)
  }

  // Filter handlers
  const handleRoleFilter = (role) => {
    setFilters(prev => ({ ...prev, role }))
    fetchUsers(1, filters.search, role, filters.status)
  }

  const handleStatusFilter = (status) => {
    setFilters(prev => ({ ...prev, status }))
    fetchUsers(1, filters.search, filters.role, status)
  }

  // Pagination handler
  const handlePageChange = (page) => {
    fetchUsers(page, filters.search, filters.role, filters.status)
  }

  const columns = [
    // {
    //   accessorKey: 'id',
    //   header: ({ table }) => {
    //     const checkboxRef = React.useRef(null)

    //     useEffect(() => {
    //       if (checkboxRef.current) {
    //         checkboxRef.current.indeterminate = table.getIsSomeRowsSelected()
    //       }
    //     }, [table.getIsSomeRowsSelected()])
    //   },
    //   meta: {
    //     headerClassName: 'width-30'
    //   }
    // },
    {
      accessorKey: 'user',
      header: () => lang("common.user"),
      cell: ({ row }) => {
        const user = row.original
        const fullName = `${user.fullName}` || 'N/A'
        const initials = `${user.fullName?.charAt(0) || ''}`

        return (
          <div className="hstack gap-3">
            <div className="text-white avatar-text user-avatar-text avatar-md">
              {initials}
            </div>
            <div>
              <span className="text-truncate-1-line fw-bold">{fullName}</span>
              <div className="fs-12 text-muted">{user.email}</div>
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: 'username',
      header: () => lang("authentication.username"),
      cell: ({ row }) => (
        <span className='text-truncate-1-line fw-bold'>
          {row.original?.username || '-'}
        </span>
      )
    },
    {
      accessorKey: 'email',
      header: () => lang("authentication.email"),
      cell: ({ row }) => {
        const email = row.original?.email || '-'
        return email !== '-' ? (
          <a href={`mailto:${email}`} className="text-decoration-none">
            <FiMail size={14} className="me-2" />
            {email}
          </a>
        ) : (
          <span className="text-muted">-</span>
        )
      }
    },
    {
      accessorKey: 'phoneNumber',
      header: () => lang("common.phone"),
      cell: ({ row }) => {
        const phone = row.original?.phoneNumber || ''
        return phone ? (
          <a href={`tel:${phone}`} className="text-decoration-none">
            <FiPhone size={14} className="me-2" />
            {phone}
          </a>
        ) : (
          <span className="text-muted">-</span>
        )
      }
    },
    {
      accessorKey: 'userRole',
      header: () => lang("roles.role"),
      cell: ({ row }) => {
        const roleName = row.original?.role?.name || 'Unknown'
        const displayName = roleName.charAt(0).toUpperCase() + roleName.slice(1)
        return <span className='text-truncate-1-line fw-bold'>{displayName}</span>
      }
    },
    {
      accessorKey: 'status',
      header: () => lang("common.status"),
      cell: ({ row }) => {
        const status = statusMapping[row.original.status] || { label: 'Unknown', color: 'secondary' }
        return (
          <span className={`badge bg-soft-${status.color} text-${status.color}`}>
            {status.label}
          </span>
        )
      }
    },
    {
      accessorKey: 'actions',
      header: () => lang("table.actions"),
      cell: ({ row }) => {
        const user = row.original
        const actions = [
          {
            label: lang("common.edit"),
            icon: <FiEdit3 />,
            onClick: () => router.push(`/admin/users/edit?id=${user.id}`)
          },
          { type: 'divider' },
          {
            label: lang("common.delete"),
            icon: <FiTrash2 />,
            className: 'text-danger',
            onClick: () => handleDeleteUser(user.id, `${user?.fullName}`)
          }
        ]

        return (
          <div className="hstack gap-2 justify-content-end">
            <Link href={`/admin/users/view?id=${user.id}`} className="avatar-text avatar-md">
              <FiEye />
            </Link>
            <Dropdown
              dropdownItems={actions}
              triggerClass="avatar-md"
              triggerPosition="0,21"
              triggerIcon={<FiMoreHorizontal />}
            />
          </div>
        )
      },
      meta: {
        headerClassName: 'text-end'
      }
    }
  ]

  // Commented out - using global loader instead
  // if (loading && users.length === 0) {
  //   return <LoadingSpinner />
  // }

  return (
    <div>
      {/* Filters */}
      {/* <div className="card-header border-bottom">
        <div className="row align-items-center">
          <div className="col-md-6">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="d-flex gap-2 justify-content-end">
              <select
                className="form-select form-select-sm"
                style={{ width: 'auto' }}
                value={filters.role}
                onChange={(e) => handleRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="1">Super Admin</option>
                <option value="2">Admin</option>
                <option value="3">User</option>
                <option value="4">Moderator</option>
              </select>
              <select
                className="form-select form-select-sm"
                style={{ width: 'auto' }}
                value={filters.status}
                onChange={(e) => handleStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="0">Inactive</option>
                <option value="1">Active</option>
                <option value="2">Suspended</option>
                <option value="3">Banned</option>
              </select>
            </div>
          </div>
        </div>
      </div> */}

      {/* Table */}
      <div className="position-relative">
        {/* Commented out - using global loader instead */}
        {/* {loading && (
          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75" style={{ zIndex: 10 }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )} */}
        <Table data={users} columns={columns} />
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="card-footer">
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="dataTables_info">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
              </div>
            </div>
            <div className="col-md-6">
              <nav aria-label="Page navigation">
                <ul className="pagination justify-content-end mb-0">
                  <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </button>
                  </li>
                  {[...Array(pagination.pages)].map((_, index) => (
                    <li key={index} className={`page-item ${pagination.page === index + 1 ? 'active' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(index + 1)}
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${pagination.page === pagination.pages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersTable