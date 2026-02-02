'use client'
import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiGet, apiPut, apiUpload } from '@/lib/api'
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
  const [originalUsername, setOriginalUsername] = useState('')
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
          fullName: user.full_name || '',
          email: user.email || '',
          password: user.password || '',
          confirmPassword: user.password || '',
          phoneNumber: user.phone_number || '',
          userRole: user.role_id?.toString() || '',
          address_1: user.address_1 || '',
          address_2: user.address_2 || '',
          countryId: user.country_id?.toString() || '',
          stateId: user.state_id?.toString() || '',
          cityId: user.city_id?.toString() || '',
          zipcode: user.zipcode || '',
          qrCode: user.qr_code || '',
          status: user.status?.toString() || '',
          language: user.language
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
      
      // Check if there's a QR code file to upload
      if (submitData.qrCodeFile) {
        const formData = new FormData()
        
        // Append all form fields
        Object.keys(submitData).forEach(key => {
          if (key === 'qrCodeFile') {
            formData.append('qrCode', submitData[key])
          } else if (submitData[key] !== null && submitData[key] !== undefined) {
            formData.append(key, submitData[key])
          }
        })
        
        // Use apiUpload for file upload
        const response = await apiUpload(`/api/users/${userId}`, formData, { method: 'PUT' })
        if (response.success) {
          showSuccessToast(lang('messages.userUpdated') || 'User updated successfully')
          router.push('/admin/users/list')
        } else {
          throw new Error((response && response.message) || 'Failed to update user')
        }
      } else {
        // Use regular apiPut for non-file data
        const response = await apiPut(`/api/users/${userId}`, submitData)
        if (response.success) {
          showSuccessToast(lang('messages.userUpdated') || 'User updated successfully')
          router.push('/admin/users/list')
        } else {
          throw new Error((response && response.message) || 'Failed to update user')
        }
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