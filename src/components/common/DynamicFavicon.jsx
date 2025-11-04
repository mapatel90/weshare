'use client'
import React, { useEffect } from 'react'
import useSettings from '@/hooks/useSettings'

const DynamicFavicon = () => {
  const { settings, getSetting } = useSettings()

  useEffect(() => {
    const faviconPath = getSetting('site_favicon', '') || '/images/default_icon.png'
    
    // Remove existing favicon links
    const existingLinks = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
    existingLinks.forEach(link => {
      link.remove()
    })

    // Detect image type from path
    const ext = faviconPath.split('.').pop()?.toLowerCase()
    let type = 'image/x-icon'
    if (ext === 'png') type = 'image/png'
    else if (ext === 'jpg' || ext === 'jpeg') type = 'image/jpeg'
    else if (ext === 'svg') type = 'image/svg+xml'
    else if (ext === 'gif') type = 'image/gif'

    // Create new favicon link
    const link = document.createElement('link')
    link.rel = 'icon'
    link.type = type
    link.href = faviconPath
    document.head.appendChild(link)

    // Also add as shortcut icon for better browser compatibility
    const shortcutLink = document.createElement('link')
    shortcutLink.rel = 'shortcut icon'
    shortcutLink.type = type
    shortcutLink.href = faviconPath
    document.head.appendChild(shortcutLink)
  }, [settings, getSetting])

  return null
}

export default DynamicFavicon

