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
import { Button } from '@mui/material'
import { buildUploadUrl } from '@/utils/common'
import usePermissions from '@/hooks/usePermissions'

// Status mapping
const statusMapping = {
  0: { label: 'Inactive', color: 'danger' },
  1: { label: 'Active', color: 'success' }
}

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
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedQRCode, setSelectedQRCode] = useState(null)
  const router = useRouter()
  const { canDelete, canEdit } = usePermissions();
  const showActionColumn = canEdit("users") || canDelete("users");


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

  // Pagination handler
  const handlePageChange = (page) => {
    fetchUsers(page, filters.search, filters.role, filters.status)
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
    <div>
      {/* Table */}
      <div className="position-relative">
        <Table data={users} columns={columns} />
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