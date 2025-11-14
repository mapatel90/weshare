'use client'
import React, { useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

const DynamicTitle = ({ titleKey, prefix = 'WeShare' }) => {
  const { lang, currentLanguage } = useLanguage()

  useEffect(() => {
    const localized = lang(titleKey, titleKey)
    document.title = `${prefix} | ${localized}`
  }, [titleKey, prefix, lang, currentLanguage])

  return null
}

export default DynamicTitle


