'use client'
import React, { memo, useEffect, useState } from 'react'
import Table from '@/components/shared/table/Table'
import { FiEdit3, FiEye, FiTrash2, FiMoreHorizontal, FiMail, FiPhone } from 'react-icons/fi'
import { BsQrCode } from 'react-icons/bs'
import Link from 'next/link'
import { apiGet, apiDelete } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button, Autocomplete, TextField } from '@mui/material'
import { buildUploadUrl } from '@/utils/common'
import usePermissions from '@/hooks/usePermissions'

const UsersTable = () => {
  const { lang } = useLanguage();
  const PAGE_SIZE = 50;
  const statusMapping = {
    0: { label: lang("common.inactive", "Inactive"), color: 'danger' },
    1: { label: lang("common.active", "Active"), color: 'success' }
  }
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 0
  })
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: ''
  })
  const [roles, setRoles] = useState([])
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedQRCode, setSelectedQRCode] = useState(null)
  const router = useRouter()
  const { canDelete, canEdit } = usePermissions();
  const showActionColumn = canEdit("users") || canDelete("users");

  // Fetch all roles for the filter dropdown
  const fetchRoles = async () => {
    try {
      const res = await apiGet('/api/roles?limit=100')
      if (res?.success && res?.data?.roles) {
        setRoles(res.data.roles)
      }
    } catch (e) {
      console.error('Error fetching roles:', e)
    }
  }

  // Fetch users
  const fetchUsers = async (page = 1, pageSize = PAGE_SIZE, search = '', role = '', status = '') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(search && { search }),
        ...(role && { role }),
        ...(status !== '' && { status })
      })

      const response = await apiGet(`/api/users?${params.toString()}`)

      if (response.success) {
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

  // Search change from Table component
  const handleSearchChange = (value) => {
    const newFilters = { ...filters, search: value }
    setFilters(newFilters)
    fetchUsers(1, pageSize, value, newFilters.role, newFilters.status)
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
        await fetchUsers(pagination.page, pageSize, filters.search, filters.role, filters.status)
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

  // Load users and roles on component mount
  useEffect(() => {
    fetchUsers(1, pageSize)
    fetchRoles()
  }, [])

  // Pagination handler (for Table component)
  const handlePaginationChange = (nextPagination) => {
    const newPage = nextPagination.pageIndex + 1 // Convert 0-based to 1-based
    const newPageSize = nextPagination.pageSize
    setPageSize(newPageSize)
    fetchUsers(newPage, newPageSize, filters.search, filters.role, filters.status)
  }

  // QR Code handler
  const handleShowQRCode = (qrCode, userName) => {
    if (!qrCode) {
      Swal.fire({
        icon: 'warning',
        title: 'QR Code Not Found',
        text: `QR code is not available for ${userName}`
      })
      return
    }
    setSelectedQRCode({ qrCode, userName })
    setShowQRModal(true)
  }

  const columns = [
    {
      accessorKey: 'user',
      header: () => lang("common.user"),
      cell: ({ row }) => {
        const user = row.original
        const fullName = `${user.full_name}` || 'N/A'
        const initials = `${user.full_name?.charAt(0) || ''}`

        return (
          <>
            <div className="hstack gap-3">
              <div className="text-white avatar-text user-avatar-text avatar-md">
                {initials}
              </div>
              <div>
                <span className="text-truncate-1-line fw-bold">{fullName}</span>
                <div className="fs-12 text-muted">{user.email}</div>
              </div>
              {/* <br /> */}
            </div>
            <div className="d-flex flex-column">
              <div className="d-flex gap-2 mt-1">
                <Link href={`/admin/users/edit?id=${user.id}`} rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 d-flex align-items-center gap-1 small" style={{ textDecoration: "none", color: "#17c666" }}>
                  <FiEdit3 />
                  {lang("common.edit", "Edit")}
                </Link>
                <span className="text-muted">|</span>
                <button
                  type="button"
                  className="btn btn-link p-0 m-0 text-red-500 hover:text-red-700 d-flex align-items-center gap-1 small"
                  style={{ textDecoration: "none", color: "#dc3545" }}
                  onClick={() => handleDeleteUser(user.id, `${user?.full_name}`)}
                >
                  <FiTrash2 /> {lang("common.delete", "Delete")}
                </button>
              </div>
            </div>
          </>
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
        const phone = row.original?.phone_number || ''
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
      accessorKey: 'qrCode',
      header: () => 'QR Code',
      cell: ({ row }) => {
        const user = row.original
        const roleName = user?.role?.name?.toLowerCase()
        const isInvestor = roleName === 'investor'

        if (!isInvestor) {
          return <span className="text-muted">-</span>
        }

        return (
          <Button
            variant="contained"
            className="common-grey-color"
            size='small'
            sx={{
              backgroundColor: "#28a745",
              color: "#fff",
              padding: "4px 8px",
              fontSize: "12px",
              textTransform: "none",
              "&:hover": { backgroundColor: "#218838" },
            }}
            onClick={() => handleShowQRCode(buildUploadUrl(user?.qr_code), user?.full_name)}
          >
            <BsQrCode className="me-1" />
            {lang("table.qr_code")}
          </Button>
        )
      },
      meta: {
        headerClassName: 'text-center'
      }
    },
    ...(showActionColumn
      ? [{
        accessorKey: 'actions',
        header: () => lang("table.actions"),
        cell: ({ row }) => {
          const user = row.original;

          return (
            <div className="hstack gap-2 justify-content-end">
              {canEdit("users") && (
                <Link
                  href={`/admin/users/edit?id=${user.id}`}
                  className="avatar-text avatar-md"
                >
                  <FiEdit3 />
                </Link>
              )}

              {canDelete("users") && (
                <a
                  className="avatar-text avatar-md"
                  onClick={() =>
                    handleDeleteUser(user.id, `${user?.full_name}`)
                  }
                >
                  <FiTrash2 />
                </a>
              )}
            </div>
          );
        },
        meta: {
          headerClassName: 'text-center',
        },
      }]
      : []),
  ]

  return (

    <div className="p-6 bg-white shadow-md rounded-3xl">
      {/* Filters */}
      <div className="flex-wrap items-center w-full gap-2 mt-4 mb-4 d-flex justify-content-between">
        <div className="filter-button d-flex flex-column flex-md-row align-items-stretch align-items-md-center gap-2 gap-md-3 w-100">
          <Autocomplete
            size="small"
            options={roles}
            value={roles.find(r => String(r.id) === String(filters.role)) || null}
            onChange={(e, newValue) => {
              const newRole = newValue ? String(newValue.id) : ''
              const newFilters = { ...filters, role: newRole, status: '' }
              setFilters(newFilters)
              fetchUsers(1, pageSize, newFilters.search, newRole, '')
            }}
            getOptionLabel={(option) => option.name ? option.name.charAt(0).toUpperCase() + option.name.slice(1) : ''}
            isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
            renderInput={(params) => (
              <TextField {...params} label={lang("common.all_roles", "All Roles")} placeholder={lang("common.all_roles", "All Roles")} />
            )}
            sx={{ width: { xs: '100%', md: 220 } }}
          />
          <Autocomplete
            size="small"
            options={[
              { value: '1', label: lang("common.active", "Active") },
              { value: '0', label: lang("common.inactive", "Inactive") },
            ]}
            value={
              [{ value: '1', label: lang("common.active", "Active") }, { value: '0', label: lang("common.inactive", "Inactive") }]
                .find(o => o.value === String(filters.status)) || null
            }
            onChange={(e, newValue) => {
              const newStatus = newValue ? newValue.value : ''
              const newFilters = { ...filters, status: newStatus }
              setFilters(newFilters)
              fetchUsers(1, pageSize, newFilters.search, newFilters.role, newStatus)
            }}
            getOptionLabel={(option) => option.label || ''}
            renderInput={(params) => (
              <TextField {...params} label={lang("common.all_status", "All Status")} placeholder={lang("common.all_status", "All Status")} />
            )}
            sx={{ width: { xs: '100%', md: 200 } }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="position-relative">
        <Table
          data={users}
          columns={columns}
          serverSideTotal={pagination.total}
          pageIndex={pagination.page - 1}
          pageSize={pagination.limit}
          onPaginationChange={handlePaginationChange}
          onSearchChange={handleSearchChange}
          initialPageSize={pagination.limit}
        />
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowQRModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <BsQrCode className="me-2" />
                  {lang("table.qr_code")} - {selectedQRCode?.userName}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowQRModal(false)}></button>
              </div>
              <div className="modal-body text-center p-4">
                {selectedQRCode?.qrCode ? (
                  <div>
                    <img
                      src={selectedQRCode.qrCode}
                      alt={`QR Code for ${selectedQRCode.userName}`}
                      className="img-fluid"
                      style={{ maxWidth: '300px', width: '100%' }}
                    />
                    <p className="mt-3 text-muted">{lang("table.scan_qr_code")}</p>
                  </div>
                ) : (
                  <div className="text-muted">
                    <BsQrCode size={48} className="mb-3" />
                    <p>{lang("table.no_qr_code_available")}</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowQRModal(false)}>
                  {lang("modal.close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersTable