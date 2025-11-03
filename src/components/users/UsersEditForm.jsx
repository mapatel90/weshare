'use client'
import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiGet, apiPut } from '@/lib/api'
import Swal from 'sweetalert2'
import { useLanguage } from '@/contexts/LanguageContext'
import UserForm from './UserForm'
import { showSuccessToast, showErrorToast } from '@/utils/topTost'

const UsersEditForm = () => {
  const router = useRouter()
  const { lang } = useLanguage()
  const searchParams = useSearchParams()
  const userId = searchParams.get('id')

  const [loading, setLoading] = useState(false)
  const [loadingUser, setLoadingUser] = useState(true)
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  const [originalUsername, setOriginalUsername] = useState('')
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [roles, setRoles] = useState([])
  const [loadingRoles, setLoadingRoles] = useState(false)

  // roles and location handling will be provided by UserForm; fetch roles below and pass into initialData

  // Load user data
  useEffect(() => {
    if (userId) {
      fetchUser()
    }
  }, [userId])

  // Load active roles for the User Role dropdown
  useEffect(() => {
    let mounted = true
    const params = { status: 1 }
    const queryString = new URLSearchParams(params).toString()

    const fetchRoles = async () => {
      setLoadingRoles(true)
      try {
        const res = await apiGet(`/api/roles?${queryString}`)
        if (!mounted) return
        if (res && res.success && Array.isArray(res.data.roles)) {
          setRoles(res.data.roles)
        } else if (Array.isArray(res)) {
          // fallback in case api helper returns array directly
          setRoles(res)
        }
      } catch (err) {
        console.error('Error loading roles:', err)
      } finally {
        if (mounted) setLoadingRoles(false)
      }
    }

    fetchRoles()

    return () => { mounted = false }
  }, [])

  const fetchUser = async () => {
    try {
      setLoadingUser(true)
      const response = await apiGet(`/api/users/${userId}`)

      if (response.success) {
        const user = response.data
        setFormData({
          username: user.username || '',
          fullName: user.fullName || '',
          email: user.email || '',
          password: user.password || '',
          confirmPassword: user.password || '',
          phoneNumber: user.phoneNumber || '',
          userRole: user.userRole?.toString() || '',
          address1: user.address1 || '',
          address2: user.address2 || '',
          countryId: user.countryId?.toString() || '',
          stateId: user.stateId?.toString() || '',
          cityId: user.cityId?.toString() || '',
          zipcode: user.zipcode || '',
          status: user.status?.toString() || ''
        })

        setOriginalUsername(user.username || '')
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
      setLoadingUser(false)
    }
  }

  // handler passed to the shared form
  const handleUpdate = async (submitData) => {
    try {
      setLoading(true)
      const response = await apiPut(`/api/users/${userId}`, submitData)
      if (response.success) {
        showSuccessToast(lang('messages.userUpdated') || 'User updated successfully')
        // await Swal.fire({ icon: 'success', title: 'Success!', text: 'User updated successfully', timer: 1500, showConfirmButton: false })
        router.push('/admin/users/list')
      } else {
        throw new Error((response && response.message) || 'Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      showErrorToast(error.message || 'Failed to update user')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Commented out - using global loader instead
  // if (loadingUser) {
  //   return (
  //     <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
  //       <div className="spinner-border text-primary" role="status">
  //         <span className="visually-hidden">Loading...</span>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <UserForm
      initialData={formData}
      roles={roles}
      includePassword={true}
      excludeId={userId}
      onSubmit={handleUpdate}
    />
  )
}

export default UsersEditForm