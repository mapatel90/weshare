'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiPost, apiGet, apiUpload } from '@/lib/api'
import Swal from 'sweetalert2'
import { useLanguage } from '@/contexts/LanguageContext'
import UserForm from './UserForm'
import { showSuccessToast, showErrorToast } from '@/utils/topTost'

const UsersCreateForm = () => {
  const router = useRouter()
  const { lang } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState([])
  const [loadingRoles, setLoadingRoles] = useState(false)

  const params = { status: 1 };   // e.g. 1

  const queryString = new URLSearchParams(params).toString();

  // roles will be passed into UserForm via initialData.roles

  // Load active roles for the User Role dropdown
  useEffect(() => {
    let mounted = true
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

  // create handler passed to shared form
  const handleCreate = async (submitData) => {
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
        const response = await apiUpload('/api/users', formData, { method: 'POST' })
        if (response.success) {
          showSuccessToast(lang('messages.userCreated') || 'User created successfully')
          router.push('/admin/users/list')
        } else {
          throw new Error((response && response.message) || 'Failed to create user')
        }
      } else {
        // Use regular apiPost for non-file data
        const response = await apiPost('/api/users', submitData)
        if (response.success) {
          showSuccessToast(lang('messages.userCreated') || 'User created successfully')
          router.push('/admin/users/list')
        } else {
          throw new Error((response && response.message) || 'Failed to create user')
        }
      }
    } catch (error) {
      console.error('Error creating user:', error)
      showErrorToast(error.message || 'Failed to create user')
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <UserForm
      initialData={{}}
      roles={roles}
      includePassword={true}
      onSubmit={handleCreate}
    />
  )
}

export default UsersCreateForm