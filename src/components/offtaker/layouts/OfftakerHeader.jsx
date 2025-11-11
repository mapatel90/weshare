'use client'
import React, { useContext, useEffect, useState } from 'react'
import { FiAlignLeft, FiMoon, FiSun, FiBell, FiUser, FiLogOut, FiSettings } from "react-icons/fi"
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import Image from 'next/image'

const OfftakerHeader = ({ toggleSidebar, sidebarOpen }) => {
    const router = useRouter()
    const { lang } = useLanguage()
    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [isDarkMode, setIsDarkMode] = useState(false)

    useEffect(() => {
        const savedTheme = localStorage.getItem("skinTheme")
        if (savedTheme === "dark") {
            setIsDarkMode(true)
            document.documentElement.classList.add("app-skin-dark")
        }
    }, [])

    const handleThemeToggle = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove("app-skin-dark")
            localStorage.setItem("skinTheme", "light")
            setIsDarkMode(false)
        } else {
            document.documentElement.classList.add("app-skin-dark")
            localStorage.setItem("skinTheme", "dark")
            setIsDarkMode(true)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        router.push('/offtaker/login')
    }

    return (
        <header className="offtaker-header">

            {/* <SidebarToggleBtn /> */}
            <div className="flex items-center gap-2 ltr:-mr-1.5 rtl:-ml-1.5">
                {/* <Search
                    renderButton={(open) => (
                        <>
                            <Button
                                onClick={open}
                                unstyled
                                className="h-8 w-64 justify-between gap-2 rounded-full border border-gray-200 px-3 text-xs-plus hover:border-gray-400 dark:border-dark-500 dark:hover:border-dark-400 max-sm:hidden"
                            >
                                <div className="flex items-center gap-2">
                                    <MagnifyingGlassIcon className="size-4" />
                                    <span className="text-gray-400 dark:text-dark-300">
                                        Search here...
                                    </span>
                                </div>
                                <SlashIcon />
                            </Button>

                            <Button
                                onClick={open}
                                variant="flat"
                                isIcon
                                className="relative size-9 rounded-full sm:hidden"
                            >
                                <SearchIcon className="size-6 text-gray-900 dark:text-dark-100" />
                            </Button>
                        </>
                    )}
                /> */}
                {/* <Notifications /> */}
                {/* <RightSidebar /> */}
                {/* <LanguageSelector /> */}
            </div>
        </header>
    )
}

export default OfftakerHeader
