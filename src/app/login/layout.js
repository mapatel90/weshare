'use client';
import LanguageSelector from '@/components/shared/LanguageSelector'
import React from 'react'

export default function LoginLayout({ children }) {
  return (
    <div className="auth-layout">
      {/* <LanguageSelector /> */}
      {children}
    </div>
  )
}