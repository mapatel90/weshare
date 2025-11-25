
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiPatch } from '@/lib/api'
import { showSuccessToast, showErrorToast } from '@/utils/topTost'


const ChangePasswordAdminPage = () => {
    const router = useRouter()
    const { user, logout } = useAuth()
    const { lang } = useLanguage()

    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        const newErrors = {}
        if (!currentPassword) newErrors.currentPassword = lang('placeholders.enterpassword') || 'Please enter current password'
        if (!newPassword) newErrors.newPassword = lang('placeholders.enterpassword') || 'Please enter new password'
        else if (newPassword.length < 8) newErrors.newPassword = lang('validation.passwordTooShort') || 'Password must be at least 8 characters'
        if (newPassword !== confirmPassword) newErrors.confirmPassword = lang('validation.newpasswordsNotMatch') || 'Passwords do not match'
        setErrors(newErrors)
        if (Object.keys(newErrors).length) return

        if (!user?.id) {
            showErrorToast('User not found')
            return
        }

        setLoading(true)
        try {
            // backend routes are mounted under /api, so include the prefix
            await apiPatch(`/api/users/${user.id}/password`, { currentPassword, newPassword })
            showSuccessToast(lang('messages.success') || 'Password updated successfully')
            // 🔒 Auto logout after successful password change
            setTimeout(() => {
                logout();
            }, 1500);

        } catch (err) {
            const msg = err?.message || (err?.data && err.data.message) || 'Error updating password'
            showErrorToast(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        // <ProtectedRoute>
        <div className="container py-2">
            <div className="row justify-content-center">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">{lang('header.changepassword')}</h5>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="card-body">
                                <div className="mb-3">
                                    <label className="form-label">{lang('authentication.currentPassword') || 'Current Password'}</label>
                                    <input type="password" className={`form-control ${errors.currentPassword ? 'is-invalid' : ''}`} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                                    {errors.currentPassword && <div className="invalid-feedback">{errors.currentPassword}</div>}
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">{lang('authentication.newPassword') || 'New Password'}</label>
                                    <input type="password" className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                    {errors.newPassword && <div className="invalid-feedback">{errors.newPassword}</div>}
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">{lang('authentication.confirmNewPassword') || 'Confirm New Password'}</label>
                                    <input type="password" className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                                    {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
                                </div>
                            </div>
                            <div className="card-footer d-flex justify-content-end col-md-12">
                                {/* <button type="button" className="btn btn-secondary me-2" onClick={() => router.back()}>{lang('common.cancel') || 'Cancel'}</button> */}
                                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? (lang('common.loading') || 'Loading...') : (lang('common.submit') || 'Submit')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        // </ProtectedRoute>
    )
}

export default ChangePasswordAdminPage